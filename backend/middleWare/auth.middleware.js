import AppError from "../utils/error.utils.js"
import jwt from 'jsonwebtoken'

const isLoggedin = async (req, res, next) => {
   const {token} = req.cookies;
   
   if (!token) {
    return next(new AppError("Unauthorized, please login to continue", 401));
  }

  // Decoding the token using jwt package verify method
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);

  // If no decode send the message unauthorized
  if (!decoded) {
    return next(new AppError("Unauthorized, please login to continue", 401));
  }

  // If all good store the id in req object, here we are modifying the request object and adding a custom field user in it
  req.user = decoded;

  // Do not forget to call the next other wise the flow of execution will not be passed further
  next();
}

// const authorizedRoles = (...role) => (req, res, next) => {
//   const currentUserRole = req.user.role;
//   if(!role.includes(currentUserRole)){
//    return next(new AppError('You dont have permission to access this route'))
//   }
//   next()
// }
const authorizedRoles = (...roles) => (req, res, next) => {
  // Ensure that req.user and req.user.role are defined
  if (!req.user || !req.user.role) {
    return next(new AppError('User is not authenticated or role is missing', 403)); // Send appropriate error and status code
  }

  const currentUserRole = req.user.role;

  // Check if the user's role is included in the allowed roles
  if (!roles.includes(currentUserRole)) {
    return next(new AppError('You do not have permission to access this route', 403)); // Forbidden error
  }

  next();
};


const authorizeSubscriber = async (req, res, next) => {

    const subscription = req.user.subscription;
    const currentUserRole = req.user.role;

    const user = await User.findById(req.user.id)
    if(user.currentUserRole !== 'ADMIN' && user.subscription.status !== 'active'){
        return next (new AppError('Please subscribe to access this route', 403))
    }

    next()
}

export{
    isLoggedin,
    authorizedRoles,
    authorizeSubscriber
}