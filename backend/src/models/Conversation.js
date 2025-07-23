import mongoose from "mongoose";
const {Schema,model}=mongoose;
const MessageSchema=new Schema(
    {
        sender:{type:String,enum:['user','model'],required:true},
        text:{type:String,required:true},
        timestamp:{type:Date,default:Date.now}
    }
);
const ConversationSchema=new Schema(
    {
        user:{type:Schema.Types.ObjectId,ref:'User',required:true},
        title:{type:String,default:'New Conversation'},
        messages:{MessageSchema},
    },{
        timestamps:true}
);
const Conversation=model('Conversation',ConversationSchema);

export default Conversation;
