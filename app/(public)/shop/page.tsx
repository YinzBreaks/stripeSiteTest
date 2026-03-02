import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import CardGrid from "@/components/cards/CardGrid";
import CardFilters from "@/components/cards/CardFilters";
import type { Card, ShopFilters } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shop" };
export const revalidate = 30;

interface ShopPageProps {
  searchParams: Promise<{
    sport?: string;
    grade?: string;
    team?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}

async function getCards(filters: ShopFilters): Promise<Card[]> {
  const supabase = await createClient();

  let query = supabase
    .from("cards")
    .select("*")
    .eq("status", "for_sale");

  if (filters.sport) query = query.eq("sport", filters.sport);
  if (filters.grade) query = query.eq("grade", filters.grade);
  if (filters.team) query = query.ilike("team", `%${filters.team}%`);
  if (filters.minPrice) query = query.gte("price_cents", filters.minPrice * 100);
  if (filters.maxPrice) query = query.lte("price_cents", filters.maxPrice * 100);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.returns<Card[]>();

  if (error) {
    console.error("[shop] Failed to fetch cards:", error);
    return [];
  }
  return data ?? [];
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const filters: ShopFilters = {
    sport: params.sport,
    grade: params.grade,
    team: params.team,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    sort: (params.sort as ShopFilters["sort"]) ?? "newest",
  };

  const cards = await getCards(filters);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Shop</h1>
        <p className="text-muted-foreground mt-1">
          {cards.length} card{cards.length !== 1 ? "s" : ""} available
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <Suspense>
          <CardFilters />
        </Suspense>

        <div className="flex-1 min-w-0">
          <CardGrid
            cards={cards}
            showBuyButton
            emptyMessage="No cards match your filters. Try adjusting the search criteria."
          />
        </div>
      </div>
    </div>
  );
}
