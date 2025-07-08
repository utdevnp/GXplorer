import { NextRequest, NextResponse } from 'next/server';
import { driver } from 'gremlin';

// Enable gremlin debug logging
process.env.DEBUG = 'gremlin*';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, url, query, accessKey, dbName, graphName } = body;
    let client;

    switch (type) {
      case 'local': {
        if (!url) {
          return NextResponse.json({ success: false, error: 'Missing url for local connection.' });
        }
        client = new driver.Client(url, { traversalSource: 'g' });
        break;
      }
      case 'cosmos': {
        if (!url || !accessKey || !dbName || !graphName) {
          return NextResponse.json({ success: false, error: 'Missing fields for cosmos connection.' });
        }
        const resourcePath = `/dbs/${dbName}/colls/${graphName}`;
        client = new driver.Client(url, {
          authenticator: new driver.auth.PlainTextSaslAuthenticator(
            resourcePath,
            accessKey
          ),
          traversalSource: 'g',
          rejectUnauthorized: true,
          mimeType: 'application/vnd.gremlin-v2.0+json',
        });
        break;
      }
      default:
        return NextResponse.json({ success: false, error: 'Unsupported connection type.' });
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