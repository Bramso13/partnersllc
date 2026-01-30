"use client";

export function FormationsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-64 bg-surface rounded-lg mb-2 animate-pulse"></div>
        <div className="h-5 w-96 bg-surface rounded-lg animate-pulse"></div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl overflow-hidden"
          >
            {/* Thumbnail skeleton */}
            <div className="aspect-video bg-border animate-pulse"></div>

            {/* Content skeleton */}
            <div className="p-5 space-y-4">
              <div className="h-6 w-3/4 bg-border rounded-lg animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-border rounded-lg animate-pulse"></div>
                <div className="h-4 w-5/6 bg-border rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-border rounded-lg animate-pulse"></div>
                  <div className="h-3 w-12 bg-border rounded-lg animate-pulse"></div>
                </div>
                <div className="h-2 w-full bg-border rounded-full animate-pulse"></div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 w-32 bg-border rounded-lg animate-pulse"></div>
                <div className="h-4 w-4 bg-border rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
