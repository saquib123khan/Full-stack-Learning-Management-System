import AppError from "../utils/error.utils.js"
import User  from "../models/user.models.js"
import cloudinary from "cloudinary"
import crypto from 'crypto'

import fs from "fs/promises"
import sendEmail from "../utils/sendmail.js"
const cookieOption = {
  // maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
  httpOnly: true,
  secure: true
}
const register =  async (req, res, next) => {
   // Destructuring the necessary data from req object
   const { name, email, password } = req.body;

   // Check if the data is there or not, if not throw error message
   if (!name || !email || !password) {
     return next(new AppError('All fields are required', 400));
   }
 
   // Check if the user exists with the provided email
   const userExists = await User.findOne({ email });
 
  //  // If user exists send the reponse
  //  if (userExists) {
  //    return next(new AppError('Email already exists', 409));
  //  }

  const user =  await User.create({
     name,
     email,
     password,
     avatar:{
        public_id: email,
        secure_url:'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg',


     }
  })

  if(!user){
    return next(new AppError('user registertion failed', 500))
  }


  console.log('file datails >', JSON.stringify(req.file));
  if (req.file){
       try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'LMS',
          width: 250,
          height: 250,
          gravity: 'faces',
          crop: 'fill'
        })

        if(result){
          user.avatar.public_id = result.public_id;
          user.avatar.secure_url = result.secure_url

          //Remove file from server
          fs.rm(`uploads/${req.file.filename}`) 
        }
       } catch (error) {
        return next(new AppError(error || 'file not uploaded, Please try again', 500))
       }
  }

  await user.save()
  user.password = undefined

  const token = await user.generateJWTToken()

  res.cookie('token', token, cookieOption)

   res.status(201).json({
    success: true,
    message:'user registered successfully',
    user
   })
}

const login =  async (req, res, next) => {

  try {
    const {email, password} = req.body

  if(!email || !password){
    return next (new AppError('All field are required', 400))
  }

  const user = await User.findOne({
    email
  }).select('+password')

  if(!user || !user.comparePassword(password)){
    return next(new AppError('Email or Password does not match', 400))
  }

  const token = await user.generateJWTToken()
  user.password = undefined

  res.cookie('token', token, cookieOption)

  res.status(200).json({
    success:true,
    message:'user loggedin successfully',
    user
  })
  } catch (error) {
    return next(new AppError('error', 500))
  }
}

const logout = (req, res) => {
    res.cookie('token', null, {
     secure: true,
     maxAge: 0,
     httpOnly: true
    })

    res.status(200).json({
   success: true,
     message: ' User logged Out Successfully'
  })
}

const getProfile = async (req, res, next) => {
   const userId = req.user.id 
   const user = await User.findById(userId)

   res.status(200).json({
    success:true,
    message:'User details',
    user
   })
}

const forgotPassword = async (req, res, next)=>{
   const {email} = req.body

   if(!email){
    return next (new AppError('Email are required', 400))
   }

   const user = await User.findOne({email})
   if(!user){
    return next (new AppError('Email is not registered', 400))
   }
  
   const resetToken = await user.generatePasswordResetToken()

   await user.save()
    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`

    const subject = 'Reset Password'
    const message = `You can reset your password by clicking <a href=${resetPasswordURL} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordURL}.`;
    
    try {
     await sendEmail(email, subject, message)

      res.status(200).json({
        success: true,
        message: `Reset password token has been send ${email} successfully`,
        user
      })
    } catch (error) {
      user.forgotPasswordToken = undefined
      user.forgotPasswordExpiry = undefined

      await user.save()
      return next (new AppError(error.message, 400))
    }
}

const resetPassword = async (req, res) => {
    const {resetToken} = req.params;
    const {password} = req.body;

    const forgotPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

    const user = await User.findOne({
      forgotPasswordToken,
      forgotPasswordExpiry:{$gt: Date.now()}
    });

    if(!user){
      return next (new AppError('Token is invalid or expired, please try again', 400))
    }

    user.password = password
    user.forgotPasswordToken = undefined
    user.forgotPasswordExpiry = undefined

    user.save()

    res.status(200).json({
      success: true,
      message: 'password change successfully',
      user
    })
}

const changePassword = async (req, res) =>{
 
   const {oldPassword, newPassword} = req.body

   const {id} = req.user

   if(!oldPassword || !newPassword){
    return next (new AppError('All field are mandatory', 400))
   }

   const user = await User.findById(id).select('+password')

   if(!user){
    return next (new AppError('User does not exists', 400))
   }

   const isPasswordvalid = await user.comparePassword(oldPassword)

   if(!isPasswordvalid){
    return next (new AppError('old password invalid', 400))
   }

   user.password = newPassword

   await user.save()

   user.password = undefined

   res.status(200).json({
    success: true,
    message: 'Password changed successfully'
   })


}

const updateUser = async (req, res) =>{
     
  const {name} = req.body;

  const {id} = req.user.id;

  const user = await User.findById(id)

  if(!user){
    return next (new AppError('old password invalid', 400))
  }

  if (req.name) {
    user.name = name
  }

  if(req.file){
    await cloudinary.v2.uploader.destroy(user.avatar.public_id)
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'LMS',
        width: 250,
        height: 250,
        gravity: 'faces',
        crop: 'fill'
      })

      if(result){
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url

        //Remove file from server
        fs.rm(`uploads/${req.file.filename}`) 
      }
     } catch (error) {
      return next(new AppError(error || 'file not uploaded, Please try again', 500))
     }
}
     await user.save()

     res.status(200).json({
      success:true,
      message: "User details update successfully"
     })
  }

   
export{
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
}