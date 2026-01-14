"use client";

export function DossiersLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-brand-dark-surface border border-brand-dark-border rounded-xl p-6 animate-pulse"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="h-6 w-3/4 bg-brand-dark-bg rounded-lg mb-2"></div>
            </div>
            <div className="h-6 w-20 bg-brand-dark-bg rounded-full"></div>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-24 bg-brand-dark-bg rounded"></div>
              <div className="h-4 w-12 bg-brand-dark-bg rounded"></div>
            </div>
            <div className="h-2.5 w-full bg-brand-dark-bg rounded-full"></div>
          </div>
          <div className="mb-4">
            <div className="h-4 w-20 bg-brand-dark-bg rounded mb-1"></div>
            <div className="h-5 w-full bg-brand-dark-bg rounded"></div>
          </div>
          <div className="pt-4 border-t border-brand-dark-border">
            <div className="h-3 w-32 bg-brand-dark-bg rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
