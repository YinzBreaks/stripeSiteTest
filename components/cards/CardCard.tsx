import Image from "next/image";
import Link from "next/link";
import type { Card } from "@/lib/types";
import { formatCents } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CardCardProps {
  card: Card;
  showBuyButton?: boolean;
}

export default function CardCard({ card, showBuyButton = false }: CardCardProps) {
  const imageUrl = card.image_front_url ?? "/placeholder-card.svg";

  const statusColors: Record<string, string> = {
    for_sale: "bg-green-100 text-green-800",
    collection: "bg-blue-100 text-blue-800",
    sold: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="group relative flex flex-col rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <Link href={`/shop/${card.id}`} className="block aspect-[3/4] relative bg-gray-50">
        <Image
          src={imageUrl}
          alt={`${card.year} ${card.brand} ${card.player_name}`}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {card.grade && (
          <span className="absolute top-2 right-2 bg-black/75 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {card.grade}
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-1 p-3 flex-1">
        <Link href={`/shop/${card.id}`}>
          <h3 className="font-semibold text-sm leading-tight hover:text-primary transition-colors line-clamp-1">
            {card.player_name}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {card.year} {card.brand} {card.set_name}
          {card.card_number ? ` #${card.card_number}` : ""}
        </p>
        {card.team && (
          <p className="text-xs text-muted-foreground">{card.team}</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          {card.status === "for_sale" && card.price_cents ? (
            <span className="font-bold text-primary">
              {formatCents(card.price_cents)}
            </span>
          ) : (
            <Badge
              className={statusColors[card.status] ?? ""}
              variant="outline"
            >
              {card.status === "for_sale" ? "For Sale" : card.status === "collection" ? "Collection" : card.status === "sold" ? "Sold" : "Pending"}
            </Badge>
          )}

          {showBuyButton && card.status === "for_sale" && (
            <Link
              href={`/shop/${card.id}`}
              className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Buy
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
