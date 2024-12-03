import {Schema, model} from 'mongoose'
import bcrypt, { compare } from 'bcrypt'
import JWT from 'jsonwebtoken'
import crypto from 'crypto'

const userSchema = new Schema({
    name: {
        type: 'String',
        maxlenght: [30, 'name should be less than 30 characters'],
        lowercase: true,
        trim: true
    },
    email: {
        
        type: 'String',
        required: [true, 'email is required'],
        lowercase: true,
        trim: true,
        // unique: true
    },
    password:{
        type: 'String',
        required: [true, 'Password is required'],
        minlength: [8, 'password must be atleast 8 characters'],
        select: false
    },
    avatar: {
        public_id:{
            type: 'String'
        },
        secure_url:{
            type: 'String'
        }
    },
    role:{
       type: 'String',
       enum: ['USER', 'ADMIN'],
       default: 'USER'
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    subscription:{
        id: String,
        status: String
    }
},
{
    timestamps: true
})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next()
    }
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods = {
    generateJWTToken: async function (){
        return await JWT.sign(
            {id: this.id, email: this.email, subcription: this.subcription, role: this.role},
            process.env.JWT_SECRET,
            {expiresIn: '240h'} 
            
        )
    },

    comparePassword: async function(plainTextPassword){
        return await bcrypt.compare(plainTextPassword, this.password)
    },

    generatePasswordResetToken: async function (){
        const resetToken = crypto.randomBytes(20).toString('hex')
        
        this.forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
        this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000 // 15 min from now

        return resetToken
    }
}

const User = model('User', userSchema)

export default User