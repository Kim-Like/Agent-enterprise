import {
  Search, Users, Key, PenTool, Layout, BarChart3,
  TrendingUp, Compass, Database, Bot, FileText, Braces, Blocks
} from "lucide-react";

export interface AgentConfig {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: typeof Bot;
  colorClass: string;
  bgClass: string;
  status: "idle" | "running" | "complete" | "error";
  path: string;
}

export const agents: AgentConfig[] = [
  {
    id: "competitor-researcher",
    title: "Competitor Researcher",
    shortTitle: "Competitor",
    description: "Analyze competitor strategies, backlinks, and content gaps",
    icon: Search,
    colorClass: "text-agent-competitor",
    bgClass: "bg-agent-competitor/10",
    status: "idle",
    path: "/agents/competitor-researcher",
  },
  {
    id: "keyword-analyst",
    title: "Keyword Analyst",
    shortTitle: "Keywords",
    description: "Discover high-value keywords and search intent patterns",
    icon: Key,
    colorClass: "text-agent-keyword",
    bgClass: "bg-agent-keyword/10",
    status: "idle",
    path: "/agents/keyword-analyst",
  },
  {
    id: "content-writer",
    title: "Content Writer",
    shortTitle: "Writer",
    description: "Generate SEO-optimized content drafts and outlines",
    icon: PenTool,
    colorClass: "text-agent-writer",
    bgClass: "bg-agent-writer/10",
    status: "idle",
    path: "/agents/content-writer",
  },
  {
    id: "content-composer",
    title: "Content Composer",
    shortTitle: "Composer",
    description: "Assemble and structure content for publishing",
    icon: Layout,
    colorClass: "text-agent-composer",
    bgClass: "bg-agent-composer/10",
    status: "idle",
    path: "/agents/content-composer",
  },
  {
    id: "content-analyst",
    title: "Content Analyst",
    shortTitle: "Analyst",
    description: "Evaluate content quality, readability, and SEO score",
    icon: BarChart3,
    colorClass: "text-agent-analyst",
    bgClass: "bg-agent-analyst/10",
    status: "idle",
    path: "/agents/content-analyst",
  },
  {
    id: "performance-reviewer",
    title: "Performance Reviewer",
    shortTitle: "Performance",
    description: "Track rankings, traffic, and conversion metrics",
    icon: TrendingUp,
    colorClass: "text-agent-reviewer",
    bgClass: "bg-agent-reviewer/10",
    status: "idle",
    path: "/agents/performance-reviewer",
  },
  {
    id: "opportunity-explorer",
    title: "Opportunity Explorer",
    shortTitle: "Opportunities",
    description: "Identify untapped niches and content opportunities",
    icon: Compass,
    colorClass: "text-agent-explorer",
    bgClass: "bg-agent-explorer/10",
    status: "idle",
    path: "/agents/opportunity-explorer",
  },
  {
    id: "schema-generator",
    title: "Schema Generator",
    shortTitle: "Schema",
    description: "Generate complete JSON-LD structured data from any published page URL",
    icon: Braces,
    colorClass: "text-agent-schema",
    bgClass: "bg-agent-schema/10",
    status: "idle",
    path: "/agents/schema-generator",
  },
  {
    id: "prototyper",
    title: "Prototyper",
    shortTitle: "Prototyper",
    description: "Build HTML components using the site's own CSS classes and design system",
    icon: Blocks,
    colorClass: "text-agent-prototyper",
    bgClass: "bg-agent-prototyper/10",
    status: "idle",
    path: "/agents/prototyper",
  },
];
