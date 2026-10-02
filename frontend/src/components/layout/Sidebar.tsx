"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLayoutStore } from "@/store/layout";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, ClipboardList, PieChart, Package, Settings, Users, Shield, KeyRound, LogOut, Activity, Database, ChevronDown, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

const staticMenuSections = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Sales & Demand",
    items: [
      { name: "Sale Orders", href: "/sale-orders", icon: Package },
      { name: "Demand Planning", href: "/demand-planning", icon: Calendar },
    ],
  },
  {
    label: "Chicken Receiving",
    items: [
      { name: "Monthly", href: "/chicken-receiving/monthly", icon: Calendar },
      { name: "Weekly", href: "/chicken-receiving/weekly", icon: Calendar },
      { name: "Daily", href: "/chicken-receiving/daily", icon: Calendar, disabled: true },
    ],
  },
  {
    label: "Master Data",
    items: [
      { name: "Product Spec", href: "/product-spec", icon: ClipboardList },
      { name: "Production Flow", href: "/production-flow", icon: Activity },
      { name: "Weight Distribution", href: "/weight-distribution", icon: PieChart },
    ],
  },
  {
    label: "ERP Data",
    items: [
      { name: "Item Master", href: "/erp/item-master", icon: Database },
      { name: "Sale Orders (ERP)", href: "/erp/sale-orders", icon: Database },
    ],
  },
  {
    label: "Administration",
    items: [
      { name: "Users", href: "/iam/users", icon: Users },
      { name: "Roles", href: "/iam/roles", icon: Shield },
      { name: "Permissions", href: "/iam/permissions", icon: KeyRound },
    ],
  },
];

export function Sidebar() {
  const { isSidebarOpen } = useLayoutStore();
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [dynamicMenus, setDynamicMenus] = React.useState<any[]>([]);
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => ({ ...prev, [name]: !prev[name] }));
  };

  React.useEffect(() => {
    // Check UI settings and fetch dynamic Planning menus if enabled
    const loadMenus = async () => {
      if (!isAuthenticated) return;

      try {
        const settingsRes = await api.get('/api/v1/system-settings');
        const hiddenPartsSetting = settingsRes.data.find((s: any) => s.key === 'ui_hidden_planning_parts')?.value;
        const hiddenParts = hiddenPartsSetting ? JSON.parse(hiddenPartsSetting) : [];

        const res = await api.get('/api/v1/simulator/boards/menu');
        if (res.data && res.data.length > 0) {
          // Filter out parts that the user has hidden
          const visibleParts = res.data.filter((part: any) => !hiddenParts.includes(part.name));

          if (visibleParts.length > 0) {
            const planningSection = {
              label: "Planning",
              items: visibleParts.map((part: any) => ({
                name: part.name,
                icon: Activity,
                subItems: [
                  { name: "MPS", href: `/planning/${encodeURIComponent(part.name)}/mps`, icon: ClipboardList },
                  { name: "DPS", href: `/planning/${encodeURIComponent(part.name)}/dps`, icon: Calendar, disabled: true },
                ],
              })),
            };
            setDynamicMenus([planningSection]);
          } else {
            setDynamicMenus([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch sidebar data", err);
      }
    };

    loadMenus();
  }, [isAuthenticated]);

  const menuSections = [...dynamicMenus, ...staticMenuSections];

  const handleLogout = async () => {
    await logout();
    router.push("/login"); // Next.js automatically prepends the basePath
  };

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => useLayoutStore.getState().setSidebarOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? 260 : (isSidebarOpen ? 260 : 80),
          x: isMobile ? (isSidebarOpen ? 0 : -260) : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "h-screen bg-card border-r border-border flex flex-col overflow-hidden shrink-0",
          isMobile ? "fixed left-0 top-0 bottom-0 z-50" : "relative z-30"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isMobile || (isMobile || isSidebarOpen) ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="font-bold text-xl text-primary whitespace-nowrap"
          >
            Sun<span className="text-foreground">Planner</span>
          </motion.div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6 hover-scrollbar">
          {menuSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <motion.p
                animate={{ opacity: (isMobile || isSidebarOpen) ? 1 : 0, height: (isMobile || isSidebarOpen) ? "auto" : 0 }}
                className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 mb-2 overflow-hidden"
              >
                {section.label}
              </motion.p>
              {section.items.map((item: any) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isActive = pathname === item.href || (hasSubItems && item.subItems.some((sub: any) => pathname === sub.href));
                const isExpanded = expandedItems[item.name];

                const content = (
                  <div
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors w-full",
                      isActive && !hasSubItems
                        ? "bg-primary text-primary-foreground cursor-pointer"
                        : item.disabled
                          ? "text-muted-foreground/50 cursor-not-allowed"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer",
                      isActive && hasSubItems && !isExpanded && "bg-primary/10 text-primary"
                    )}
                    title={!isSidebarOpen ? item.name : undefined}
                    onClick={() => {
                      if (hasSubItems) {
                        if (!isSidebarOpen) useLayoutStore.getState().setSidebarOpen(true);
                        toggleExpand(item.name);
                      }
                    }}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <motion.span
                      animate={{ opacity: (isMobile || isSidebarOpen) ? 1 : 0, width: (isMobile || isSidebarOpen) ? "auto" : 0 }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap overflow-hidden font-medium text-sm flex-1 text-left"
                    >
                      {item.name}
                    </motion.span>
                    {item.disabled && isSidebarOpen && !hasSubItems && (
                      <span className="ml-auto text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
                    )}
                    {hasSubItems && isSidebarOpen && (
                      isExpanded ? <ChevronDown className="w-4 h-4 shrink-0 opacity-50 ml-auto" /> : <ChevronRight className="w-4 h-4 shrink-0 opacity-50 ml-auto" />
                    )}
                  </div>
                );

                const wrappedContent = item.disabled && !hasSubItems ? (
                  <div key={item.name}>{content}</div>
                ) : hasSubItems ? (
                  <button key={item.name} className="w-full text-left" onClick={(e) => e.preventDefault()}>
                    {content}
                  </button>
                ) : (
                  <Link key={item.name} href={item.href}>
                    {content}
                  </Link>
                );

                return (
                  <div key={item.name} className="space-y-1">
                    {wrappedContent}

                    {/* Render SubItems */}
                    {hasSubItems && isExpanded && isSidebarOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-9 space-y-1 overflow-hidden"
                      >
                        {item.subItems.map((subItem: any) => {
                          const isSubActive = pathname === subItem.href;
                          const subContent = (
                            <div
                              className={cn(
                                "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                                isSubActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : subItem.disabled
                                    ? "text-muted-foreground/50 cursor-not-allowed"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                              )}
                            >
                              <subItem.icon className="w-4 h-4 shrink-0" />
                              <span className="whitespace-nowrap overflow-hidden text-sm">
                                {subItem.name}
                              </span>
                              {subItem.disabled && (
                                <span className="ml-auto text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
                              )}
                            </div>
                          );
                          return subItem.disabled ? (
                            <div key={subItem.name}>{subContent}</div>
                          ) : (
                            <Link key={subItem.name} href={subItem.href}>
                              {subContent}
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Link href="/settings">
            <div
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title={!isSidebarOpen ? "Settings" : undefined}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <motion.span
                animate={{ opacity: (isMobile || isSidebarOpen) ? 1 : 0, width: (isMobile || isSidebarOpen) ? "auto" : 0 }}
                className="whitespace-nowrap overflow-hidden font-medium text-sm"
              >
                Settings
              </motion.span>
            </div>
          </Link>
          <div
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2.5 mt-1 rounded-lg text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
            title={!isSidebarOpen ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <motion.span
              animate={{ opacity: (isMobile || isSidebarOpen) ? 1 : 0, width: (isMobile || isSidebarOpen) ? "auto" : 0 }}
              className="whitespace-nowrap overflow-hidden font-medium text-sm"
            >
              Logout
            </motion.span>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
