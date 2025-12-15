import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
const MCP_EXECUTE_URL = 'http://127.0.0.1:3000/execute';

const SYSTEM_PROMPT = `You are Moodify AI, a friendly music assistant that controls Spotify and suggests music based on mood.

CRITICAL RULE - LANGUAGE & TONE MATCHING:
- Default to English, but MIRROR the user's language and tone
- If user writes in Hindi/Hinglish slang (like "bc", "bhai", "yaar", "bsdk", etc.), you ALSO reply in the same Hinglish slang style
- If user is casual, be casual. If formal, be formal.
- If user is venting/frustrated, be supportive and empathetic - don't lecture them
- Talk like a real human friend, not a corporate bot

Examples of tone matching:
- User: "ye bc boss sochta kya hai apne aap ko" → Reply: "arre yaar, samajh sakta hoon. chal lagata hoon kuch gaane jo teri frustration nikaal de"
- User: "feeling low yaar" → Reply: "bhai samajh gaya. ruk abhi kuch aisa lagata hoon jo dil ko sukoon de"
- User: "My boss ruined my day" → Reply: "Ugh, that sucks. Let me find some music to help you blow off steam"
- User: "need workout music" → Reply: "Let's pump up the energy! Getting you some bangers to crush that workout"

MOOD DETECTION & MUSIC:
- Frustrated/Angry moods: Search for aggressive, rap, rock, or high energy music to vent
- Sad moods: Search for emotional, heartbreak songs (can include Arijit Singh, Adele, etc.)
- Energetic/Hype moods: Search for workout, party, upbeat, EDM, hip-hop
- Chill moods: Search for lo-fi, relaxing, acoustic, ambient
- Romantic moods: Search for romantic songs, love ballads

You have access to Spotify tools. Use them to:
1. Search music that fits their mood
2. Play tracks directly
3. Control playback

Be conversational and human. After using tools, summarize what you did in your response.
IMPORTANT: To play music, first search for it, then use playMusic tool with the track ID from search results.`;

interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: { result: object };
  };
}

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Available MCP tools (static list - matches MCP server tools)
const MCP_TOOLS = [
  { name: 'getNowPlaying', description: 'Get the currently playing track', inputSchema: { type: 'object', properties: {} } },
  { name: 'getMyPlaylists', description: 'Get user playlists', inputSchema: { type: 'object', properties: { limit: { type: 'number', description: 'Max playlists to return (default 50)' } } } },
  { name: 'getPlaylistTracks', description: 'Get tracks from a playlist', inputSchema: { type: 'object', properties: { playlistId: { type: 'string', description: 'Playlist ID' }, limit: { type: 'number' }, offset: { type: 'number' } }, required: ['playlistId'] } },
  { name: 'getRecentlyPlayed', description: 'Get recently played tracks', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },
  { name: 'getUsersSavedTracks', description: 'Get user saved/liked tracks', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, offset: { type: 'number' } } } },
  { name: 'getQueue', description: 'Get current playback queue', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },
  { name: 'searchSpotify', description: 'Search for tracks, albums, artists, or playlists', inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Search query' }, type: { type: 'string', description: 'Type: track, album, artist, playlist' }, limit: { type: 'number' } }, required: ['query', 'type'] } },
  { name: 'playMusic', description: 'Play a track, album, artist, or playlist', inputSchema: { type: 'object', properties: { type: { type: 'string', description: 'Type: track, album, artist, playlist' }, id: { type: 'string', description: 'Spotify ID' }, uri: { type: 'string', description: 'Spotify URI (alternative to type+id)' }, deviceId: { type: 'string' } } } },
  { name: 'pausePlayback', description: 'Pause playback', inputSchema: { type: 'object', properties: { deviceId: { type: 'string' } } } },
  { name: 'resumePlayback', description: 'Resume playback', inputSchema: { type: 'object', properties: { deviceId: { type: 'string' } } } },
  { name: 'skipToNext', description: 'Skip to next track', inputSchema: { type: 'object', properties: { deviceId: { type: 'string' } } } },
  { name: 'skipToPrevious', description: 'Skip to previous track', inputSchema: { type: 'object', properties: { deviceId: { type: 'string' } } } },
  { name: 'addToQueue', description: 'Add track to queue', inputSchema: { type: 'object', properties: { type: { type: 'string' }, id: { type: 'string' }, uri: { type: 'string' }, deviceId: { type: 'string' } } } },
  { name: 'setPlaybackVolume', description: 'Set playback volume', inputSchema: { type: 'object', properties: { volume_percent: { type: 'number', description: '0-100' }, deviceId: { type: 'string' } }, required: ['volume_percent'] } },
  { name: 'seekToPosition', description: 'Seek to position in track', inputSchema: { type: 'object', properties: { position_ms: { type: 'number', description: 'Position in milliseconds' }, deviceId: { type: 'string' } }, required: ['position_ms'] } },
  { name: 'createPlaylist', description: 'Create a new playlist', inputSchema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, public: { type: 'boolean' } }, required: ['name'] } },
  { name: 'addTracksToPlaylist', description: 'Add tracks to playlist', inputSchema: { type: 'object', properties: { playlistId: { type: 'string' }, trackIds: { type: 'array', items: { type: 'string' } }, position: { type: 'number' } }, required: ['playlistId', 'trackIds'] } },
];

// Execute tool via /execute endpoint with user token
async function executeMcpTool(
  toolName: string,
  args: Record<string, unknown>,
  accessToken: string,
  refreshToken?: string
): Promise<string> {
  const response = await fetch(MCP_EXECUTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: toolName,
      args,
      accessToken,
      refreshToken,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Tool execution failed');
  }

  // Extract text content if present
  if (result.data?.content) {
    return result.data.content
      .filter((c: { type: string }) => c.type === 'text')
      .map((c: { text: string }) => c.text)
      .join('\n');
  }

  return typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
}

// Clean schema for Gemini - remove fields it doesn't understand
function cleanSchemaForGemini(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map(cleanSchemaForGemini);
  }

  const cleaned: any = {};
  for (const [key, value] of Object.entries(schema)) {
    // Skip fields Gemini doesn't understand
    if (key === '$schema' || key === 'additionalProperties') {
      continue;
    }
    cleaned[key] = cleanSchemaForGemini(value);
  }
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user's Spotify tokens from cookies
    const accessToken = request.cookies.get('spotify_access_token')?.value;
    const refreshToken = request.cookies.get('spotify_refresh_token')?.value;

    if (!accessToken) {
      return NextResponse.json({
        error: 'Not authenticated with Spotify. Please log in first.',
        requiresAuth: true
      }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Use static tool definitions (no MCP connection needed for tool discovery)
    const geminiTools = [{
      functionDeclarations: MCP_TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: cleanSchemaForGemini(tool.inputSchema)
      }))
    }];

    // Prepare Conversation
    const contents: GeminiContent[] = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }]
      },
      {
        role: 'model',
        parts: [{ text: "Hey! I'm Moodify, your music buddy. Tell me what's going on - feeling stressed, happy, need to vent? Whatever it is, I'll find the perfect music for your mood. 🎵" }]
      }
    ];

    for (const msg of conversationHistory) {
      const convMsg = msg as ConversationMessage;
      contents.push({
        role: convMsg.role === 'user' ? 'user' : 'model',
        parts: [{ text: convMsg.content }]
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Agent Loop
    const toolResults: Array<{ tool: string; result: string }> = [];
    let finalResponse = '';
    let iterations = 0;
    const maxIterations = 5;

    while (iterations < maxIterations) {
      iterations++;

      // Call Gemini
      const bodyString = JSON.stringify({
        contents,
        tools: geminiTools
      });

      console.log('[Agent] Iteration:', iterations);

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyString
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Agent] Gemini API error:', errorText);
        throw new Error(`Failed to get response from Gemini: ${errorText}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];

      if (!candidate?.content?.parts) break;

      const parts = candidate.content.parts as GeminiPart[];
      const functionCalls = parts.filter((p) => p.functionCall);

      if (functionCalls.length > 0) {
        contents.push({ role: 'model', parts });
        const functionResponses: GeminiPart[] = [];

        for (const part of functionCalls) {
          const { name, args } = part.functionCall!;
          console.log(`[Agent] Executing tool: ${name}`, args);

          try {
            // Use /execute endpoint with user's token
            const resultText = await executeMcpTool(
              name,
              args as Record<string, unknown>,
              accessToken,
              refreshToken
            );

            toolResults.push({ tool: name, result: resultText });

            functionResponses.push({
              functionResponse: {
                name,
                response: { result: { output: resultText } }
              }
            });

          } catch (error) {
            console.error(`[Agent] Tool error (${name}):`, error);
            const errorMsg = error instanceof Error ? error.message : 'Tool failure';
            toolResults.push({ tool: name, result: `Error: ${errorMsg}` });

            functionResponses.push({
              functionResponse: {
                name,
                response: { result: { error: errorMsg } }
              }
            });
          }
        }
        contents.push({ role: 'user', parts: functionResponses });
        continue;
      }

      const textPart = parts.find((p) => p.text);
      if (textPart?.text) {
        finalResponse = textPart.text;
      }
      break;
    }

    return NextResponse.json({
      message: finalResponse,
      toolResults,
      iterations
    });

  } catch (error) {
    console.error('[Agent] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Agent error' },
      { status: 500 }
    );
  }
}
