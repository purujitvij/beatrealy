import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://127.0.0.1:3000/mcp';
const MCP_EXECUTE_URL = process.env.NEXT_PUBLIC_MCP_EXECUTE_URL || 'http://127.0.0.1:3000/execute';

export interface MCPToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
} 
 
export interface UserTokens {
  accessToken: string;
  refreshToken?: string;
}

// Read tools (use GET)
export const READ_TOOLS = [
  'getNowPlaying',
  'getMyPlaylists',
  'getPlaylistTracks',
  'getRecentlyPlayed',
  'getUsersSavedTracks',
  'getQueue',
  'searchSpotify',
  'getAlbums',
  'getAlbumTracks',
  'checkUsersSavedAlbums',
] as const;

// Action tools (use POST)
export const ACTION_TOOLS = [
  'playMusic',
  'pausePlayback',
  'resumePlayback',
  'skipToNext',
  'skipToPrevious',
  'createPlaylist',
  'addTracksToPlaylist',
  'addToQueue',
  'saveOrRemoveAlbumForUser',
  'setPlaybackVolume',
  'seekToPosition',
] as const;

export type ReadTool = (typeof READ_TOOLS)[number];
export type ActionTool = (typeof ACTION_TOOLS)[number];
export type ToolName = ReadTool | ActionTool;

export function isReadTool(tool: string): tool is ReadTool {
  return READ_TOOLS.includes(tool as ReadTool);
}

export function isActionTool(tool: string): tool is ActionTool {
  return ACTION_TOOLS.includes(tool as ActionTool);
}

/**
 * Creates a new MCP client connection to the Spotify controller server.
 * Each call creates a fresh connection - caller is responsible for cleanup.
 */
export async function createMCPClient(): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
  const client = new Client({
    name: 'moodify-direct',
    version: '1.0.0',
  });
  await client.connect(transport);
  return client;
}

/**
 * Calls an MCP tool and returns the result.
 * Creates a new connection for each call (stateless).
 */
export async function callMCPTool<T = string>(
  name: ToolName,
  args: Record<string, unknown> = {}
): Promise<MCPToolResponse<T>> {
  let client: Client | null = null;

  try {
    client = await createMCPClient();

    const result = (await client.callTool({
      name,
      arguments: args,
    })) as MCPToolResult;

    // Extract text content from MCP response
    const textContent = result.content
      ?.filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n');

    // Try to parse as JSON, otherwise return as string
    let data: T;
    try {
      data = JSON.parse(textContent) as T;
    } catch {
      data = textContent as T;
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`[MCP Client] Error calling ${name}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to call MCP tool',
    };
  } finally {
    // Close the client connection to prevent session buildup
    if (client) {
      try {
        await client.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}

/**
 * Helper to call a read tool (no arguments required for some)
 */
export async function callReadTool<T = string>(
  name: ReadTool,
  args: Record<string, unknown> = {}
): Promise<MCPToolResponse<T>> {
  return callMCPTool<T>(name, args);
}

/**
 * Helper to call an action tool
 */
export async function callActionTool<T = string>(
  name: ActionTool,
  args: Record<string, unknown> = {}
): Promise<MCPToolResponse<T>> {
  return callMCPTool<T>(name, args);
}

/**
 * Calls an MCP tool using the user's access token (multi-user support).
 * This bypasses the shared config file and uses the token directly.
 */
export async function callMCPToolWithToken<T = string>(
  name: ToolName,
  args: Record<string, unknown> = {},
  tokens: UserTokens
): Promise<MCPToolResponse<T>> {
  try {
    const response = await fetch(MCP_EXECUTE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: name,
        args,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to execute tool',
      };
    }

    // Extract text content from the result
    const data = result.data;
    if (data?.content) {
      const textContent = data.content
        .filter((c: { type: string }) => c.type === 'text')
        .map((c: { text: string }) => c.text)
        .join('\n');

      // Try to parse as JSON, otherwise return as string
      try {
        return { success: true, data: JSON.parse(textContent) as T };
      } catch {
        return { success: true, data: textContent as T };
      }
    }

    return { success: true, data: data as T };
  } catch (error) {
    console.error(`[MCP Client] Error calling ${name} with token:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to call MCP tool',
    };
  }
}
