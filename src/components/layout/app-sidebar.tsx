"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  FolderOpen,
  TrendingUp,
  Target,
  Upload,
  Settings,
  Sun,
  Moon,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Monthly Update", href: "/monthly-update", icon: CalendarDays },
  { label: "Accounts", href: "/accounts", icon: Wallet },
  { label: "Categories", href: "/categories", icon: FolderOpen },
  { label: "Net Worth History", href: "/history", icon: TrendingUp },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Import Data", href: "/import", icon: Upload },
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

function SidebarFooter() {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <p className="truncate text-xs text-muted-foreground">
          user@example.com
        </p>
        <ThemeToggle />
      </div>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
        <LogOut className="size-4" />
        Sign out
      </Button>
    </div>
  );
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <Menu className="size-5" />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col px-4 py-6">
          <SheetHeader className="mb-6 px-3">
            <SheetTitle className="flex items-center gap-2 text-left text-lg font-bold tracking-tight">
              <Wallet className="size-5 text-primary" />
              Wealth Tracker
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <NavLinks />
          </div>
          <SidebarFooter />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-r md:border-border">
      <div className="flex h-full flex-col px-4 py-6">
        <div className="mb-6 flex items-center gap-2 px-3">
          <Wallet className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">
            Wealth Tracker
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <SidebarFooter />
      </div>
    </aside>
  );
}

export function AppSidebar() {
  return (
    <>
      <DesktopSidebar />
    </>
  );
}
