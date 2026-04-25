import { LISTING_CATEGORIES } from "@/lib/constants";
import { jsonResponse } from "@/lib/api";

export async function GET() {
  return jsonResponse({ categories: LISTING_CATEGORIES });
}
