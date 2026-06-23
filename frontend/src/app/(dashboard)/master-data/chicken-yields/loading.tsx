import React from 'react';

export default function ChickenYieldsLoading() {
  return (
    <div className="flex flex-col space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded bg-muted" />
      </div>

      <div className="flex h-14 w-full items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2 animate-pulse">
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="h-8 w-32 rounded bg-muted" />
      </div>

      <div className="h-[600px] w-full animate-pulse rounded-lg border border-border bg-surface p-4">
        <div className="flex space-x-4 border-b border-border pb-4">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-6 w-24 rounded bg-muted" />
          <div className="h-6 w-24 rounded bg-muted" />
        </div>
        <div className="mt-4 space-y-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="h-8 w-32 rounded bg-muted/50" />
              <div className="h-8 w-48 rounded bg-muted/50" />
              <div className="h-8 w-32 rounded bg-muted/50" />
              <div className="h-8 w-24 rounded bg-muted/50" />
              <div className="h-8 w-24 rounded bg-muted/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
