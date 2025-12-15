import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('spotify_access_token')?.value;
  const userCookie = request.cookies.get('spotify_user')?.value;

  if (!accessToken) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  // Try to get fresh user data from Spotify
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const profile = await response.json();
      return NextResponse.json({
        authenticated: true,
        user: {
          id: profile.id,
          name: profile.display_name,
          email: profile.email,
          image: profile.images?.[0]?.url || null,
          product: profile.product, // 'premium' or 'free'
        },
      });
    }
  } catch (error) {
    console.error('[Spotify Me] Error fetching profile:', error);
  }

  // Fall back to cached user data
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      return NextResponse.json({ authenticated: true, user });
    } catch {
      // Invalid cookie data
    }
  }

  return NextResponse.json({ authenticated: false, user: null });
}
