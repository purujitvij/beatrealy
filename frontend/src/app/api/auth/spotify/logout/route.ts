import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

  const response = NextResponse.redirect(baseUrl);

  // Clear all Spotify cookies
  response.cookies.delete('spotify_access_token');
  response.cookies.delete('spotify_refresh_token');
  response.cookies.delete('spotify_expires_at');
  response.cookies.delete('spotify_user');

  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear all Spotify cookies
  response.cookies.delete('spotify_access_token');
  response.cookies.delete('spotify_refresh_token');
  response.cookies.delete('spotify_expires_at');
  response.cookies.delete('spotify_user');

  return response;
}
