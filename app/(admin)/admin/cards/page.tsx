import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";
import type { Card } from "@/lib/types";
import type { Metadata } from "next";
import { Pencil, Plus } from "lucide-react";

export const metadata: Metadata = { title: "Manage Cards" };

export default async function AdminCardsPage() {
  const supabase = await createClient();
  const { data: cards, error } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Card[]>();

  if (error) {
    return (
      <div className="text-destructive">
        Failed to load cards: {error.message}
      </div>
    );
  }

  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    for_sale: "default",
    collection: "secondary",
    sold: "outline",
    pending: "outline",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cards</h1>
        <Button asChild>
          <Link href="/admin/cards/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Player</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Year / Brand</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Grade</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Price</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(cards ?? []).map((card) => (
              <tr key={card.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{card.player_name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {card.year} {card.brand}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {card.grade ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[card.status] ?? "outline"}>
                    {card.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {card.price_cents ? formatCents(card.price_cents) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/admin/cards/${card.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit {card.player_name}</span>
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(cards ?? []).length === 0 && (
          <p className="text-center py-12 text-muted-foreground">
            No cards yet.{" "}
            <Link href="/admin/cards/new" className="text-primary hover:underline">
              Add the first one.
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
