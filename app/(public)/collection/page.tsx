import { createClient } from "@/lib/supabase/server";
import CardGrid from "@/components/cards/CardGrid";
import { Separator } from "@/components/ui/separator";
import type { Card } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Collection" };
export const revalidate = 60;

async function getAllCards(): Promise<Card[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("sport", { ascending: true })
    .order("player_name", { ascending: true })
    .returns<Card[]>();

  if (error) {
    console.error("[collection] Failed to fetch cards:", error);
    return [];
  }
  return data ?? [];
}

export default async function CollectionPage() {
  const cards = await getAllCards();

  const bySport = cards.reduce<Record<string, Card[]>>((acc, card) => {
    const key = card.sport;
    if (!acc[key]) acc[key] = [];
    acc[key].push(card);
    return acc;
  }, {});

  const sports = Object.keys(bySport).sort();

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Full Collection</h1>
        <p className="text-muted-foreground mt-1">
          {cards.length} card{cards.length !== 1 ? "s" : ""} across{" "}
          {sports.length} sport{sports.length !== 1 ? "s" : ""}
        </p>
      </div>

      {sports.length === 0 ? (
        <p className="text-muted-foreground text-center py-24">
          The collection is empty. Check back soon!
        </p>
      ) : (
        <div className="flex flex-col gap-16">
          {sports.map((sport, idx) => (
            <section key={sport}>
              {idx > 0 && <Separator className="mb-12" />}
              <h2 className="text-2xl font-bold mb-6">{sport}</h2>
              <CardGrid
                cards={bySport[sport]}
                emptyMessage={`No ${sport} cards in the collection yet.`}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
