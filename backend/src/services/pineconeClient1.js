import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

/**
 * Function to create a new index
 */
export async function createNewIndex(indexName, dimension = 768) {
  try {
      await pinecone.createIndex({
        name: indexName,
        vectorType: 'dense',
        dimension: dimension,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        },
        deletionProtection: 'disabled',
        tags: { environment: 'development' }, 
      });
      console.log(`✅ Index "${indexName}" created successfully.`);

  } catch (err) {
    console.error("❌ Failed to create index:", err.message);
  }
}
