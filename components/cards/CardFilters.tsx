"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const SPORTS = ["Baseball", "Basketball", "Football", "Hockey", "Soccer", "Tennis", "Golf", "Other"];
const GRADES = [
  "Raw",
  "PSA 10", "PSA 9", "PSA 8", "PSA 7", "PSA 6", "PSA 5", "PSA 4", "PSA 3", "PSA 2", "PSA 1",
  "BGS 10", "BGS 9.5", "BGS 9", "BGS 8", "BGS 7", "BGS 6", "BGS 5", "BGS 4", "BGS 3", "BGS 2", "BGS 1",
  "SGC 10", "SGC 9", "SGC 8", "SGC 7", "SGC 6", "SGC 5", "SGC 4", "SGC 3", "SGC 2", "SGC 1",
];

export default function CardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      return params.toString();
    },
    [searchParams]
  );

  const handleChange = (key: string, value: string) => {
    router.push(`${pathname}?${createQueryString({ [key]: value })}`);
  };

  const handleReset = () => {
    router.push(pathname);
  };

  return (
    <aside className="flex flex-col gap-5 p-4 bg-muted/40 rounded-xl border w-full lg:w-64 shrink-0">
      <h2 className="font-semibold text-base">Filters</h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-sport">Sport</Label>
        <Select
          value={searchParams.get("sport") ?? ""}
          onValueChange={(v) => handleChange("sport", v === "all" ? "" : v)}
        >
          <SelectTrigger id="filter-sport">
            <SelectValue placeholder="All sports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sports</SelectItem>
            {SPORTS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-grade">Grade</Label>
        <Select
          value={searchParams.get("grade") ?? ""}
          onValueChange={(v) => handleChange("grade", v === "all" ? "" : v)}
        >
          <SelectTrigger id="filter-grade">
            <SelectValue placeholder="Any grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any grade</SelectItem>
            {GRADES.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-team">Team</Label>
        <Input
          id="filter-team"
          placeholder="e.g. Yankees"
          defaultValue={searchParams.get("team") ?? ""}
          onBlur={(e) => handleChange("team", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleChange("team", (e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-min">Min $</Label>
          <Input
            id="filter-min"
            type="number"
            min={0}
            placeholder="0"
            defaultValue={searchParams.get("minPrice") ?? ""}
            onBlur={(e) => handleChange("minPrice", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-max">Max $</Label>
          <Input
            id="filter-max"
            type="number"
            min={0}
            placeholder="∞"
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onBlur={(e) => handleChange("maxPrice", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-sort">Sort by</Label>
        <Select
          value={searchParams.get("sort") ?? "newest"}
          onValueChange={(v) => handleChange("sort", v)}
        >
          <SelectTrigger id="filter-sort">
            <SelectValue placeholder="Newest first" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="price_asc">Price: Low → High</SelectItem>
            <SelectItem value="price_desc">Price: High → Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={handleReset} className="w-full mt-1">
        Clear filters
      </Button>
    </aside>
  );
}
