// import { index } from "../services/pineconeClient.js";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import dotenv from "dotenv";
// dotenv.config();

// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "models/text-embedding-004" });
// const knowledgeBase = [
//   {
//     id: "1",
//     text: "Knee surgery is covered if the policy is older than 3 months.",
//   },
//   {
//     id: "2",
//     text: "Claims for surgeries within 3 months of policy issuance are not eligible unless it's an accident.",
//   },
//   {
//     id: "3",
//     text: "Patients older than 45 require additional pre-approval for orthopedic surgeries.",
//   },
//   {
//     id: "4",
//     text: "Treatment in Pune hospitals under our network is covered up to ₹2,00,000.",
//   },
//   {
//     id: "5",
//     text: "The policy does not cover cosmetic or elective surgeries.",
//   },
// ];
// async function storeKnowledge() {
//   const vectors = [];
//   for (const item of knowledgeBase) {
//     try {
//       console.log(`🔍 Embedding: "${item.text}"`);
//       const embeddingResponse = await model.embedContent({
//         content: {
//           parts: [{ text: item.text }],
//         },
//       });
//       const embedding = embeddingResponse.embedding?.values;
//       if (!embedding || !Array.isArray(embedding)) {
//         throw new Error("Invalid embedding response format.");
//       }
//       vectors.push({
//         id: item.id,
//         values: embedding,
//         metadata: { text: item.text },
//       });
//     } catch (error) {
//       console.error(`Failed to embed "${item.text}":`, error.message);
//     }
//   }
//   if (vectors.length > 0) {
//     await index.namespace("knowledge").upsert(vectors);
//     console.log(`Upserted ${vectors.length} vectors to Pinecone.`);
//   } else {
//     console.warn("No vectors were generated.");
//   }
// }
// export default storeKnowledge(); 