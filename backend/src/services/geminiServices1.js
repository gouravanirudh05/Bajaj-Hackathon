import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';
import { searchKnowledge } from '../scripts/queryKnowledge.js';

dotenv.config();

export const chatWithAI = async (message, systemInstruction) => {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('Missing GOOGLE_AI_API_KEY in environment variables');
  }

  console.log("HI");
  console.log(message);
  const pineconeResults = await searchKnowledge(message, 3);

  let contextText = '';
  if (pineconeResults.length > 0) {
    contextText = `You must answer using the following internal insurance knowledge:\n\n${pineconeResults
      .map((r) => `- ${r.text}`)
      .join('\n')}\n\nIf it doesn't help, fall back to general knowledge.`;
  } else {
    contextText = `No relevant internal knowledge was found.\nUse your general knowledge to help the user as best as possible.`;
  }

  const fullSystemInstruction =
    systemInstruction || process.env.AI_INSTRUCTIONS || 'You are an expert insurance assistant. Be accurate and detailed.';

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
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  const combinedPrompt = `${contextText}\n\nUser question: ${message}`;
  console.log("🔍 Pinecone Context:\n", contextText);

  const chatSession = model.startChat({
    generationConfig,
    safetySettings,
    history: [], // No prior history
  });

  const result = await chatSession.sendMessage(combinedPrompt);

  if (!result.response || !result.response.text) {
    throw new Error('Failed to get text response from the AI.');
  }

  return result.response.text();
};
