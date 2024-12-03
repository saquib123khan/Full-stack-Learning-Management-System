import Course from "../models/course.model.js"
import AppError from "../utils/error.utils.js"
import cloudinary from 'cloudinary'
import fs from 'fs/promises'

    const getAllCourses = async (req, res, next)=>{
        const courses = await Course.find({}).select('-lectures')
     
        res.status(200).json({
         success: true,
         message: 'All courses',
         courses,
        })
     }


const getLectureByCourseId = async (req, res, next)=>{
    
        const {id} = req.params
        const course = await Course.findById(id)

        res.status(200).json({
            success:true,
            message:'Course lectures fetched successfully',
            lectures: course.lectures
        })
    } 

    const createCourse = async (req, res, next)=>{
       
        
            const {title, description, category, createdBy} = req.body

            if (!title || !description || !category || !createdBy ) {
                return next(new AppError('All fields are required', 400));
              }

        const course = await Course.create({
            title,
            description,
            category,
            createdBy,
            thumbnail :{
               public_id: 'Dummy',
               secure_url: 'Dummy',
            },
        })

        if(!course){
            return next (new AppError('course could not created', 500))
        }

        if(req.file){
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: 'LMS',
                width: 250,
                height: 250,
                gravity: 'faces',
                crop: 'fill'
                
          })

          if(result){
            course.thumbnail.public_id = result.public_id;
            course.thumbnail.secure_url = result.secure_url
          }

          fs.rm(`uploads/${req.file.filename}`);
        }



        await course.save();

        res.status(200).json({
            success: true,
            message:'course created successfully',
            course
        })

        }

    const updateCourse = async (req, res, next) => {
       
        try {
            const {id} = id.params;
        const course = await Course.findByIdAndUpdate(
            id,
            {
               $set: req.body
            },
            {
                runValidators: true
            }
        );

        if(!course){
           return next(new AppError('Course with given id does not exists', 500))
        }
        } catch (error) {
            return next(
                new AppError(error.message, 500)
            )
        }
    }

    const deleteCourse = async (req, res, next)=>{
          try {
            const {id} = req.params;

            const course = await Course.findByIdAndDelete(id)
            
            if(!course){
               return next (new AppError('course with given id does not exists', 500))
            }

            res.status(200).json({
                success: true,
                message:'Course deleted successfully' 
            })
          } catch (error) {
            return next (new AppError(error.message, 500))
          }
    }

    const addLectureToCourseById = async (req, res, next)=>{
           
       try {
        const {title, description} = req.body;
        const {id} = req.params;

        if(!title || !description){
           return next(new AppError('All field are required', 400))
        }
          
        const course = await Course.findById(id)

        if(!course){
            return next(new AppError('Course with given id does not exists', 400))
        }
        
        const lectureData = {
            title,
            description,
            lecture: {}
            
        }

         if(req.file){
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'LMS', // save file in a folder name lms
                    width: 250,
                    height: 250,
                    gravity: 'faces',
                    crop: 'fill'
                    
              })
    
              if(result){
                lectureData.lecture.public_id = result.public_id;
                lectureData.lecture.secure_url = result.secure_url
              }
    
              fs.rm(`uploads/${req.file.filename}`);
         }

         course.lectures.push(lectureData)

         course.numbersOflectures = course.lectures.length

         await course.save()

         res.status(200).json({
            success: true,
            message:'Add lecture successfully',
            course
         })

       } catch (error) {
        return next ( new AppError(error.message, 400))
       }

    }


export{
    getAllCourses,
    getLectureByCourseId,
    createCourse,
    updateCourse,
    deleteCourse,
    addLectureToCourseById
}