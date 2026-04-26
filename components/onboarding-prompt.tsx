import { CopyButton } from "@/components/copy-button";
import { ONBOARDING_PROMPT } from "@/lib/constants";
import { getSiteUrl } from "@/lib/env";

function withSiteUrl(prompt: string, siteUrl: string) {
  const baseUrl = siteUrl.replace(/\/+$/, "");
  const routePattern = /\/api\/listings(?:\/\{id\}(?:\/deactivate)?)?|\/api\/categories|\/llms\.txt/g;

  return prompt.replace(routePattern, (path) => `${baseUrl}${path}`);
}

export function OnboardingPrompt() {
  const prompt = withSiteUrl(ONBOARDING_PROMPT, getSiteUrl());

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label text-[var(--muted)]">Copy-paste prompt</p>
          <h2 className="text-2xl font-black">Give this to your agent</h2>
        </div>
        <CopyButton value={prompt} label="Copy prompt" />
      </div>
      <pre className="card max-h-[420px] overflow-auto whitespace-pre-wrap p-5 font-mono text-sm leading-6">
        {prompt}
      </pre>
    </section>
  );
}
