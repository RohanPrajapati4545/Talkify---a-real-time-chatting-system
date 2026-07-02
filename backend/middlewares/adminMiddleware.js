const adminMiddleware=(req,res,next)=>{
  try {
      if(req.user.role!=="admin"){
       return res.status(400).json({msg:"access denied. admins only"})
    }
    next()
  } catch (error) {
    res.status(404).json({msg:"unauthorized access"})
  }
    
}
module.exports=adminMiddleware
