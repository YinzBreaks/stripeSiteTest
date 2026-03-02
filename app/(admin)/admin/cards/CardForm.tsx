"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Card, Grade } from "@/lib/types";
import { Loader2, Upload } from "lucide-react";

const GRADES: Grade[] = [
  "Raw",
  "PSA 1","PSA 2","PSA 3","PSA 4","PSA 5","PSA 6","PSA 7","PSA 8","PSA 9","PSA 10",
  "BGS 1","BGS 2","BGS 3","BGS 4","BGS 5","BGS 6","BGS 7","BGS 8","BGS 9","BGS 9.5","BGS 10",
  "SGC 1","SGC 2","SGC 3","SGC 4","SGC 5","SGC 6","SGC 7","SGC 8","SGC 9","SGC 10",
];

const SPORTS = ["Baseball", "Basketball", "Football", "Hockey", "Soccer", "Tennis", "Golf", "Other"];
const STATUSES = [
  { value: "collection", label: "Collection" },
  { value: "for_sale", label: "For Sale" },
  { value: "sold", label: "Sold" },
  { value: "pending", label: "Pending" },
];

interface CardFormProps {
  card?: Card;
  action: (formData: FormData) => Promise<void>;
  title: string;
}

export default function CardForm({ card, action, title }: CardFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(
    card?.image_front_url ?? null
  );
  const [backPreview, setBackPreview] = useState<string | null>(
    card?.image_back_url ?? null
  );

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-3xl font-bold">{title}</h1>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Player & Year */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Player Name" required>
          <Input
            name="player_name"
            defaultValue={card?.player_name ?? ""}
            required
            placeholder="Mike Trout"
          />
        </Field>
        <Field label="Year" required>
          <Input
            name="year"
            type="number"
            min={1900}
            max={2100}
            defaultValue={card?.year ?? new Date().getFullYear()}
            required
          />
        </Field>
      </div>

      {/* Brand & Set */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand" required>
          <Input
            name="brand"
            defaultValue={card?.brand ?? ""}
            required
            placeholder="Topps"
          />
        </Field>
        <Field label="Set Name" required>
          <Input
            name="set_name"
            defaultValue={card?.set_name ?? ""}
            required
            placeholder="Chrome"
          />
        </Field>
      </div>

      {/* Card # & Variation */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Card Number">
          <Input
            name="card_number"
            defaultValue={card?.card_number ?? ""}
            placeholder="27"
          />
        </Field>
        <Field label="Variation">
          <Input
            name="variation"
            defaultValue={card?.variation ?? ""}
            placeholder="Refractor"
          />
        </Field>
      </div>

      {/* Sport & Team */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Sport" required>
          <Select name="sport" defaultValue={card?.sport ?? "Baseball"} required>
            <SelectTrigger>
              <SelectValue placeholder="Select sport" />
            </SelectTrigger>
            <SelectContent>
              {SPORTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Team">
          <Input
            name="team"
            defaultValue={card?.team ?? ""}
            placeholder="Angels"
          />
        </Field>
      </div>

      {/* Grade, Status, Price */}
      <div className="grid grid-cols-3 gap-4">
        <Field label="Grade">
          <Select name="grade" defaultValue={card?.grade ?? ""}>
            <SelectTrigger>
              <SelectValue placeholder="No grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Raw / Not graded</SelectItem>
              {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status" required>
          <Select name="status" defaultValue={card?.status ?? "collection"} required>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Price (USD)">
          <Input
            name="price"
            type="number"
            min={0.01}
            step={0.01}
            defaultValue={card?.price_cents ? (card.price_cents / 100).toFixed(2) : ""}
            placeholder="49.99"
          />
        </Field>
      </div>

      {/* Images */}
      <div className="grid grid-cols-2 gap-4">
        <ImageField
          label="Front Image"
          name="image_front"
          preview={frontPreview}
          onChange={(e) => handleImageChange(e, setFrontPreview)}
        />
        <ImageField
          label="Back Image"
          name="image_back"
          preview={backPreview}
          onChange={(e) => handleImageChange(e, setBackPreview)}
        />
      </div>

      {/* Description */}
      <Field label="Description">
        <Textarea
          name="description"
          defaultValue={card?.description ?? ""}
          rows={4}
          placeholder="Additional notes about the card condition, centering, etc."
        />
      </Field>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isPending ? "Saving…" : "Save Card"}
      </Button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ImageField({
  label,
  name,
  preview,
  onChange,
}: {
  label: string;
  name: string;
  preview: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Field label={label}>
      <div className="relative aspect-[3/4] rounded-lg border-2 border-dashed bg-muted/30 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
        {preview ? (
          <Image src={preview} alt={label} fill className="object-contain p-1" unoptimized />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
            <Upload className="h-6 w-6" />
            <span>Upload image</span>
          </div>
        )}
        <input
          type="file"
          name={name}
          accept="image/*"
          onChange={onChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </Field>
  );
}
