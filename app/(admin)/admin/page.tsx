import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalCards },
    { count: forSaleCards },
    { count: soldCards },
    { count: totalOrders },
    { count: pendingOrders },
  ] = await Promise.all([
    supabase.from("cards").select("*", { count: "exact", head: true }),
    supabase
      .from("cards")
      .select("*", { count: "exact", head: true })
      .eq("status", "for_sale"),
    supabase
      .from("cards")
      .select("*", { count: "exact", head: true })
      .eq("status", "sold"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid"),
  ]);

  const stats = [
    { label: "Total Cards", value: totalCards ?? 0 },
    { label: "For Sale", value: forSaleCards ?? 0 },
    { label: "Sold", value: soldCards ?? 0 },
    { label: "Total Orders", value: totalOrders ?? 0 },
    { label: "Orders to Ship", value: pendingOrders ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/admin/cards/new">+ Add Card</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" asChild className="justify-start">
              <Link href="/admin/cards">Manage Cards</Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/admin/orders">View Orders</Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/shop" target="_blank" rel="noopener noreferrer">
                View Public Shop ↗
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
