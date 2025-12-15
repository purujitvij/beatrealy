import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Path to the MCP server's spotify-config.json
const SPOTIFY_CONFIG_PATH = path.join(process.cwd(), '..', 'spotify-config.json');

// Update the MCP server's spotify-config.json with new tokens
async function updateSpotifyConfig(accessToken: string, refreshToken?: string): Promise<void> {
  try {
    const configData = await fs.readFile(SPOTIFY_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configData);

    config.accessToken = accessToken;
    if (refreshToken) {
      config.refreshToken = refreshToken;
    }

    await fs.writeFile(SPOTIFY_CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('[Spotify Refresh] Updated spotify-config.json with new tokens');
  } catch (error) {
    console.error('[Spotify Refresh] Failed to update spotify-config.json:', error);
  }
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('spotify_refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token available' }, { status: 401 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Missing Spotify credentials' }, { status: 500 });
  }

  try {
    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Spotify Refresh] Token refresh failed:', errorText);
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
    }

    const tokenData = await tokenResponse.json();
    const expiresAt = Date.now() + (tokenData.expires_in * 1000);

    // Update MCP server's spotify-config.json
    await updateSpotifyConfig(tokenData.access_token, tokenData.refresh_token);

    // Create response with updated cookies
    const response = NextResponse.json({
      success: true,
      expiresAt,
      message: 'Tokens refreshed successfully'
    });

    // Update access token cookie
    response.cookies.set('spotify_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in,
      path: '/',
    });

    // Update refresh token if a new one was provided
    if (tokenData.refresh_token) {
      response.cookies.set('spotify_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    // Update expiry time (not httpOnly so frontend can read it for refresh scheduling)
    response.cookies.set('spotify_expires_at', expiresAt.toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    console.log('[Spotify Refresh] Successfully refreshed tokens');
    return response;

  } catch (error) {
    console.error('[Spotify Refresh] Error:', error);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
