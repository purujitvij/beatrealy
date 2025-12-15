import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/spotify/callback`;

  // Check for errors from Spotify
  if (error) {
    console.error('[Spotify Auth] Error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(error)}`);
  }

  // Verify state to prevent CSRF
  const storedState = request.cookies.get('spotify_auth_state')?.value;
  if (!state || state !== storedState) {
    console.error('[Spotify Auth] State mismatch');
    return NextResponse.redirect(`${baseUrl}/?error=state_mismatch`);
  }

  if (!code) {
    console.error('[Spotify Auth] No code received');
    return NextResponse.redirect(`${baseUrl}/?error=no_code`);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[Spotify Auth] Missing credentials');
    return NextResponse.redirect(`${baseUrl}/?error=config_error`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Spotify Auth] Token exchange failed:', errorText);
      return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();

    // Note: No longer syncing to spotify-config.json - tokens are stored in cookies per user
    // This enables multi-user support where each user has their own session

    // Get user profile
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    let userProfile = null;
    if (profileResponse.ok) {
      userProfile = await profileResponse.json();
    }

    // Calculate expiry time
    const expiresAt = Date.now() + (tokenData.expires_in * 1000);

    // Create response with redirect to chat
    const response = NextResponse.redirect(`${baseUrl}/chat`);

    // Clear the state cookie
    response.cookies.delete('spotify_auth_state');

    // Store tokens in secure cookies
    // Access token - shorter lived
    response.cookies.set('spotify_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in, // Usually 1 hour
      path: '/',
    });

    // Refresh token - longer lived
    response.cookies.set('spotify_refresh_token', tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Token expiry time (not httpOnly so frontend can read it for refresh scheduling)
    response.cookies.set('spotify_expires_at', expiresAt.toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // User info (not httpOnly so frontend can read it)
    if (userProfile) {
      response.cookies.set('spotify_user', JSON.stringify({
        id: userProfile.id,
        name: userProfile.display_name,
        email: userProfile.email,
        image: userProfile.images?.[0]?.url || null,
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    console.log('[Spotify Auth] Successfully authenticated user:', userProfile?.display_name);
    return response;

  } catch (error) {
    console.error('[Spotify Auth] Error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=auth_failed`);
  }
}
