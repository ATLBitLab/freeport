"use client";

import { Checkout } from "@moneydevkit/nextjs";
import { use } from "react";

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <main className="container-shell flex-1 py-10">
      <Checkout id={id} />
    </main>
  );
}
