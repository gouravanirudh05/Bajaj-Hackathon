import express from 'express';
import GuestConversation from '../models/GuestConversation.js';
import { chatWithAI } from '../services/geminiService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, guestId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Invalid or empty message.' });
    }

    let guestConversation = null;

    if (guestId) {
      guestConversation = await GuestConversation.findOne({ guestId });
    }

    if (!guestId) {
      const newGuestId = uuidv4();
      const newGuestConv = new GuestConversation({
        guestId: newGuestId,
        messages: [],
      });
      await newGuestConv.save();
      return handleGuestConversation(res, newGuestConv, message);
    } else if (!guestConversation && guestId) {
      const newGuestConv = new GuestConversation({
        guestId,
        messages: [],
      });
      await newGuestConv.save();
      return handleGuestConversation(res, newGuestConv, message);
    } else {
      return handleGuestConversation(res, guestConversation, message);
    }
  } catch (error) {
    console.error('Error in POST /api/chat/guest:', error);
    return res.status(500).json({ message: error.message });
  }
});

async function handleGuestConversation(res, guestConv, userMessage) {
  const history = guestConv.messages.map((m) => ({
    role: m.sender === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  history.push({ role: 'user', parts: [{ text: userMessage }] });

  const aiResponse = await chatWithAI(history, userMessage);

  guestConv.messages.push({
    sender: 'user',
    text: userMessage,
    timestamp: new Date(),
  });

  guestConv.messages.push({
    sender: 'model',
    text: aiResponse,
    timestamp: new Date(),
  });

  await guestConv.save();

  return res.json({
    answer: aiResponse,
    guestId: guestConv.guestId,
  });
}

export default router;
