import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function checkEmbeddingDimension() {
  const result = await model.embedContent({
    content: 'Test embedding for dimension check',
  });

  console.log(`Embedding Dimension: ${result.embedding.values.length}`);
}

checkEmbeddingDimension();
