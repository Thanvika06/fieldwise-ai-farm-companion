import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Check, ChevronDown, Globe, Home, LogOut, Search, Settings as SettingsIcon, UserRound } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { NAV_ITEMS } from "@/components/agri/nav-items";
import { AI_LANGUAGES, useFarm, type LanguageCode } from "@/lib/farm-store";
import { SAMPLE_ALERTS } from "@/lib/farm-data";
import { cn } from "@/lib/utils";
import logo from "@/assets/agrismart-logo.png";

const SEVERITY_DOT = { critical: "bg-danger", warning: "bg-warning", info: "bg-water" } as const;

export function TopBar() {
  const navigate = useNavigate();
  const { plots, settings, updateSettings, readAlertIds, markAlertRead, markAllAlertsRead, unreadCount } = useFarm();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (fn: () => void) => {
    setSearchOpen(false);
    fn();
  };

  const currentLang = AI_LANGUAGES.find((l) => l.code === settings.language) ?? AI_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md md:px-5">
      <SidebarTrigger className="size-9" aria-label="Toggle navigation" />
      <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
        <img src={logo} alt="AgriSmart AI" width={28} height={28} className="size-7" />
      </Link>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="ml-1 flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:max-w-md"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="truncate">Search pages, plots, crops…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 text-[10px] font-medium sm:inline">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5" aria-label="AI response language">
              <Globe className="size-4" />
              <span className="hidden max-w-24 truncate lg:inline">{currentLang.label.replace(/ \(.+\)$/, "")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>AI answers & reports language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={settings.language} onValueChange={(v) => updateSettings({ language: v as LanguageCode })}>
              {AI_LANGUAGES.map((l) => (
                <DropdownMenuRadioItem key={l.code} value={l.code}>
                  {l.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unreadCount} unread`}>
              <Bell className="size-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-destructive-foreground">{unreadCount}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[22rem] p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold">Alerts</p>
              <Button variant="ghost" size="sm" onClick={markAllAlertsRead} disabled={unreadCount === 0}>
                <Check className="size-3.5" /> Mark all read
              </Button>
            </div>
            <ul className="max-h-96 overflow-y-auto">
              {SAMPLE_ALERTS.map((a) => {
                const read = readAlertIds.has(a.id);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted", !read && "bg-accent/40")}
                      onClick={() => {
                        markAlertRead(a.id);
                        setNotifOpen(false);
                        navigate({ to: "/digital-twin", search: { plot: a.plotId } });
                      }}
                    >
                      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", SEVERITY_DOT[a.severity])} />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{a.title}</span>
                        <span className="block text-xs text-muted-foreground">{a.detail}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">{a.time} · Sample alert</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-1.5 sm:px-2" aria-label="Profile menu">
              <span className="grid size-8 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                {settings.ownerName.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-semibold">{settings.ownerName}</span>
                <span className="block text-[11px] text-muted-foreground">{settings.farmName}</span>
              </span>
              <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block">{settings.ownerName}</span>
              <span className="block text-xs font-normal text-muted-foreground">Demo account · no sign-in</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
              <UserRound /> Farm profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
              <SettingsIcon /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/" })}>
              <Home /> Back to home page
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <LogOut /> Sign out (accounts not enabled)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search pages, plots or crops…" />
        <CommandList>
          <CommandEmpty>No matches found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {NAV_ITEMS.map((item) => (
              <CommandItem key={item.to} value={item.label} onSelect={() => go(() => navigate({ to: item.to }))}>
                <item.icon /> {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Plots">
            {plots.map((p) => (
              <CommandItem key={p.id} value={`${p.name} ${p.crop} ${p.variety}`} onSelect={() => go(() => navigate({ to: "/digital-twin", search: { plot: p.id } }))}>
                <span className="size-2 rounded-full bg-leaf" /> {p.name} — {p.crop} <span className="ml-auto text-xs text-muted-foreground">Health {p.health}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem value="scan leaf photo disease" onSelect={() => go(() => navigate({ to: "/disease-detection" }))}>Scan a leaf photo</CommandItem>
            <CommandItem value="ask agribot question chat" onSelect={() => go(() => navigate({ to: "/assistant" }))}>Ask AgriBot a question</CommandItem>
            <CommandItem value="download pdf report" onSelect={() => go(() => navigate({ to: "/reports" }))}>Download farm health report</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
