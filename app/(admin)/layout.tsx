import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  ShoppingBag,
  LogOut,
  Plus,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r bg-muted/30 flex flex-col">
        <div className="px-6 py-5 border-b">
          <Link href="/admin" className="font-bold text-base">
            Admin Panel
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <NavLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>
            Dashboard
          </NavLink>
          <NavLink
            href="/admin/cards"
            icon={<CreditCard className="h-4 w-4" />}
          >
            Cards
          </NavLink>
          <NavLink
            href="/admin/cards/new"
            icon={<Plus className="h-4 w-4" />}
          >
            Add Card
          </NavLink>
          <NavLink
            href="/admin/orders"
            icon={<ShoppingBag className="h-4 w-4" />}
          >
            Orders
          </NavLink>
        </nav>
        <div className="px-3 pb-4">
          <form
            action={async () => {
              "use server";
              const { createClient: createServerClientInner } = await import(
                "@/lib/supabase/server"
              );
              const sb = await createServerClientInner();
              await sb.auth.signOut();
              redirect("/login");
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
