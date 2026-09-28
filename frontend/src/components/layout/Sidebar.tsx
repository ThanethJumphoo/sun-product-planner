"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLayoutStore } from "@/store/layout";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, ClipboardList, PieChart, Package, Settings, Users, Shield, KeyRound, LogOut, Activity, Database } from "lucide-react";
import { useAuthStore } from "@/store/auth";

const menuSections = [
  {
    label: "ERP Integration",
    items: [
      { name: "Item Master", href: "/erp/item-master", icon: Database },
      { name: "Sale Orders", href: "/erp/sale-orders", icon: Database },
    ],
  },
  {
    label: "Production",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Sale Orders", href: "/sale-orders", icon: Package },
      { name: "Demand Planning", href: "/demand", icon: Calendar, disabled: true },
      { name: "MPS", href: "/mps", icon: ClipboardList, disabled: true },
      { name: "Production Orders", href: "/orders", icon: Package, disabled: true },
      { name: "Yield Management", href: "/yield", icon: PieChart, disabled: true },
      { name: "Production Flow", href: "/production-flow", icon: Activity },
      { name: "Weight Distribution", href: "/weight-distribution", icon: ClipboardList },
    ],
  },
  {
    label: "Chicken Receiving",
    items: [
      { name: "Monthly", href: "/chicken-receiving/monthly", icon: Calendar },
      { name: "Weekly", href: "/chicken-receiving/weekly", icon: Calendar, disabled: true },
      { name: "Daily", href: "/chicken-receiving/daily", icon: Calendar, disabled: true },
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

  const handleLogout = async () => {
    await logout();
    router.push("/login"); // Adjust this route if login page is different
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

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {menuSections.map((section) => (
          <div key={section.label} className="space-y-1">
            <motion.p
              animate={{ opacity: (isMobile || isSidebarOpen) ? 1 : 0, height: (isMobile || isSidebarOpen) ? "auto" : 0 }}
              className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 mb-2 overflow-hidden"
            >
              {section.label}
            </motion.p>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const content = (
                <div
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground cursor-pointer"
                      : item.disabled 
                        ? "text-muted-foreground/50 cursor-not-allowed" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  )}
                  title={!isSidebarOpen ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <motion.span
                    animate={{ opacity: (isMobile || isSidebarOpen) ? 1 : 0, width: (isMobile || isSidebarOpen) ? "auto" : 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap overflow-hidden font-medium text-sm"
                  >
                    {item.name}
                  </motion.span>
                  {item.disabled && isSidebarOpen && (
                    <span className="ml-auto text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
                  )}
                </div>
              );

              return item.disabled ? (
                <div key={item.name}>{content}</div>
              ) : (
                <Link key={item.name} href={item.href}>
                  {content}
                </Link>
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
