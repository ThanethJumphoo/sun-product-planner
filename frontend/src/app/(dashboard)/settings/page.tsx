"use client";

import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Database, Settings2 } from 'lucide-react';
import SimulatorSettings from './components/SimulatorSettings';
import ErpSettings from './components/ErpSettings';

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full w-full p-4 md:p-8 overflow-y-auto bg-slate-50/50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Settings</h1>
        <p className="text-muted-foreground mt-2">Manage Master Data, Simulator Configurations, and ERP Integration.</p>
      </div>

      <Tabs.Root defaultValue="simulator" className="flex flex-col flex-1">
        <Tabs.List className="flex border-b border-border mb-6">
          <Tabs.Trigger
            value="simulator"
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-600 hover:text-primary border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all"
          >
            <Settings2 className="w-4 h-4" />
            Simulator Settings
          </Tabs.Trigger>
          <Tabs.Trigger
            value="erp"
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-600 hover:text-primary border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all"
          >
            <Database className="w-4 h-4" />
            ERP Integration
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="simulator" className="flex-1 outline-none">
          <SimulatorSettings />
        </Tabs.Content>

        <Tabs.Content value="erp" className="flex-1 outline-none">
          <ErpSettings />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
