import { NextResponse } from 'next/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export async function GET() {
  const checks = {
    geminiApiKey: !!process.env.GEMINI_API_KEY,
    mcpConnection: false,
    mcpTools: 0,
    error: null as string | null,
  };

  let client: Client | null = null;

  try {
    // Test MCP connection
    const mcpServerUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://127.0.0.1:3000/mcp';
    const transport = new StreamableHTTPClientTransport(
      new URL(mcpServerUrl)
    );
    client = new Client({
      name: 'health-check',
      version: '1.0.0',
    });

    await client.connect(transport);
    checks.mcpConnection = true;

    // List tools
    const tools = await client.listTools();
    checks.mcpTools = tools.tools.length;

  } catch (err) {
    checks.error = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    // Close MCP client connection
    if (client) {
      try {
        await client.close();
      } catch {
        // Ignore close errors
      }
    }
  }

  return NextResponse.json(checks);
}
