import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";
import type { Order } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders" };

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  paid: "default",
  pending: "secondary",
  shipped: "secondary",
  cancelled: "destructive",
  refunded: "outline",
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      cards!inner(player_name, year, brand)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="text-destructive">
        Failed to load orders: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Orders</h1>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Card</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Buyer</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Tracking</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(orders ?? []).map((order) => {
              const o = order as Order & {
                cards: { player_name: string; year: number; brand: string };
              };
              return (
                <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {o.cards.year} {o.cards.brand} {o.cards.player_name}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {o.buyer_email}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCents(o.amount_cents)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[o.status] ?? "outline"}>
                      {o.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {o.tracking_number ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(orders ?? []).length === 0 && (
          <p className="text-center py-12 text-muted-foreground">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
