import express from 'express';
import { chatWithAI } from '../services/geminiServices1.js';
import storeKnowledge from '../scripts/storeKnowledge1.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { documents, questions } = req.body;

    await storeKnowledge(documents);

    let answers = [];

    for(const question of questions)
    {


        const answer = await answerQuestion(question);

        answers.push(answer);
    }

    return res.status(200).json({ answers });

  } catch (error) {
    console.error('Error in POST:', error);
    return res.status(500).json({ message: error.message });
  }
});

async function answerQuestion(userMessage) {
  try {
    const aiResponse = await chatWithAI(userMessage);

    return aiResponse;

  } catch (error) {
    console.error("Error in answerQuestion:", error.message);
  }
}

export default router;
