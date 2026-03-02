import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import CardGrid from "@/components/cards/CardGrid";
import { Button } from "@/components/ui/button";
import type { Card } from "@/lib/types";

export const revalidate = 60;

async function getFeaturedCards(): Promise<Card[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("status", "for_sale")
    .order("created_at", { ascending: false })
    .limit(8)
    .returns<Card[]>();

  if (error) {
    console.error("[homepage] Failed to fetch featured cards:", error);
    return [];
  }
  return data ?? [];
}

export default async function HomePage() {
  const featuredCards = await getFeaturedCards();

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/placeholder-card.svg')] bg-cover bg-center" />
        <div className="relative container mx-auto px-4 py-28 flex flex-col items-center text-center gap-6">
          <span className="bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
            Premium Sports Cards
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight max-w-3xl">
            Find Your Next
            <br />
            <span className="text-blue-300">Graded Gem</span>
          </h1>
          <p className="text-blue-100 max-w-xl text-lg">
            We specialize in high-grade PSA, BGS, and SGC cards across baseball,
            basketball, football, and more. Every card authenticated and shipped
            securely.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Button size="lg" asChild className="bg-white text-blue-900 hover:bg-blue-50 font-bold shadow-lg">
              <Link href="/shop">Browse the Shop</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/40 text-white hover:bg-white/10">
              <Link href="/collection">View Full Collection</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Featured cards ── */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Cards</h2>
            <p className="text-muted-foreground mt-1">Freshly listed and ready to ship</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/shop">View all →</Link>
          </Button>
        </div>
        <CardGrid cards={featuredCards} showBuyButton emptyMessage="No cards currently for sale — check back soon!" />
      </section>

      {/* ── About ── */}
      <section className="bg-muted/40 border-y">
        <div className="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-5">
            <h2 className="text-3xl font-bold">Why Buy From Us?</h2>
            <ul className="flex flex-col gap-4 text-muted-foreground">
              {[
                ["100% Authentic", "Every card is graded by PSA, BGS, or SGC — guaranteed genuine."],
                ["Fast Shipping", "Orders ship within 2 business days with full tracking."],
                ["Secure Checkout", "Payments handled by Stripe. We never touch your card details."],
                ["Trusted Seller", "Hundreds of happy collectors across the country."],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                  <span><strong className="text-foreground">{title}</strong> — {desc}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="w-fit mt-2">
              <Link href="/shop">Shop Now</Link>
            </Button>
          </div>
          <div className="rounded-2xl overflow-hidden aspect-square bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <span className="text-6xl select-none">🏆</span>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container mx-auto px-4 py-20 text-center flex flex-col items-center gap-6">
        <h2 className="text-4xl font-bold">Ready to add to your collection?</h2>
        <p className="text-muted-foreground max-w-md">
          Browse hundreds of graded cards and complete your purchase in seconds
          via our secure Stripe checkout.
        </p>
        <Button size="lg" asChild>
          <Link href="/shop">Explore the Shop →</Link>
        </Button>
      </section>
    </>
  );
}
