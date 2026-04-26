import { revalidatePath } from "next/cache";

export function revalidateListingDiscovery(listingId?: string) {
  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath("/sitemap.xml");

  if (listingId) {
    revalidatePath(`/listings/${listingId}`);
  }
}
