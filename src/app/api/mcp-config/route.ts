import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const apiKey = body.apiKey || 'YOUR_NEMO_API_KEY';

  return NextResponse.json({
    mcpServers: {
      nemo: {
        command: 'npx',
        args: ['-y', '@nemo/mcp-server'],
        env: { NEMO_API_KEY: apiKey },
      },
    },
  });
}
