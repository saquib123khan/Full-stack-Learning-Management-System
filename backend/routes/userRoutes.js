import { Router } from "express";
import {changePassword, forgotPassword, getProfile, login, logout, register, resetPassword, updateUser} from '../controllers/userControllers.js'
import { isLoggedin } from "../middleWare/auth.middleware.js";
import upload from "../middleWare/multer.middleWare.js";


const router = Router();


router.post('/register',upload.single('avatar'), register)
router.post('/login', login)
router.post('/logout', logout)
router.post('/me', isLoggedin, getProfile)
router.post('/forgot-password',forgotPassword)
router.post('/reset-password', resetPassword)
router.post('change-password',isLoggedin, changePassword)
router.put('/update', isLoggedin, upload.single('avatar'), updateUser)


export default router;