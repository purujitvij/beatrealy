import { NextResponse } from 'next/server';

// Spotify OAuth scopes needed for our app
const SCOPES = [
  'user-read-private',         // Required for /me endpoint (profile info)
  'user-read-email',           // Required for /me endpoint (email)
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-library-read',
  'user-library-modify',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-top-read',
].join(' ');

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/spotify/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Spotify client ID not configured' }, { status: 500 });
  }

  // Generate random state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);

  // Build Spotify authorization URL
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    state: state,
    show_dialog: 'true', // Always show login dialog
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  // Store state in cookie for verification
  const response = NextResponse.redirect(authUrl);
  response.cookies.set('spotify_auth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
