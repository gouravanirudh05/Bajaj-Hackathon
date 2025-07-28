import axios from "axios";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
// import * as pdfjsLib from 'pdfjs-dist/build/pdf.js';
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createNewIndex } from "../services/pineconeClient1.js";
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });



dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/text-embedding-004" });

/**
 * Step 1: Download PDF from URL and extract text
 */
async function extractTextFromPdfUrl(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const data = await pdf(response.data);
  return data.text;
}

/**
 * Step 2: Smartly chunk the extracted text
 */
async function chunkText(text, chunkSize = 500, overlap = 50) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: overlap,
    separators: ["\n\n", "\n", " ", ""],
  });                                     

  const docs = await splitter.createDocuments([text]);
  return docs.map((doc) => doc.pageContent);
}

/**
 * Step 3: Embed and store in Pinecone
 */
async function storeChunksToPinecone(chunks, indexName) {
    const targetIndex = pinecone.index(indexName); // dynamic index
    const vectors = [];
  
    for (let i = 0; i < chunks.length; i++) {
      const text = chunks[i];
      try {
        const embeddingResponse = await model.embedContent({
          content: { parts: [{ text }] },
        });
  
        const embedding = embeddingResponse.embedding?.values;
  
        if (!embedding || !Array.isArray(embedding)) {
          throw new Error("Invalid embedding");
        }
  
        vectors.push({
          id: `chunk-${i}`,
          values: embedding,
          metadata: { text },
        });
  
        console.log(`✅ Embedded chunk ${i + 1}/${chunks.length}`);
      } catch (err) {
        console.error(`❌ Failed on chunk ${i}:`, err.message);
      }
    }
  
    if (vectors.length > 0) {
      await targetIndex.namespace("knowledge").upsert(vectors);
      console.log(`🚀 Uploaded ${vectors.length} chunks to index "${indexName}"`);
    } else {
      console.warn("⚠️ No vectors to upsert.");
    }
  }
  

/**
 * Entry point
 */

async function storeKnowledge (pdfUrl) {
  await createNewIndex('lets-test7');
  const text = await extractTextFromPdfUrl(pdfUrl);
  const chunks = await chunkText(text);
  await storeChunksToPinecone(chunks, 'lets-test7');
}

export default storeKnowledge;
