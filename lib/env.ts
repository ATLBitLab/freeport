export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^/, "https://") ??
    "http://localhost:3000"
  );
}

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),
  );
}

export function hasMdkConfig() {
  return Boolean(process.env.MDK_ACCESS_TOKEN && process.env.MDK_MNEMONIC);
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
}
