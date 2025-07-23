import express,{Request,Response} from "express";
import { authenticateJWT,AuthRequest} from "../middleware/auth";
import Conversation from "../models/Conversation";
const router=express.Router();

router.post('/',authenticateJWT,async (req,res)=>{
    try {
        const userId=req.user.id;
        const conversation=new Conversation(
            {
                messages:[],
                user:userId,
                title:'New Conversation'
            }
        );
        await conversation.save();
        res.json(conversation);
    } catch (error) {
        res.status(500).json({message:error.message})
    }
});
router.get('/',authenticateJWT,async (req,res)=>{
    try {
         const userId=req.user.id; 
         const conversations=await Conversation.find({user:userId});
         res.json(conversations);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
});
router.get('/:id',AuthRequest,async (req,res)=>{
  try {
    const userId=req.user.id;
    const conversation= await Conversation.findOne({_id:req.params.id,user:userId});
    if(!conversation)
    {
        return res.status(404).json({message:"Conversation not found"});
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({message:error.message});
  }
});
router.put('/:id',authenticateJWT,async (req,res)=>{
    try 
    {
        const userId=req.user.id;
        const {title}=req.body;
        const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { title },
      { new: true });
       if(!conversation)
        {
            return res.status(404).json({message:"Conversation not found"});
        }  
        res.json(conversation);        
    } catch (error) {
        res.status(500).json({message:error.message});
    }
});
router.get('/search/:query',authenticateJWT,async (req,res)=>{
    try {
        const userId=req.user.id;
        const query=req.params.body;
        const conversations=await Conversation.find({
           user: userId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { 'messages.text': { $regex: query, $options: 'i' } },
      ], 
        })
        res.json(conversations);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
} );
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
