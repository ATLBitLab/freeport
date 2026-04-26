"use client";

import { useEffect } from "react";

type WebMcpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};

type ModelContext = {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => void;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

async function fetchJson(path: string) {
  const response = await fetch(path, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Freeport request failed with ${response.status}`);
  }

  return response.json();
}

export function WebMcpProvider() {
  useEffect(() => {
    const modelContext = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
    if (!modelContext?.registerTool) return;

    const controller = new AbortController();
    const commonAnnotations = { readOnlyHint: true, untrustedContentHint: true };

    const tools: WebMcpTool[] = [
      {
        name: "freeport.search_listings",
        title: "Search Freeport listings",
        description: "Search active Freeport marketplace listings by query, category, tag, seller, or limit.",
        inputSchema: {
          type: "object",
          properties: {
            q: { type: "string", description: "Search query." },
            category: {
              type: "string",
              enum: ["agent_service", "l402_api", "l402_workflow"],
              description: "Optional listing category.",
            },
            tag: { type: "string", description: "Optional tag filter." },
            seller: { type: "string", description: "Optional seller public key filter." },
            limit: { type: "integer", minimum: 1, maximum: 100, description: "Maximum results." },
          },
          additionalProperties: false,
        },
        annotations: commonAnnotations,
        execute: async (input) => {
          const params = new URLSearchParams();
          for (const key of ["q", "category", "tag", "seller"]) {
            const value = asString(input[key]);
            if (value) params.set(key, value);
          }

          const limit = asNumber(input.limit);
          if (limit) params.set("limit", String(Math.min(Math.max(Math.floor(limit), 1), 100)));

          const query = params.toString();
          return fetchJson(`/api/search${query ? `?${query}` : ""}`);
        },
      },
      {
        name: "freeport.get_listing",
        title: "Get Freeport listing",
        description: "Fetch one Freeport listing by row id or event id.",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", minLength: 1, description: "Listing row id or event id." },
          },
          additionalProperties: false,
        },
        annotations: commonAnnotations,
        execute: async (input) => fetchJson(`/api/listings/${encodeURIComponent(asString(input.id))}`),
      },
      {
        name: "freeport.list_categories",
        title: "List Freeport categories",
        description: "Return Freeport listing categories and descriptions.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: commonAnnotations,
        execute: async () => fetchJson("/api/categories"),
      },
      {
        name: "freeport.get_agent_instructions",
        title: "Get Freeport agent instructions",
        description: "Return the Freeport llms.txt instructions for agents.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: commonAnnotations,
        execute: async () => {
          const response = await fetch("/llms.txt", {
            headers: {
              accept: "text/plain",
            },
          });
          if (!response.ok) throw new Error(`Freeport instructions request failed with ${response.status}`);
          return { text: await response.text() };
        },
      },
    ];

    for (const tool of tools) {
      try {
        modelContext.registerTool(tool, { signal: controller.signal });
      } catch {
        // Duplicate registrations can happen during development remounts.
      }
    }

    return () => controller.abort();
  }, []);

  return null;
}
