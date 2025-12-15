import { NextRequest, NextResponse } from 'next/server';
import {
  callMCPToolWithToken,
  isReadTool,
  isActionTool,
  type ToolName,
  type UserTokens,
} from '@/lib/mcp-client';

interface RouteParams {
  params: Promise<{ tool: string }>;
}

/**
 * Extract user tokens from request cookies
 */
function getUserTokens(request: NextRequest): UserTokens | null {
  const accessToken = request.cookies.get('spotify_access_token')?.value;
  const refreshToken = request.cookies.get('spotify_refresh_token')?.value;

  if (!accessToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

/**
 * GET handler for read-only MCP tools
 * Example: GET /api/spotify/getNowPlaying
 * Example: GET /api/spotify/getMyPlaylists?limit=20
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tool } = await params;

  if (!isReadTool(tool)) {
    return NextResponse.json(
      {
        success: false,
        error: `Unknown read tool: ${tool}. Use POST for action tools.`,
      },
      { status: 400 }
    );
  }

  // Get user tokens from cookies
  const tokens = getUserTokens(request);
  if (!tokens) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated. Please log in with Spotify.' },
      { status: 401 }
    );
  }

  // Extract query parameters as tool arguments
  const searchParams = request.nextUrl.searchParams;
  const args: Record<string, unknown> = {};

  searchParams.forEach((value, key) => {
    // Try to parse numbers and booleans
    if (value === 'true') {
      args[key] = true;
    } else if (value === 'false') {
      args[key] = false;
    } else if (!isNaN(Number(value)) && value !== '') {
      args[key] = Number(value);
    } else {
      args[key] = value;
    }
  });

  const result = await callMCPToolWithToken(tool as ToolName, args, tokens);

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}

/**
 * POST handler for action MCP tools
 * Example: POST /api/spotify/playMusic { "type": "track", "id": "xxx" }
 * Example: POST /api/spotify/pausePlayback
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { tool } = await params;

  if (!isActionTool(tool)) {
    // Allow read tools via POST as well for flexibility
    if (!isReadTool(tool)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown tool: ${tool}`,
        },
        { status: 400 }
      );
    }
  }

  // Get user tokens from cookies
  const tokens = getUserTokens(request);
  if (!tokens) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated. Please log in with Spotify.' },
      { status: 401 }
    );
  }

  // Parse JSON body for arguments
  let args: Record<string, unknown> = {};
  try {
    const body = await request.text();
    if (body) {
      args = JSON.parse(body);
    }
  } catch {
    // Empty body is fine for tools like pausePlayback
  }

  const result = await callMCPToolWithToken(tool as ToolName, args, tokens);

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
