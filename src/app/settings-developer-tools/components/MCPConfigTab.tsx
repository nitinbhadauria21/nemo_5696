'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Copy, CheckCheck, Download } from 'lucide-react';

const MCP_CONFIG = `{
  "mcpServers": {
    "nemo-trends": {
      "command": "npx",
      "args": ["-y", "@nemo/mcp-server"],
      "env": {
        "NEMO_API_KEY": "NT_prod_8f2a…",
        "NEMO_BASE_URL": "https://api.nemo.app/v1"
      }
    }
  }
}`;

const REST_API_DOCS = `# NEMO REST API Documentation
## Base URL: https://api.nemo.app/v1

## Authentication
All requests require the Authorization header:
\`Authorization: Bearer NT_prod_8f2a…\`

## Endpoints

### GET /trends
Fetch trending topics with optional filters.

**Query Parameters:**
- \`categories\` (string[]) — Filter by niche categories
- \`platforms\` (string[]) — Filter by platforms
- \`keyword\` (string) — Comma-separated keywords
- \`timeframe\` (string) — 24h | 72h | 7d

**Response:**
\`\`\`json
{
  "trends": [
    {
      "id": "trend-001",
      "title": "Claude AI Tool Integrations",
      "nemo_score": 91,
      "cvs": 0.88,
      "ss": 4.2,
      "cps": 0.80,
      "status": "hot",
      "platforms": ["google", "youtube", "linkedin"],
      "creators_count": 4821,
      "time_ago": "2h ago"
    }
  ],
  "total": 2847,
  "cached_at": "2026-07-12T16:34:29Z"
}
\`\`\`

### POST /trends/analyze
AI trend analysis using Claude Sonnet 4.6.

**Body:**
\`\`\`json
{ "trend_id": "trend-001", "depth": "full" }
\`\`\`

### POST /trends/generate-ideas
Generate 5 AI content ideas for a trend.

### GET /bookmarks
List bookmarked trends for authenticated user.

### POST /bookmarks
Bookmark a trend: \`{ "trend_id": "trend-001" }\``;

export default function MCPConfigTab() {
  const [copiedMCP, setCopiedMCP] = useState(false);
  const [copiedDocs, setCopiedDocs] = useState(false);
  const [activeSection, setActiveSection] = useState<'mcp' | 'docs'>('mcp');

  const copyMCP = () => {
    navigator.clipboard?.writeText(MCP_CONFIG)?.then(() => {
      setCopiedMCP(true);
      toast?.success('MCP config copied — paste into claude_desktop_config.json');
      setTimeout(() => setCopiedMCP(false), 2000);
    });
  };

  const copyDocs = () => {
    navigator.clipboard?.writeText(REST_API_DOCS)?.then(() => {
      setCopiedDocs(true);
      toast?.success('API docs copied');
      setTimeout(() => setCopiedDocs(false), 2000);
    });
  };

  const downloadDocs = () => {
    const blob = new Blob([REST_API_DOCS], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nemo-api-docs.md';
    a?.click();
    URL.revokeObjectURL(url);
    toast?.success('API documentation downloaded');
  };

  return (
    <div className="space-y-5">
      {/* Section tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('mcp')}
          className={`px-4 py-2 rounded-full text-sm font-sans font-semibold transition-all ${
            activeSection === 'mcp' ?'bg-primary text-white shadow-flame-sm' :'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          MCP Server Config
        </button>
        <button
          onClick={() => setActiveSection('docs')}
          className={`px-4 py-2 rounded-full text-sm font-sans font-semibold transition-all ${
            activeSection === 'docs'
              ? 'bg-primary text-white shadow-flame-sm' :'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          REST API Docs
        </button>
      </div>
      {activeSection === 'mcp' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-sans font-semibold text-foreground">Claude Desktop / Cursor MCP Config</h3>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Add NEMO as an MCP server in your Claude Desktop or Cursor IDE
                </p>
              </div>
              <button
                onClick={copyMCP}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-card text-sm font-sans font-medium hover:bg-muted transition-all"
              >
                {copiedMCP ? <CheckCheck size={14} className="text-accent" /> : <Copy size={14} />}
                {copiedMCP ? 'Copied!' : 'Copy Config'}
              </button>
            </div>
            <pre className="bg-ink-night text-cream-100 p-4 rounded-xl text-xs font-mono-custom overflow-x-auto leading-relaxed border border-border">
              {MCP_CONFIG}
            </pre>
          </div>

          <div className="card-surface p-5">
            <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-3">
              Installation Steps
            </h3>
            <ol className="space-y-3">
              {[
                'Open Claude Desktop → Settings → Developer → Edit Config',
                'Paste the config above into your claude_desktop_config.json file',
                'Replace NT_prod_8f2a… with your actual NEMO API key from the API Keys tab',
                'Restart Claude Desktop — NEMO tools will appear in your tool list',
                'Ask Claude: "What trends are hot in AI & Tech right now?" — NEMO will respond',
              ]?.map((step, i) => (
                <li key={`step-${i}`} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono-custom font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm font-sans text-muted-foreground leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
      {activeSection === 'docs' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-sans font-semibold text-foreground">REST API Documentation</h3>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Full API reference with your key pre-filled
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyDocs}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-card text-sm font-sans font-medium hover:bg-muted transition-all"
                >
                  {copiedDocs ? <CheckCheck size={14} className="text-accent" /> : <Copy size={14} />}
                  Copy
                </button>
                <button
                  onClick={downloadDocs}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full btn-flame text-sm"
                >
                  <Download size={14} />
                  Download .md
                </button>
              </div>
            </div>
            <pre className="bg-ink-night text-cream-100 p-4 rounded-xl text-xs font-mono-custom overflow-x-auto leading-relaxed border border-border max-h-96">
              {REST_API_DOCS}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}