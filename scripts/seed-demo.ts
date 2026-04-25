import { buildDemoData } from "../lib/demo-data";

async function main() {
  const base = (process.argv.find((arg) => arg.startsWith("--base="))?.split("=")[1] ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const demo = buildDemoData();

  for (const event of demo.events) {
    const feeResponse = await fetch(`${base}/api/listing-fee/request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pubkey: event.pubkey, listing_title: JSON.parse(event.content).title }),
    });
    const fee = await feeResponse.json();
    const listingResponse = await fetch(`${base}/api/listings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event,
        listing_fee_payment_id: fee.payment?.id,
      }),
    });
    const result = await listingResponse.json();
    console.log(JSON.stringify({ status: listingResponse.status, title: JSON.parse(event.content).title, result }));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
