import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';
import { searchKnowledge } from '../scripts/queryKnowledge.js';

dotenv.config();

export const chatWithAI = async (history, message, systemInstruction) => {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('Missing GOOGLE_AI_API_KEY in environment variables');
  }

  const pineconeResults = await searchKnowledge(message, 3);
  let additionalContext = '';

  if (pineconeResults.length > 0) {
    additionalContext = `\n\nRelevant Information:\n${pineconeResults
      .map((r) => `- ${r.text}`)
      .join('\n')}`;
  } else {
    additionalContext =
      'No relevant knowledge found in Pinecone. You are a highly intelligent AI assistant. If relevant information is found in the user\'s internal database, include it in your response. However, if no relevant information is found, use your general knowledge to answer the question accurately and in detail.\n';
  }

  const fullSystemInstruction = process.env.AI_INSTRUCTIONS || '';
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    systemInstruction: fullSystemInstruction,
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  history.push({ role: 'user', parts: [{ text: message }] });
  history.push({ role: 'user', parts: [{ text: additionalContext }] });

  const chatSession = model.startChat({
    generationConfig,
    safetySettings,
    history: history,
  });

  const result = await chatSession.sendMessage(message);
  if (!result.response || !result.response.text) {
    throw new Error('Failed to get text response from the AI.');
  }

  return result.response.text();
};
