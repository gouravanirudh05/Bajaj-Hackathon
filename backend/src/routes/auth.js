import express,{Request,Response}from "express";
import User from "..models/User";
import bcrypt from 'bcrypt.js'
import jwt  from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
const router=express.Router()
const JWT_SECRET=process.env.JWT_SECRET
router.post("/signup",async(req,res)=>{
    try{
        const {email,password}=req.body;
        const existingUser=await User.findOne({email});
        if(existingUser)
        {
            return res.status(400).json({message:'User already exists'});
        }
        const hashed=await bcrypt.hash(password,10);
        const newUser=new User({email,password:hashed});
        await newUser.save();
        res.json({message:"User created Successfully"});
    }
    catch(e)
    {
        res.status(500).json({message:e.message});
    }
})
router.post("/login",async(req,res)=>{
    try{
    const {email,password}=req.body;
    const user=await User.findOne({email});
    if(!user)
    {
        res.status(400).json({message:"User does not exist"});
    }
    const correct=await bcrypt.compare(password,user.password);
    if(!correct)
    {
        return res.status(400).json({message:"Invalid email ID or password"});
    }
    const token=jwt.sign(
        {id:user._id,email:user.email},
        JWT_SECRET,
        {expiresIn:'1d'}
    );
    res.json({token});
}
catch(e)
{
    res.status(500).json({message:error.message});
}
});

router.get("/verify-email",async (req,res)=>{
    try{
    const {email}=req.body;
    if(!email)
        return res.status(400).json({message:"Email is required"});
    const user= User.findOne({email});
    res.json({exists:!!user});
    }
    catch(e)
    {
        return res.status(500).json({message:e.message});
    }
})
router.post('/reset-passoword',async (req,res)=>
{
    try{
        const {email,newpassword}=req.body;
        if(!email || !newpassword)
            return res.status(500).json({message:"Email and new password are required"});
        const user= await User.findOne(email);
        if(!user)
            return res.status(400).json({message:"User does not exist"});
        const hashed= await bcrypt.hash(newpassword,10);
        user.password=hashed
        await user.save();
        res.json({message:'Password reset successfully'});
    }
    catch(e)
    {
        res.status(500).json({message:e.message});
    }
})
router.get('/validate-token',async(req,res)=>{
    try{
        const token=req.headers.authorization?.split(' ')[1];
        if(!token)
        {
            return res.status(401).json({valid:false,message:'No token provided'});
        }
       jwt.verify(token, JWT_SECRET, (err) => {
      if (err) return res.status(401).json({ valid: false, message: 'Invalid or expired token' });

      res.json({ valid: true });
    });
    }
    catch(e){
        res.status(500).json({message:e.message});
    }
});

export default router;
