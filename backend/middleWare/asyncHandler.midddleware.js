const asyncHandler = (fn) => {
    return (req, res, next) => {
      fn(req, res, next).catch((err) => next(err));
    };
  };
  
  export default asyncHandler;

  
  // second way

  // const asyncHandler = (fn) => async(req, res, next) => {
  //   try {
  //     await fn(req, res, next)
  //   } catch (error) {
  //     res.status(error.code || 500).json({
  //       success:false,
  //       message:error.message
  //     })
  //   }
  // };
  
  // export default asyncHandler;