import mongoose from "mongoose";
const {Schema,model}=mongoose;

const GuestMessageSchema=new Schema({
   sender: { type: String, enum: ['user', 'model'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false });

const GuestConversationSchema=new Schema(
    {
    guestId: { type: String, required: true, unique: true },
    messages: [GuestMessageSchema],
  },
  { timestamps: true }
);
const GuestConversation=model('GuestConversation',GuestConversationSchema);
export default GuestConversation;
