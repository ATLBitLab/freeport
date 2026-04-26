import { getAgentSkillsIndex } from "@/lib/agent-discovery";

export const revalidate = 3600;

export async function GET() {
  return Response.json(getAgentSkillsIndex(), {
    headers: {
      "cache-control": "public, max-age=3600",
    },
  });
}
