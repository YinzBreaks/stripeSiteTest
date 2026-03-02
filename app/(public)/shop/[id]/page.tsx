import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BuyButton from "@/components/shop/BuyButton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCents } from "@/lib/utils";
import type { Card } from "@/lib/types";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

interface CardDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}

async function getCard(id: string): Promise<Card | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .single<Card>();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({
  params,
}: CardDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) return { title: "Card Not Found" };
  return {
    title: `${card.year} ${card.brand} ${card.player_name}`,
    description: `${card.set_name}${card.card_number ? ` #${card.card_number}` : ""}${card.grade ? ` · ${card.grade}` : ""}`,
  };
}

export default async function CardDetailPage({
  params,
  searchParams,
}: CardDetailPageProps) {
  const [{ id }, { cancelled }] = await Promise.all([params, searchParams]);
  const card = await getCard(id);

  if (!card) notFound();

  const detailRows: [string, string | number | null | undefined][] = [
    ["Player", card.player_name],
    ["Year", card.year],
    ["Brand", card.brand],
    ["Set", card.set_name],
    ["Card #", card.card_number],
    ["Variation", card.variation],
    ["Grade", card.grade],
    ["Sport", card.sport],
    ["Team", card.team],
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <Link
        href="/shop"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Shop
      </Link>

      {cancelled === "true" && (
        <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 text-sm">
          Your checkout was cancelled. The card is available again if you change your mind.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-10">
        {/* ── Images ── */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border bg-muted group cursor-zoom-in">
            <Image
              src={card.image_front_url ?? "/placeholder-card.png"}
              alt={`${card.player_name} — front`}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {card.image_back_url && (
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border bg-muted group cursor-zoom-in">
              <Image
                src={card.image_back_url}
                alt={`${card.player_name} — back`}
                fill
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </div>

        {/* ── Details ── */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold leading-tight">
              {card.player_name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {card.year} {card.brand} {card.set_name}
            </p>
            {card.grade && (
              <Badge className="mt-2 text-sm" variant="secondary">
                {card.grade}
              </Badge>
            )}
          </div>

          {card.status === "for_sale" && card.price_cents ? (
            <>
              <div className="text-4xl font-extrabold text-primary">
                {formatCents(card.price_cents)}
              </div>
              <BuyButton cardId={card.id} />
              <p className="text-xs text-muted-foreground text-center">
                Secure payment via Stripe. Ships within 2 business days.
              </p>
            </>
          ) : (
            <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              {card.status === "sold"
                ? "This card has been sold."
                : card.status === "pending"
                ? "This card is currently in another buyer's checkout."
                : "This card is part of the collection and not currently for sale."}
            </div>
          )}

          <Separator />

          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Card Details
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {detailRows
                .filter(([, v]) => v !== null && v !== undefined && v !== "")
                .map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {card.description && (
            <>
              <Separator />
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                  Description
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {card.description}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
