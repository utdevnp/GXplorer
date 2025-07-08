import { NextRequest, NextResponse } from 'next/server';
import { driver, process as gprocess } from 'gremlin';

const COSMOSDB_KEY = process.env.COSMOSDB_GREMLIN_KEY;
const COSMOSDB_DATABASE = process.env.COSMOSDB_DATABASE;
const COSMOSDB_COLLECTION = process.env.COSMOSDB_COLLECTION;

// Enable gremlin debug logging
process.env.DEBUG = 'gremlin*';

export async function POST(req: NextRequest) {
  try {
    let { serverUrl, query } = await req.json();
    // Ensure the serverUrl is provided
    if (!serverUrl) {
      return NextResponse.json({ success: false, error: 'Missing serverUrl in request body.' });
    }
    // Ensure the serverUrl starts with ws:// or wss://
    if (!/^wss?:\/\//.test(serverUrl)) {
      // Default to wss:// if no protocol is provided
      serverUrl = 'wss://' + serverUrl.replace(/^\/*/, '');
    }
    let client;
    // If connecting to Cosmos DB, use SASL authentication
    if (serverUrl.includes('cosmos')) {
      if (!COSMOSDB_KEY || !COSMOSDB_DATABASE || !COSMOSDB_COLLECTION) {
        console.error('Missing Cosmos DB credentials:', {
          COSMOSDB_KEY: !!COSMOSDB_KEY,
          COSMOSDB_DATABASE,
          COSMOSDB_COLLECTION
        });
        throw new Error('Missing Cosmos DB credentials in environment variables.');
      }
      const resourcePath = `/dbs/${COSMOSDB_DATABASE}/colls/${COSMOSDB_COLLECTION}`;
      console.log('[CosmosDB] Connecting:', { serverUrl, resourcePath });
      client = new driver.Client(serverUrl, {
        authenticator: new driver.auth.PlainTextSaslAuthenticator(
          resourcePath,
          COSMOSDB_KEY
        ),
        traversalSource: 'g',
        rejectUnauthorized: true,
        mimeType: 'application/vnd.gremlin-v2.0+json',
      });
    } else {
      client = new driver.Client(serverUrl, { traversalSource: 'g' });
    }
    let result;
    try {
      if (query) {
        result = await client.submit(query);
      } else {
        // Fetch schema: vertex and edge labels
        const vertexLabels = await client.submit("g.V().label().dedup()");
        const edgeLabels = await client.submit("g.E().label().dedup()");
        result = {
          vertexLabels: vertexLabels._items || vertexLabels,
          edgeLabels: edgeLabels._items || edgeLabels,
        };
      }
      await client.close();
      return NextResponse.json({ success: true, result });
    } catch (err) {
      console.error('[Gremlin Error]', err);
      return NextResponse.json({ success: false, error: (err as Error).message, stack: (err as Error).stack });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
} 