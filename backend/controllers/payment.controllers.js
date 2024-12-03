import Payment from "../models/payment.model.js"
import User from "../models/user.models.js"
import { razorpay } from "../server.js"
import AppError from "../utils/error.utils.js"
import crypto from 'crypto'

export const getRazorpayApiKey = async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: 'Razorpay Api key',
        key: process.env.RAZORPAY_KEY_ID
    })
    
    
}

export const buySubscription = async (req, res, next) => {

    const {id} = req.user

    const user = await User.findById(id)

    if(!user){
       return next (new AppError ('user does not exists', 400))
    }

    // checking the user role
    if(user.role === 'ADMIN'){
        return next (new AppError ('Admin can not purchase subscription', 400))
    }

    const subscription = await razorpay.subscription.create({
        plan_id: process.env.RAZORPAY_PLAN_ID, // the unique plan id.
        customer_notify: 1 // 1 means razorpay will handle notifying the customer, 0 means we will not notify the customer.
    })

    // Adding the ID and the status to the user account
    user.subscription.id = subscription.id
    user.subscription.status = subscription.status

    // Saving the user object
    await user.save()

    res.status(200).json({
        success: true,
        message:'subscribed successfully',
        subscription_id: subscription.id
    })
}

export const verifySubscription = async (req, res, next) => {
   
    const {id} = req.user
    const {razorpay_payment_id, razorpay_signature, razorpay_subscription_id} = req.body

    const user = await User.findById(id)
    if(!user){
       return next (new AppError('Unauthorazied, please login'))
    }

    const subscriptionId = subscription.id

    const generateSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(`${razorpay_payment_id}|${subscriptionId}`)
    .digest('hex');

    if(razorpay_signature !== generateSignature){
         return next (new AppError('Payment not verified, please try again', 500))
    }

    // If they match create payment and store it in the DB
    await Payment.create({
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature
    })

    // Update the user subscription status to active (This will be created before this)
    user.subscription.status = 'active'

    // Save the user in the DB with any changes
    await user.save()

    res.status(200).json({
        success: true,
        message:'Payment verified successfully'
    })
}

export const cancelSubscription = async (req, res, next) => {

    try {
        const {id} = req.user;
        const user = await User.findById(id)

        if(!user){
            return next (new AppError ('user does not exists', 400))
         }
     
         // checking the user role
         if(user.role === 'ADMIN'){
             return next (new AppError ('Admin can not purchase subscription', 400))
         }

         const subscriptionId = user.subscription.id
         // Creating a subscription using razorpay that we imported from the server 
         const subscription = await razorpay.subscription.cancel(subscriptionId)

          // Adding the subscription status to the user account
          user.subscription.status = subscription.status

          await user.save()

          // Finding the payment using the subscription ID

          const payment = await Payment.findById({
            razorpay_subscription_id: subscriptionId
          })
          // Getting the time from the date of successful payment (in milliseconds)
          const timeSinceSubscribed = Date.now - payment.createdAt

           // refund period which in our case is 14 days
           const refundPeriod = 14 * 24 * 60 * 60 * 1000;

           //check if refund period has expired or not
           if(refundPeriod <= timeSinceSubscribed){
             return next (new AppError('Refund period is over, so there will not be any refund provided'))
           }
           
           // If refund period is valid then refund the full amount that the user has paid
           await razorpay.payment.refund(payment.razorpay_payment_id, {
            speed: 'optimum' //This is required
           })

           user.subscription.id = undefined
           user.subscription.status = undefined

           await user.save()
           await payment.findByIdAndDelete(id)

           res.status(200).json({
            success: true,
            message: 'Subscription canceled successfully'
           })
    } catch (error) {
        return next (new AppError(error.message, 500))
    }
}

export const allPayments = async (req, res, next) => {
    try {
        const {count, skip} = req.params

        const subscription = await razorpay.subscription.all({
            count : count ? count:10,
            skip : skip ? skip:0
        });

        const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
    ];

     const finalMonths = {
        January: 0,
    February: 0,
    March: 0,
    April: 0,
    May: 0,
    June: 0,
    July: 0,
    August: 0,
    September: 0,
    October: 0,
    November: 0,
    December: 0,
    };

    const monthlyWisePayments = subscription.items.map((payment) => {
        // Convert Unix timestamp to a human-readable month index (0 for January, 11 for December)
        const monthsInNumbers = new Date(payment.start_at * 1000);
        return monthNames[monthsInNumbers.getMonth()];
    });
    
    monthlyWisePayments.forEach((month) => {
        Object.keys(finalMonths).forEach((objMonth) => {
            if (month === objMonth) {
                finalMonths[month] += 1;
            }
        });
    });
    
    const monthlySalesRecord = [];
    Object.keys(finalMonths).forEach((objMonth) => {
        monthlySalesRecord.push(finalMonths[objMonth]);
    });
    
    

        res.status(200).json({
            success: true,
            message: 'All payments',
            subscription,
            finalMonths,
            monthlySalesRecord,
        })
    } catch (error) {
        return next (new AppError(error.message, 500))
    }
}