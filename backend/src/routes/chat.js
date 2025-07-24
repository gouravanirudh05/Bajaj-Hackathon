import express from 'express'
import jwt from 'jsonwebtoken'
import Conversation from '../models/Conversation.js'
import { chatWithAI } from '../services/geminiServices.js'
const router=express.Router()
router.post('/',async(req,res)=>
{
    try{
        const {message,id}=req.body;
        if(!message || typeof message !=='string')
        {
            return res.status(400).json({message:'Invalid or empty message'});
        }
        const header=req.headers.authorization;
        if(!header)
            return res.status(401).json({message:"Missing authorisation headeder"});
        const token=header.split(' ')[1]
        let userId=null;
        let history=[];
        let conversation=null;
        if(id)
        {
            conversation=await Conversation.findOne({
                _id:id,
                user:userId,
            });
            if(!conversation)
                return res.status(404).json({message:"Conversation not found"});
        history=conversation.messages.map((msg)=>({
            role:msg.sender==='user'?'user':'model',
            parts:[{text:msg.text}],
        }));
    }else 
        {
            conversation=new Conversation({user:userId,messages:[]});
            await conversation.save();
        }
        history.push({role:'user',parts:[{text:message}]});
        const aiResponse = await chatWithAI(history, message);

    conversation.messages.push({
      sender: 'user',
      text: message,
      timestamp: new Date(),
    });

    conversation.messages.push({
      sender: 'model',
      text: aiResponse,
      timestamp: new Date(),
    });

    await conversation.save();
    return res.json({
      answer: aiResponse,
      id: conversation._id,
    });
    }
    catch(e)
    {
        console.log("Error in POST/chat/auth:",e)
        res.status(500).json({message:e.message})
    }
});
export default router;