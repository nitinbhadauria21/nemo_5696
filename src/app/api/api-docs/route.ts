import { NextResponse } from 'next/server';

const DOCS = {
  openapi: '3.0.0',
  info: { title: 'Nemo API', version: '1.0.0' },
  paths: {
    '/api/trends': { get: { summary: 'List trends' }, post: { summary: 'Refresh trends' } },
    '/api/trends/{id}': { get: { summary: 'Get trend by id' } },
    '/api/trends/analyze': { post: { summary: 'AI trend analysis' } },
    '/api/bookmarks': { get: { summary: 'List bookmarks' }, post: { summary: 'Add bookmark' } },
  },
};

export async function POST() {
  return NextResponse.json({ docs: DOCS });
}

export async function GET() {
  return NextResponse.json({ docs: DOCS });
}
