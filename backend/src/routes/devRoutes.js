import express from 'express';
import storeKnowledge from '../scripts/storeKnowledge.js'; 
const router = express.Router();
router.post('/load-knowledge', async (req, res) => {
  try {
    await storeKnowledge();
    res.status(200).json({ message: 'Knowledge stored in Pinecone' });
  } catch (err) {
    console.error('Error loading knowledge:', err.message);
    res.status(500).json({ message: 'Failed to store knowledge.' });
  }
});
export default router;