import CardForm from "@/app/(admin)/admin/cards/CardForm";
import { createCard } from "@/app/(admin)/admin/cards/actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add Card" };

export default function NewCardPage() {
  return <CardForm title="Add New Card" action={createCard} />;
}
