import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const collaborationContent = `
# 🤝 SEO Agent Collaboration Strategy

## Overview

The SEO Agent fleet operates as a coordinated pipeline. Each agent reads from and writes to a **shared task database**, enabling seamless data handoffs and collaborative workflows.

---

## Data Flow Architecture

\`\`\`
┌──────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Competitor      │────▶│   Keyword        │────▶│   Content        │
│   Researcher      │     │   Analyst        │     │   Writer         │
│                   │     │                  │     │                  │
│ Output: JSON      │     │ Output: JSON     │     │ Output: MD       │
│ - competitors     │     │ - keyword        │     │ - article drafts │
│ - content gaps    │     │   clusters       │     │ - outlines       │
│ - backlinks       │     │ - search intent  │     │ - meta tags      │
└──────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                      SHARED TASK DATABASE                        │
│              (JSON + Markdown files per task)                    │
└──────────────────────────────────────────────────────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Content         │     │   Content        │     │   Performance    │
│   Composer        │     │   Analyst        │     │   Reviewer       │
│                   │     │                  │     │                  │
│ Input: MD drafts  │     │ Input: MD + JSON │     │ Input: JSON      │
│ Output: MD final  │     │ Output: JSON     │     │ Output: JSON     │
│                   │     │ - quality scores │     │ - rankings       │
│                   │     │ - readability    │     │ - traffic data   │
└──────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   Opportunity    │
                                                │   Explorer       │
                                                │                  │
                                                │ Input: ALL       │
                                                │ Output: JSON     │
                                                │ - new niches     │
                                                │ - content ideas  │
                                                └─────────────────┘
\`\`\`

---

## Collaboration Rules

### 1. Data Format Convention
- **Structured data** (metrics, lists, configs) → **JSON**
- **Content** (articles, drafts, reports) → **Markdown**
- Each task must include: \`agentId\`, \`type\`, \`tags\`, \`createdAt\`

### 2. Agent Dependencies

| Agent | Reads From | Writes |
|-------|-----------|--------|
| Competitor Researcher | — (external data) | JSON: competitor profiles, gaps |
| Keyword Analyst | Competitor Researcher output | JSON: keyword clusters, intent |
| Content Writer | Keyword Analyst + Competitor data | MD: drafts, outlines |
| Content Composer | Content Writer drafts | MD: final content |
| Content Analyst | Composer output + Writer drafts | JSON: quality scores |
| Performance Reviewer | Published content (external) | JSON: metrics, rankings |
| Opportunity Explorer | ALL agent outputs | JSON: opportunities, ideas |

### 3. Task Tagging Convention
Use consistent tags so agents can query relevant tasks:
- \`competitor\`, \`analysis\` — Competitor data
- \`keywords\`, \`cluster\`, \`intent\` — Keyword data  
- \`draft\`, \`outline\`, \`content\` — Written content
- \`score\`, \`quality\`, \`seo\` — Analysis results
- \`performance\`, \`metrics\`, \`ranking\` — Performance data
- \`opportunity\`, \`niche\`, \`idea\` — Opportunities

### 4. Database Query Pattern
Agents should query the task database by:
1. **agentId** — find outputs from a specific upstream agent
2. **tags** — find tasks matching specific categories
3. **type** — filter by JSON or MD format
4. **date** — get most recent relevant data

---

## Example Pipeline: "New Blog Post"

1. **Competitor Researcher** analyzes top-ranking content for target topic
2. **Keyword Analyst** identifies primary + secondary keywords from competitor data
3. **Content Writer** generates draft using keywords + competitor gaps
4. **Content Composer** formats and structures the final article
5. **Content Analyst** scores the composed content for SEO optimization
6. **Performance Reviewer** tracks rankings after publishing
7. **Opportunity Explorer** identifies follow-up content ideas from performance data

---

*This document should be updated as agents are built and new collaboration patterns emerge.*
`;

export default function CollaborationPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-3 w-3" />
        Back to Dashboard
      </Link>

      <article className="prose prose-invert prose-sm max-w-none 
        prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground
        prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-muted prose-pre:text-foreground/80
        prose-table:text-sm prose-th:text-foreground prose-td:text-muted-foreground
        prose-th:border-border prose-td:border-border
        prose-a:text-primary">
        <div dangerouslySetInnerHTML={{ __html: "" }} />
        {/* Render markdown as formatted text */}
        <pre className="whitespace-pre-wrap font-mono text-xs text-foreground/80 bg-card border border-border rounded-lg p-6 leading-relaxed">
          {collaborationContent.trim()}
        </pre>
      </article>
    </div>
  );
}
