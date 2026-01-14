export function DocumentsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-64 bg-brand-dark-surface rounded animate-pulse" />
          <div className="h-5 w-96 bg-brand-dark-surface rounded animate-pulse" />
        </div>
        <div className="h-10 w-48 bg-brand-dark-surface rounded animate-pulse" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap gap-4">
        <div className="h-10 w-32 bg-brand-dark-surface rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-brand-dark-surface rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-brand-dark-surface rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-brand-dark-surface rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-brand-dark-surface rounded-lg animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-brand-dark-bg border border-brand-dark-border rounded-2xl p-2">
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-brand-dark-border">
            <div className="h-4 w-24 bg-brand-dark-surface rounded animate-pulse" />
            <div className="h-4 w-24 bg-brand-dark-surface rounded animate-pulse" />
            <div className="h-4 w-24 bg-brand-dark-surface rounded animate-pulse" />
            <div className="h-4 w-24 bg-brand-dark-surface rounded animate-pulse" />
          </div>

          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="grid grid-cols-4 gap-4 px-4 py-4 border-b border-brand-dark-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-brand-dark-surface rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-brand-dark-surface rounded animate-pulse" />
                  <div className="h-3 w-32 bg-brand-dark-surface rounded animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-32 bg-brand-dark-surface rounded animate-pulse my-auto" />
              <div className="h-6 w-24 bg-brand-dark-surface rounded-full animate-pulse my-auto" />
              <div className="flex justify-end gap-2">
                <div className="h-9 w-9 bg-brand-dark-surface rounded animate-pulse" />
                <div className="h-9 w-9 bg-brand-dark-surface rounded animate-pulse" />
                <div className="h-9 w-9 bg-brand-dark-surface rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
