import type { Card } from "@/lib/types";
import CardCard from "./CardCard";

interface CardGridProps {
  cards: Card[];
  showBuyButton?: boolean;
  emptyMessage?: string;
}

export default function CardGrid({
  cards,
  showBuyButton = false,
  emptyMessage = "No cards found.",
}: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <CardCard key={card.id} card={card} showBuyButton={showBuyButton} />
      ))}
    </div>
  );
}
