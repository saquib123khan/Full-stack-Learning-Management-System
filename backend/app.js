import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

import userRoutes from './routes/userRoutes.js'
import courseRoutes from './routes/course.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import errorMiddleware from './middleWare/error.middleware.js'

const app = express()

// Enable JSON and URL-encoded form data handling
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Enable CORS and ensure credentials are correctly handled
app.use(cors({
    origin: process.env.FRONTEND_URL, // Ensure this is set correctly
    credentials: true,  // Fixed typo here
}))

// Enable cookies and logging
app.use(cookieParser())
app.use(morgan('dev'))

// Routes
app.use('/api/v1/user', userRoutes)
app.use('/api/v1/courses', courseRoutes) // Changed to match "courses" from earlier error
app.use('/api/v1/payments', paymentRoutes)

// Basic ping route for testing server availability
app.use('/ping', (req, res) => {
    res.send('Pong')
})

// Error handling middleware
app.use(errorMiddleware)

export default app;
