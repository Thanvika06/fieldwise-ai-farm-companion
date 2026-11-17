import { Link, useRouterState } from "@tanstack/react-router";
import logo from "@/assets/agrismart-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV_ITEMS } from "@/components/agri/nav-items";
import { useFarm } from "@/lib/farm-store";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile, isMobile } = useSidebar();
  const { simulation } = useFarm();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden" onClick={() => isMobile && setOpenMobile(false)}>
          <img src={logo} alt="" width={36} height={36} className="size-9 shrink-0 rounded-xl bg-sidebar-foreground/95 p-1" />
          <span className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-lg font-semibold text-sidebar-accent-foreground">AgriSmart AI</span>
            <span className="text-[11px] text-sidebar-foreground/70">Intelligent Farming Assistant</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className="h-10 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:font-semibold"
                    >
                      <Link to={item.to} onClick={() => isMobile && setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="rounded-xl bg-sidebar-accent p-3 text-xs text-sidebar-foreground/85">
          <p className="font-semibold text-sidebar-accent-foreground">Demo farm workspace</p>
          <p className="mt-1 leading-relaxed">
            Field values are sample data. AI analysis and weather are live.
            {simulation.enabled && <span className="mt-1 block font-semibold text-sidebar-primary">Simulation mode is on.</span>}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
