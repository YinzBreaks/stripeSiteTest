import Link from "next/link";
import { ShoppingBag, LayoutGrid, User } from "lucide-react";

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span>Sports Card Shop</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/shop"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Shop
          </Link>
          <Link
            href="/collection"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <LayoutGrid className="h-4 w-4" />
            Collection
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors ml-2"
          >
            <User className="h-4 w-4" />
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
