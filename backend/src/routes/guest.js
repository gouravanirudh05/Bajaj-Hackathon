import express from 'express';
import GuestConversation from '../models/GuestConversation.js';
import { chatWithAI } from '../services/geminiServices.js';
import { v4 as uuidv4 } from 'uuid';
import { searchKnowledge } from '../scripts/queryKnowledge.js';

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

    if (!guestId || !guestConversation) {
      const newId = guestId || uuidv4();
      const newGuestConv = new GuestConversation({
        guestId: newId,
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
  try {
    // 1. Retrieve similar info from Pinecone
    const pineconeResults = await searchKnowledge(userMessage, 3);
    const contextText = pineconeResults.map(r => `- ${r.text}`).join('\n');

    // 2. Create system prompt
    const promptWithContext = contextText
      ? `Use the following insurance knowledge to assist:\n\n${contextText}\n\nUser question: ${userMessage}`
      : `No internal knowledge found. Use general knowledge.\n\nUser question: ${userMessage}`;

    // 3. Prepare chat history
    const history = guestConv.messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    // 4. Get AI reply
    const aiResponse = await chatWithAI(history, userMessage);

    // 5. Save conversation
    guestConv.messages.push(
      { sender: 'user', text: userMessage, timestamp: new Date() },
      { sender: 'model', text: aiResponse, timestamp: new Date() }
    );
    await guestConv.save();

    return res.json({
      answer: aiResponse,
      guestId: guestConv.guestId,
    });

  } catch (error) {
    console.error("Error in handleGuestConversation:", error.message);
    return res.status(500).json({ message: "Failed to process request." });
  }
}

export default router;
