import { index } from "../services/pineconeClient.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { RetrievalQAChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";

dotenv.config();

class GoogleEmbeddings {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.modelName = "models/text-embedding-004";
  }

  async embedDocuments(texts) {
    const responses = await Promise.all(
      texts.map((t) =>
        this.genAI
          .getGenerativeModel({ model: this.modelName })
          .embedContent(t)
      )
    );
    return responses.map((r) => r.embedding.values);
  }

  async embedQuery(text) {
    const r = await this.genAI
      .getGenerativeModel({ model: this.modelName })
      .embedContent(text);
    return r.embedding.values;
  }
}

let ragChain = null;

async function getRagChain() {
  if (ragChain) return ragChain;

  const embeddings = new GoogleEmbeddings();
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
    namespace: "knowledge",
    textKey: "text",
  });

  const retriever = vectorStore.asRetriever({
    topK: 4,
    fetchMetadata: true,
  });

  const llm = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    .getGenerativeModel({ model: "models/text-bison-001" });

  const prompt = new PromptTemplate({
    template: `
    You are a chatbot an AI assistant for Bajaj. Use the following context excerpts to answer the user's question.
    Context:
    {context}
    Question:
    {question}
    Answer in clear, concise prose.
    `,
    inputVariables: ["context", "question"],
  });

  ragChain = RetrievalQAChain.fromLLM(llm, retriever, {
    prompt,
    returnSourceDocuments: true,
  });

  return ragChain;
}

export async function answerWithRAG(userQuestion) {
  const chain = await getRagChain();
  const res = await chain.call({ question: userQuestion });
  const sources = (res.sourceDocuments ?? []).map((doc, i) => ({
    id: doc.metadata?.id ?? i,
    snippet: doc.pageContent,
    score: doc.score ?? 0,
  }));

  return {
    answer: res.text,
    sources,
  };
}
