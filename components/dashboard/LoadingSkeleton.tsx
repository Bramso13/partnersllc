"use client";

export function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Welcome header skeleton */}
      <div className="mb-8">
        <div className="h-9 w-64 bg-brand-dark-surface rounded-lg mb-2 animate-pulse"></div>
        <div className="h-5 w-96 bg-brand-dark-surface rounded-lg animate-pulse"></div>
      </div>

      {/* Progress overview skeleton */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-8 bg-brand-dark-bg rounded-2xl p-6">
          <div className="h-6 w-48 bg-brand-dark-surface rounded-lg mb-4 animate-pulse"></div>
          <div className="h-4 w-32 bg-brand-dark-surface rounded-lg mb-6 animate-pulse"></div>
          <div className="h-2.5 w-full bg-brand-dark-surface rounded-full mb-6 animate-pulse"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-brand-dark-surface rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        </div>
        <div className="col-span-4 space-y-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 bg-brand-dark-bg rounded-2xl p-6 animate-pulse"
            >
              <div className="h-4 w-32 bg-brand-dark-surface rounded-lg mb-4"></div>
              <div className="h-8 w-24 bg-brand-dark-surface rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid skeleton */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-brand-dark-bg rounded-2xl p-6">
          <div className="h-6 w-48 bg-brand-dark-surface rounded-lg mb-4 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-brand-dark-surface rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-brand-dark-surface rounded-lg animate-pulse"></div>
                  <div className="h-4 w-64 bg-brand-dark-surface rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-brand-dark-bg rounded-2xl p-4">
          <div className="h-6 w-40 bg-brand-dark-surface rounded-lg mb-4 animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-brand-dark-surface rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
