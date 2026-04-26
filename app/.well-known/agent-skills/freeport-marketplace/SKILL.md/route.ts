import { FREEPORT_AGENT_SKILL_MARKDOWN } from "@/lib/agent-discovery";

export const revalidate = 3600;

export async function GET() {
  return new Response(FREEPORT_AGENT_SKILL_MARKDOWN, {
    headers: {
      "cache-control": "public, max-age=3600",
      "content-type": "text/markdown; charset=utf-8",
    },
  });
}
