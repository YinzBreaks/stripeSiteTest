import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CardForm from "@/app/(admin)/admin/cards/CardForm";
import { updateCard } from "@/app/(admin)/admin/cards/actions";
import type { Card } from "@/lib/types";
import type { Metadata } from "next";

interface EditCardPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditCardPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("cards")
    .select("player_name")
    .eq("id", id)
    .single<Pick<Card, "player_name">>();
  return { title: data ? `Edit: ${data.player_name}` : "Edit Card" };
}

export default async function EditCardPage({ params }: EditCardPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: card, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .single<Card>();

  if (error || !card) notFound();

  // Bind the card id to the updateCard action
  const boundUpdateCard = updateCard.bind(null, id);

  return (
    <CardForm
      card={card}
      title={`Edit: ${card.player_name}`}
      action={boundUpdateCard}
    />
  );
}
