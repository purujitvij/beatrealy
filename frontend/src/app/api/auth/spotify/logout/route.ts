import { NextResponse } from 'next/server';

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL?.replace('/mcp', '') || 'http://127.0.0.1:3000';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

  // Clear tokens from MCP server config
  try {
    await fetch(`${MCP_SERVER_URL}/logout`, { method: 'POST' });
  } catch (error) {
    console.error('Failed to clear MCP server tokens:', error);
  }

  const response = NextResponse.redirect(baseUrl);

  // Clear all Spotify cookies
  response.cookies.delete('spotify_access_token');
  response.cookies.delete('spotify_refresh_token');
  response.cookies.delete('spotify_expires_at');
  response.cookies.delete('spotify_user');

  return response;
}

export async function POST() {
  // Clear tokens from MCP server config
  try {
    await fetch(`${MCP_SERVER_URL}/logout`, { method: 'POST' });
  } catch (error) {
    console.error('Failed to clear MCP server tokens:', error);
  }

  const response = NextResponse.json({ success: true });

  // Clear all Spotify cookies
  response.cookies.delete('spotify_access_token');
  response.cookies.delete('spotify_refresh_token');
  response.cookies.delete('spotify_expires_at');
  response.cookies.delete('spotify_user');

  return response;
}
