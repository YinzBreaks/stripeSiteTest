"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dollarsToC } from "@/lib/utils";
import type { Card, CardStatus, Grade } from "@/lib/types";

const GRADES: Grade[] = [
  "Raw",
  "PSA 1","PSA 2","PSA 3","PSA 4","PSA 5","PSA 6","PSA 7","PSA 8","PSA 9","PSA 10",
  "BGS 1","BGS 2","BGS 3","BGS 4","BGS 5","BGS 6","BGS 7","BGS 8","BGS 9","BGS 9.5","BGS 10",
  "SGC 1","SGC 2","SGC 3","SGC 4","SGC 5","SGC 6","SGC 7","SGC 8","SGC 9","SGC 10",
];

const STATUSES: CardStatus[] = ["collection", "for_sale", "sold", "pending"];

function parseGrade(value: string): Grade | null {
  if (!value || value === "none") return null;
  return GRADES.includes(value as Grade) ? (value as Grade) : null;
}

function parseStatus(value: string): CardStatus {
  return STATUSES.includes(value as CardStatus)
    ? (value as CardStatus)
    : "collection";
}

async function uploadImage(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function ensureStripeProduct(
  card: {
    player_name: string;
    year: number;
    brand: string;
    set_name: string;
    card_number: string | null;
    variation: string | null;
    grade: string | null;
    price_cents: number;
    image_front_url: string | null;
    stripe_product_id: string | null;
    stripe_price_id: string | null;
  }
): Promise<{ stripe_product_id: string; stripe_price_id: string }> {
  // If a Stripe product already exists, archive the old price and create a new one
  if (card.stripe_product_id && card.stripe_price_id) {
    await getStripe().prices.update(card.stripe_price_id, { active: false });
    const price = await getStripe().prices.create({
      product: card.stripe_product_id,
      unit_amount: card.price_cents,
      currency: "usd",
    });
    return {
      stripe_product_id: card.stripe_product_id,
      stripe_price_id: price.id,
    };
  }

  // Create new product + price
  const product = await getStripe().products.create({
    name: `${card.year} ${card.brand} ${card.player_name}`,
    description: [
      card.set_name,
      card.card_number ? `#${card.card_number}` : null,
      card.variation,
      card.grade,
    ]
      .filter(Boolean)
      .join(" · "),
    images: card.image_front_url ? [card.image_front_url] : [],
  });

  const price = await getStripe().prices.create({
    product: product.id,
    unit_amount: card.price_cents,
    currency: "usd",
  });

  return { stripe_product_id: product.id, stripe_price_id: price.id };
}

// ─── Create ────────────────────────────────────────────────────────────────────

export async function createCard(formData: FormData) {
  const supabase = createServiceClient();

  const playerName = (formData.get("player_name") as string).trim();
  const year = parseInt(formData.get("year") as string, 10);
  const brand = (formData.get("brand") as string).trim();
  const setName = (formData.get("set_name") as string).trim();
  const cardNumber = ((formData.get("card_number") as string) || "").trim() || null;
  const variation = ((formData.get("variation") as string) || "").trim() || null;
  const sport = (formData.get("sport") as string).trim();
  const team = ((formData.get("team") as string) || "").trim() || null;
  const gradeRaw = (formData.get("grade") as string) || "";
  const grade = parseGrade(gradeRaw);
  const status = parseStatus(formData.get("status") as string);
  const priceInput = (formData.get("price") as string) || "";
  const priceCents = priceInput ? dollarsToC(priceInput) : null;
  const description = ((formData.get("description") as string) || "").trim() || null;

  const frontFile = formData.get("image_front") as File | null;
  const backFile = formData.get("image_back") as File | null;

  let imageFrontUrl: string | null = null;
  let imageBackUrl: string | null = null;

  const tempId = crypto.randomUUID();

  if (frontFile && frontFile.size > 0) {
    imageFrontUrl = await uploadImage(
      frontFile,
      "card-images",
      `${tempId}/front.${frontFile.name.split(".").pop()}`
    );
  }
  if (backFile && backFile.size > 0) {
    imageBackUrl = await uploadImage(
      backFile,
      "card-images",
      `${tempId}/back.${backFile.name.split(".").pop()}`
    );
  }

  let stripeProductId: string | null = null;
  let stripePriceId: string | null = null;

  if (status === "for_sale" && priceCents && priceCents > 0) {
    const stripeIds = await ensureStripeProduct({
      player_name: playerName,
      year,
      brand,
      set_name: setName,
      card_number: cardNumber,
      variation,
      grade: gradeRaw || null,
      price_cents: priceCents,
      image_front_url: imageFrontUrl,
      stripe_product_id: null,
      stripe_price_id: null,
    });
    stripeProductId = stripeIds.stripe_product_id;
    stripePriceId = stripeIds.stripe_price_id;
  }

  const { error } = await supabase.from("cards").insert({
    player_name: playerName,
    year,
    brand,
    set_name: setName,
    card_number: cardNumber,
    variation,
    grade,
    sport,
    team,
    status,
    price_cents: priceCents,
    image_front_url: imageFrontUrl,
    image_back_url: imageBackUrl,
    description,
    stripe_product_id: stripeProductId,
    stripe_price_id: stripePriceId,
  });

  if (error) {
    throw new Error(`Failed to create card: ${error.message}`);
  }

  revalidatePath("/admin/cards");
  revalidatePath("/shop");
  redirect("/admin/cards");
}

// ─── Update ────────────────────────────────────────────────────────────────────

export async function updateCard(cardId: string, formData: FormData) {
  const supabase = createServiceClient();

  // Fetch existing record for Stripe IDs and existing image URLs
  const { data: existing, error: fetchError } = await supabase
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .single<Card>();

  if (fetchError || !existing) {
    throw new Error("Card not found");
  }

  const playerName = (formData.get("player_name") as string).trim();
  const year = parseInt(formData.get("year") as string, 10);
  const brand = (formData.get("brand") as string).trim();
  const setName = (formData.get("set_name") as string).trim();
  const cardNumber = ((formData.get("card_number") as string) || "").trim() || null;
  const variation = ((formData.get("variation") as string) || "").trim() || null;
  const sport = (formData.get("sport") as string).trim();
  const team = ((formData.get("team") as string) || "").trim() || null;
  const gradeRaw = (formData.get("grade") as string) || "";
  const grade = parseGrade(gradeRaw);
  const status = parseStatus(formData.get("status") as string);
  const priceInput = (formData.get("price") as string) || "";
  const priceCents = priceInput ? dollarsToC(priceInput) : null;
  const description = ((formData.get("description") as string) || "").trim() || null;

  const frontFile = formData.get("image_front") as File | null;
  const backFile = formData.get("image_back") as File | null;

  let imageFrontUrl = existing.image_front_url;
  let imageBackUrl = existing.image_back_url;

  if (frontFile && frontFile.size > 0) {
    imageFrontUrl = await uploadImage(
      frontFile,
      "card-images",
      `${cardId}/front.${frontFile.name.split(".").pop()}`
    );
  }
  if (backFile && backFile.size > 0) {
    imageBackUrl = await uploadImage(
      backFile,
      "card-images",
      `${cardId}/back.${backFile.name.split(".").pop()}`
    );
  }

  let stripeProductId = existing.stripe_product_id;
  let stripePriceId = existing.stripe_price_id;

  if (status === "for_sale" && priceCents && priceCents > 0) {
    const stripeIds = await ensureStripeProduct({
      player_name: playerName,
      year,
      brand,
      set_name: setName,
      card_number: cardNumber,
      variation,
      grade: gradeRaw || null,
      price_cents: priceCents,
      image_front_url: imageFrontUrl,
      stripe_product_id: existing.stripe_product_id,
      stripe_price_id: existing.stripe_price_id,
    });
    stripeProductId = stripeIds.stripe_product_id;
    stripePriceId = stripeIds.stripe_price_id;
  }

  const { error } = await supabase
    .from("cards")
    .update({
      player_name: playerName,
      year,
      brand,
      set_name: setName,
      card_number: cardNumber,
      variation,
      grade,
      sport,
      team,
      status,
      price_cents: priceCents,
      image_front_url: imageFrontUrl,
      image_back_url: imageBackUrl,
      description,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
    })
    .eq("id", cardId);

  if (error) {
    throw new Error(`Failed to update card: ${error.message}`);
  }

  revalidatePath("/admin/cards");
  revalidatePath(`/admin/cards/${cardId}/edit`);
  revalidatePath(`/shop/${cardId}`);
  revalidatePath("/shop");
  redirect("/admin/cards");
}

// ─── Delete ────────────────────────────────────────────────────────────────────

export async function deleteCard(cardId: string) {
  const supabase = createServiceClient();

  const { data: card } = await supabase
    .from("cards")
    .select("stripe_product_id")
    .eq("id", cardId)
    .single<Pick<Card, "stripe_product_id">>();

  if (card?.stripe_product_id) {
    await getStripe().products.update(card.stripe_product_id, { active: false });
  }

  await supabase.storage.from("card-images").remove([`${cardId}/front`, `${cardId}/back`]); // best-effort

  const { error } = await supabase.from("cards").delete().eq("id", cardId);
  if (error) throw new Error(`Failed to delete card: ${error.message}`);

  revalidatePath("/admin/cards");
  revalidatePath("/shop");
  redirect("/admin/cards");
}
