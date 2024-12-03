import {Router} from 'express'

import { allPayments, buySubscription, cancelSubscription, getRazorpayApiKey, verifySubscription } from '../controllers/payment.controllers.js'
import { authorizeSubscriber, authorizedRoles, isLoggedin } from '../middleWare/auth.middleware.js'

const router = Router()


router.get('/razorpay-key',  isLoggedin, authorizeSubscriber, authorizedRoles('ADMIN'), getRazorpayApiKey)
router.post('/subscribe',isLoggedin, buySubscription)
router.post('/verify',  isLoggedin,authorizedRoles('ADMIN'), verifySubscription)
router.post('/unSubscribe',  isLoggedin,authorizedRoles('ADMIN'), cancelSubscription)
router.post('/allPayments',  isLoggedin,authorizedRoles('ADMIN'), allPayments)

export default router
