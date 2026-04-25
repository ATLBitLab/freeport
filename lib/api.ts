import { ZodError } from "zod";

import type { ApiError } from "@/lib/types";

export function jsonResponse<T>(body: T, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export function errorResponse(error: ApiError, status = 400) {
  return jsonResponse({ error }, { status });
}

export function validationErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return errorResponse(
      {
        code: "validation_error",
        message: "Request body did not match the expected schema.",
        details: error.flatten(),
      },
      422,
    );
  }

  return errorResponse(
    {
      code: "bad_request",
      message: error instanceof Error ? error.message : "Unable to process request.",
    },
    400,
  );
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

export function getSearchString(url: string, key: string) {
  const value = new URL(url).searchParams.get(key);
  return value?.trim() || undefined;
}

export function parseLimit(value: string | null, fallback = 24, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}
