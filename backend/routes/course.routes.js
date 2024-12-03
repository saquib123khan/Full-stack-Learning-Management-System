import { Router } from "express";
import { addLectureToCourseById, createCourse, deleteCourse, getAllCourses, getLectureByCourseId, updateCourse } from "../controllers/course.Controllers.js";
import { authorizedRoles, isLoggedin } from "../middleWare/auth.middleware.js";
import upload from "../middleWare/multer.middleWare.js";


const router = Router()

router.route('/' ).get( getAllCourses)
router.post('/',  upload.single('thumbnail'), createCourse)
router.route('/id:').get( getLectureByCourseId)
router.put('/id:',  isLoggedin,authorizedRoles('ADMIN'), updateCourse)
router.delete('/id:',  isLoggedin, authorizedRoles('ADMIN'), deleteCourse)
router.post('/id', isLoggedin, authorizedRoles('ADMIN'),upload.single('lecture'), addLectureToCourseById )

export default router