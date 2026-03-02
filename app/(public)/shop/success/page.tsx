import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Confirmed" };

export default function SuccessPage() {
  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center gap-6 max-w-lg">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <h1 className="text-4xl font-bold">Order Confirmed!</h1>
      <p className="text-muted-foreground text-lg">
        Thank you for your purchase. You will receive a confirmation email
        shortly. Your card will ship within 2 business days.
      </p>
      <Button asChild size="lg">
        <Link href="/shop">Continue Shopping</Link>
      </Button>
    </div>
  );
}
