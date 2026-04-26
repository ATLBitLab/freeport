import { jsonResponse } from "@/lib/api";

export async function GET() {
  return jsonResponse({
    status: "ok",
    service: "freeport",
    time: new Date().toISOString(),
  });
}
