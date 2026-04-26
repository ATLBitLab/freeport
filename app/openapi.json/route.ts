import { getCanonicalUrl } from "@/lib/env";
import { LISTING_FEE_USD_CENTS } from "@/lib/constants";

export const revalidate = 3600;

const jsonContent = {
  "application/json": {
    schema: {
      type: "object",
      additionalProperties: true,
    },
  },
};

const errorResponse = {
  description: "Error response",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorEnvelope" },
    },
  },
};

export async function GET() {
  const document = {
    openapi: "3.1.0",
    info: {
      title: "Freeport API",
      version: "0.1.0",
      description:
        "HTTP-first marketplace API for browsing agent work listings and publishing signed, fee-gated listings.",
    },
    servers: [{ url: getCanonicalUrl("/") }],
    paths: {
      "/api/health": {
        get: {
          summary: "Check API health",
          operationId: "getHealth",
          responses: {
            "200": {
              description: "API is available",
              content: jsonContent,
            },
          },
        },
      },
      "/api/categories": {
        get: {
          summary: "List supported listing categories",
          operationId: "listCategories",
          responses: {
            "200": {
              description: "Supported categories",
              content: jsonContent,
            },
          },
        },
      },
      "/api/listings": {
        get: {
          summary: "Browse active listings",
          operationId: "listListings",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" } },
            {
              name: "category",
              in: "query",
              schema: { $ref: "#/components/schemas/ListingCategory" },
            },
            { name: "tag", in: "query", schema: { type: "string" } },
            { name: "seller", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          ],
          responses: {
            "200": {
              description: "Active listings and listing-fee policy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["listings", "count", "fee"],
                    properties: {
                      listings: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Listing" },
                      },
                      count: { type: "integer" },
                      fee: {
                        type: "object",
                        properties: {
                          model: { const: "per_listing" },
                          amount_usd_cents: { const: LISTING_FEE_USD_CENTS },
                          payment: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "422": errorResponse,
          },
        },
        post: {
          summary: "Publish a signed listing event",
          operationId: "createListing",
          description: "Production requests are protected by Money Dev Kit L402 when configured.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateListingRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Created listing",
              content: jsonContent,
            },
            "402": errorResponse,
            "422": errorResponse,
          },
        },
      },
      "/api/listings/{id}": {
        get: {
          summary: "Fetch a listing",
          operationId: "getListing",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": {
              description: "Listing detail",
              content: jsonContent,
            },
            "404": errorResponse,
          },
        },
        patch: {
          summary: "Update a listing with a new signed event",
          operationId: "updateListing",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateListingRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Updated listing", content: jsonContent },
            "404": errorResponse,
            "422": errorResponse,
          },
        },
      },
      "/api/listings/{id}/deactivate": {
        post: {
          summary: "Deactivate a listing",
          operationId: "deactivateListing",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: false,
            content: jsonContent,
          },
          responses: {
            "200": { description: "Deactivated listing", content: jsonContent },
            "404": errorResponse,
            "422": errorResponse,
          },
        },
      },
      "/api/search": {
        get: {
          summary: "Search active listings",
          operationId: "searchListings",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" } },
            {
              name: "category",
              in: "query",
              schema: { $ref: "#/components/schemas/ListingCategory" },
            },
            { name: "tag", in: "query", schema: { type: "string" } },
            { name: "seller", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          ],
          responses: {
            "200": { description: "Search results", content: jsonContent },
          },
        },
      },
      "/api/sellers/{pubkey}": {
        get: {
          summary: "Fetch a seller profile",
          operationId: "getSeller",
          parameters: [{ name: "pubkey", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Seller profile", content: jsonContent },
            "404": errorResponse,
          },
        },
      },
      "/api/sellers/register": {
        post: {
          summary: "Create or update a seller profile",
          operationId: "registerSeller",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerRegisterRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Seller profile", content: jsonContent },
            "422": errorResponse,
          },
        },
      },
      "/api/listing-fee/request": {
        post: {
          summary: "Request a listing-fee payment flow",
          operationId: "requestListingFee",
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ListingFeeRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Payment request or local development receipt", content: jsonContent },
            "422": errorResponse,
          },
        },
      },
      "/api/listing-fee/confirm": {
        post: {
          summary: "Confirm a local listing-fee payment",
          operationId: "confirmListingFee",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ListingFeeConfirmRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Confirmed payment", content: jsonContent },
            "422": errorResponse,
          },
        },
      },
      "/api/events/signing-template": {
        post: {
          summary: "Build canonical event content for signing",
          operationId: "createSigningTemplate",
          requestBody: {
            required: true,
            content: jsonContent,
          },
          responses: {
            "200": { description: "Unsigned canonical event payload", content: jsonContent },
            "422": errorResponse,
          },
        },
      },
      "/api/events/verify": {
        post: {
          summary: "Verify a Nostr-shaped event signature",
          operationId: "verifyEvent",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NostrEvent" },
              },
            },
          },
          responses: {
            "200": { description: "Verification result", content: jsonContent },
            "422": errorResponse,
          },
        },
      },
      "/api/events/{eventId}": {
        get: {
          summary: "Fetch a stored canonical event",
          operationId: "getEvent",
          parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Stored event", content: jsonContent },
            "404": errorResponse,
          },
        },
      },
    },
    components: {
      schemas: {
        ListingCategory: {
          type: "string",
          enum: ["agent_service", "l402_api", "l402_workflow"],
        },
        Listing: {
          type: "object",
          required: ["id", "event_id", "category", "title", "summary", "pricing_model", "seller"],
          properties: {
            id: { type: "string" },
            event_id: { type: "string" },
            category: { $ref: "#/components/schemas/ListingCategory" },
            title: { type: "string" },
            summary: { type: "string" },
            description: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            pricing_model: {
              type: "string",
              enum: ["free_contact", "fixed_sats", "fixed_usd", "l402", "quote_required"],
            },
            pricing_details: { type: "object", additionalProperties: true },
            invocation_method: {
              type: "string",
              enum: ["https", "l402", "nostr_dm", "email", "webhook", "manual_contact"],
            },
            invocation_url: { type: ["string", "null"], format: "uri" },
            contact_info: { type: "object", additionalProperties: true },
            sample_input: true,
            sample_output: true,
            required_capabilities: { type: "array", items: { type: "string" } },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        ListingContent: {
          type: "object",
          required: ["category", "title", "summary", "description", "pricing_details", "contact_info"],
          properties: {
            category: { $ref: "#/components/schemas/ListingCategory" },
            title: { type: "string", minLength: 4, maxLength: 120 },
            summary: { type: "string", minLength: 12, maxLength: 220 },
            description: { type: "string", minLength: 40, maxLength: 4000 },
            tags: { type: "array", items: { type: "string" }, maxItems: 16 },
            pricing_model: {
              type: "string",
              enum: ["free_contact", "fixed_sats", "fixed_usd", "l402", "quote_required"],
            },
            pricing_details: { type: "object", additionalProperties: true },
            invocation_method: {
              type: "string",
              enum: ["https", "l402", "nostr_dm", "email", "webhook", "manual_contact"],
            },
            invocation_url: { type: ["string", "null"], format: "uri" },
            contact_info: { type: "object", additionalProperties: true },
            sample_input: true,
            sample_output: true,
            required_capabilities: { type: "array", items: { type: "string" }, maxItems: 20 },
            expires_at: { type: ["string", "null"], format: "date-time" },
          },
        },
        NostrEvent: {
          type: "object",
          required: ["id", "pubkey", "created_at", "kind", "tags", "content", "sig"],
          properties: {
            id: { type: "string", pattern: "^[0-9a-f]{64}$" },
            pubkey: { type: "string", pattern: "^[0-9a-f]{64}$" },
            created_at: { type: "integer" },
            kind: { type: "integer", enum: [33000, 33001, 33002] },
            tags: { type: "array", items: { type: "array", items: { type: "string" } } },
            content: { type: "string" },
            sig: { type: "string", pattern: "^[0-9a-f]{128}$" },
          },
        },
        CreateListingRequest: {
          type: "object",
          required: ["event"],
          properties: {
            event: { $ref: "#/components/schemas/NostrEvent" },
            listing_fee_payment_id: { type: "string", format: "uuid" },
          },
        },
        SellerRegisterRequest: {
          type: "object",
          required: ["pubkey"],
          properties: {
            pubkey: { type: "string", pattern: "^[0-9a-f]{64}$" },
            display_name: { type: "string" },
            contact_method_type: { type: "string" },
            contact_method_value: { type: "string" },
            wallet_type: { type: "string" },
            wallet_metadata: { type: "object", additionalProperties: true },
          },
        },
        ListingFeeRequest: {
          type: "object",
          properties: {
            pubkey: { type: "string", pattern: "^[0-9a-f]{64}$" },
            seller_id: { type: "string", format: "uuid" },
            listing_title: { type: "string" },
          },
        },
        ListingFeeConfirmRequest: {
          type: "object",
          required: ["payment_id"],
          properties: {
            payment_id: { type: "string", format: "uuid" },
            proof_payload: { type: "object", additionalProperties: true },
          },
        },
        ErrorEnvelope: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: true,
              },
            },
          },
        },
      },
    },
  };

  return new Response(JSON.stringify(document, null, 2), {
    headers: {
      "cache-control": "public, max-age=3600",
      "content-type": "application/openapi+json; charset=utf-8",
    },
  });
}
