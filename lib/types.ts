// ─── Card ────────────────────────────────────────────────────────────────────

export type CardStatus = "collection" | "for_sale" | "sold" | "pending";

export type Grade =
  | "Raw"
  | "PSA 1"
  | "PSA 2"
  | "PSA 3"
  | "PSA 4"
  | "PSA 5"
  | "PSA 6"
  | "PSA 7"
  | "PSA 8"
  | "PSA 9"
  | "PSA 10"
  | "BGS 1"
  | "BGS 2"
  | "BGS 3"
  | "BGS 4"
  | "BGS 5"
  | "BGS 6"
  | "BGS 7"
  | "BGS 8"
  | "BGS 9"
  | "BGS 9.5"
  | "BGS 10"
  | "SGC 1"
  | "SGC 2"
  | "SGC 3"
  | "SGC 4"
  | "SGC 5"
  | "SGC 6"
  | "SGC 7"
  | "SGC 8"
  | "SGC 9"
  | "SGC 10";

export interface Card {
  id: string;
  created_at: string;
  updated_at: string;
  player_name: string;
  year: number;
  brand: string;
  set_name: string;
  card_number: string | null;
  variation: string | null;
  grade: Grade | null;
  sport: string;
  team: string | null;
  status: CardStatus;
  price_cents: number | null;
  image_front_url: string | null;
  image_back_url: string | null;
  description: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "cancelled"
  | "refunded";

export interface ShippingAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: string;
  created_at: string;
  card_id: string;
  buyer_email: string;
  buyer_name: string | null;
  stripe_session_id: string;
  stripe_payment_intent_id: string | null;
  status: OrderStatus;
  tracking_number: string | null;
  shipping_address: ShippingAddress | null;
  amount_cents: number;
}

// ─── API payloads ─────────────────────────────────────────────────────────────

export interface CheckoutRequestBody {
  cardId: string;
}

export interface CheckoutResponseBody {
  url: string;
}

// ─── Shop filters ─────────────────────────────────────────────────────────────

export interface ShopFilters {
  sport?: string;
  grade?: string;
  minPrice?: number;
  maxPrice?: number;
  team?: string;
  sort?: "price_asc" | "price_desc" | "newest" | "oldest";
}
