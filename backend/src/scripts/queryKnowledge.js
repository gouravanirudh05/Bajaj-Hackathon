import { index } from "../services/pineconeClient.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/text-embedding-004" });
export async function searchKnowledge(query, topK = 3) {
  try {
    const embeddingResponse = await model.embedContent(query);
    const queryEmbedding = embeddingResponse.embedding?.values;

    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      throw new Error("Invalid query embedding.");
    }

    const response = await index.namespace("knowledge").query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    console.log("Pinecone matches:", JSON.stringify(response.matches, null, 2));

    const results = response.matches?.map((match) => ({
      text: match.metadata?.text || "",
      score: match.score,
    })) || [];

    return results;
  } catch (error) {
    console.error("Error during knowledge search:", error.message);
    return [];
  }
}
