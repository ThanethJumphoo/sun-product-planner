import React, { useState } from 'react';
import { Drawer } from '../../../../components/shared/Drawer';
import { useChickenYieldsUIStore } from '../stores/ui.store';
import { useChickenYield } from '../api/queries';
import { ChickenYieldStatusBadge } from '../components/ChickenYieldStatusBadge';
import { format } from 'date-fns';

type TabType = 'info' | 'audit';

export function ChickenYieldDetailDrawer() {
  const { isDetailDrawerOpen, closeDetailDrawer, selectedChickenYieldId } = useChickenYieldsUIStore();
  const [activeTab, setActiveTab] = useState<TabType>('info');

  const { data: chickenYield, isLoading } = useChickenYield(selectedChickenYieldId!, {
    enabled: isDetailDrawerOpen && !!selectedChickenYieldId,
  });

  return (
    <Drawer
      open={isDetailDrawerOpen}
      onClose={closeDetailDrawer}
      title={
        <div className="flex items-center space-x-3">
          <span>Chicken Yield Details</span>
          {chickenYield && <ChickenYieldStatusBadge status={chickenYield.status} />}
        </div>
      }
      size="md"
    >
      <div className="flex h-full flex-col">
        {/* Tabs */}
        <div className="border-b border-border px-6 pt-4">
          <nav className="-mb-px flex space-x-6">
            {(
              [
                { id: 'info', label: 'Information' },
                { id: 'audit', label: 'Audit' },
              ] as { id: TabType; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              Loading record details...
            </div>
          ) : !chickenYield ? (
            <div className="text-danger">Failed to load record details.</div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-6 rounded-lg border border-border bg-surface p-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Part Code</h4>
                    <p className="mt-1 text-base text-foreground font-mono">{chickenYield.partCode}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Part Name</h4>
                    <p className="mt-1 text-base text-foreground">{chickenYield.partName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Yield %</h4>
                    <p className="mt-1 text-base text-primary font-medium">{chickenYield.yieldPercent}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Sort Order</h4>
                    <p className="mt-1 text-base text-foreground">{chickenYield.sortOrder}</p>
                  </div>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="grid grid-cols-2 gap-6 rounded-lg border border-border bg-surface p-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Created At</h4>
                    <p className="mt-1 text-base text-foreground">
                      {chickenYield.createdAt ? format(new Date(chickenYield.createdAt), 'dd MMM yyyy HH:mm:ss') : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Created By</h4>
                    <p className="mt-1 text-base text-foreground">{chickenYield.createdBy || '-'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Updated At</h4>
                    <p className="mt-1 text-base text-foreground">
                      {chickenYield.updatedAt ? format(new Date(chickenYield.updatedAt), 'dd MMM yyyy HH:mm:ss') : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Updated By</h4>
                    <p className="mt-1 text-base text-foreground">{chickenYield.updatedBy || '-'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
