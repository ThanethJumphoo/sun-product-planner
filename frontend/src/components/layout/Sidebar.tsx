"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useLayoutStore } from "@/store/layout";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, ClipboardList, PieChart, Package, Settings, Users, Shield, KeyRound } from "lucide-react";

const menuSections = [
  {
    label: "Production",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Demand Planning", href: "/demand", icon: Calendar },
      { name: "MPS", href: "/mps", icon: ClipboardList },
      { name: "Production Orders", href: "/orders", icon: Package },
      { name: "Yield Management", href: "/yield", icon: PieChart },
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

  return (
    <motion.aside
      initial={{ width: 260 }}
      animate={{ width: isSidebarOpen ? 260 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-card border-r border-border flex flex-col overflow-hidden shrink-0"
    >
      <div className="h-16 flex items-center px-6 border-b border-border">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isSidebarOpen ? 1 : 0 }}
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
              animate={{ opacity: isSidebarOpen ? 1 : 0, height: isSidebarOpen ? "auto" : 0 }}
              className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 mb-2 overflow-hidden"
            >
              {section.label}
            </motion.p>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title={!isSidebarOpen ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <motion.span
                      animate={{ opacity: isSidebarOpen ? 1 : 0, width: isSidebarOpen ? "auto" : 0 }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap overflow-hidden font-medium text-sm"
                    >
                      {item.name}
                    </motion.span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div
          className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title={!isSidebarOpen ? "Settings" : undefined}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <motion.span
            animate={{ opacity: isSidebarOpen ? 1 : 0, width: isSidebarOpen ? "auto" : 0 }}
            className="whitespace-nowrap overflow-hidden font-medium text-sm"
          >
            Settings
          </motion.span>
        </div>
      </div>
    </motion.aside>
  );
}
