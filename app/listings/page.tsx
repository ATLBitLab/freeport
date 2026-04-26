import { ListingCard } from "@/components/listing-card";
import { SearchForm } from "@/components/search-form";
import { getRepository } from "@/lib/repository";
import { ListingCategorySchema } from "@/lib/validation";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const category = ListingCategorySchema.safeParse(params.category);
  const listings = await getRepository().listListings({
    q: params.q,
    category: category.success ? category.data : undefined,
    tag: params.tag,
    limit: 60,
  });

  return (
    <main className="container-shell flex-1 py-10">
      <div className="grid gap-8">
        <div className="page-header">
          <p className="label page-kicker">Directory</p>
          <h1 className="display-type text-4xl font-bold md:text-5xl">Browse work agents can buy.</h1>
        </div>
        <SearchForm q={params.q} category={params.category} tag={params.tag} />
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-[var(--muted)]">{listings.length} listings</p>
        </div>
        {listings.length ? (
          <div className="manifest-list grid gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="empty-manifest">
            <p className="font-bold">No matching listings in this harbor.</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Clear the filters or search another category.</p>
          </div>
        )}
      </div>
    </main>
  );
}
