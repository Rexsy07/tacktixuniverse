import { Skeleton } from "./skeleton";

export function GameCardSkeleton() {
  return (
    <div className="glass-card animate-pulse">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <Skeleton className="h-4 w-4 mx-auto rounded-full" />
            <Skeleton className="h-4 w-8 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-4 w-4 mx-auto rounded-full" />
            <Skeleton className="h-4 w-8 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-4 w-4 mx-auto rounded-full" />
            <Skeleton className="h-4 w-8 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChallengeCardSkeleton() {
  return (
    <div className="glass-card animate-pulse">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="h-1 w-1 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="space-y-1">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeaderboardEntrySkeleton() {
  return (
    <div className="flex items-center justify-between p-4 glass rounded-lg animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="text-right space-y-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function GameStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="text-center p-3 glass rounded-lg animate-pulse">
          <Skeleton className="h-5 w-5 mx-auto mb-2 rounded-full" />
          <Skeleton className="h-5 w-12 mx-auto mb-1" />
          <Skeleton className="h-3 w-8 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function GameModeSkeleton() {
  return (
    <div className="glass-card animate-pulse">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function GameHeroSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      {/* Game Info */}
      <div className="lg:col-span-2">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative">
            <Skeleton className="w-full md:w-48 h-64 rounded-lg" />
          </div>
          
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            
            <GameStatsSkeleton />
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="glass-card p-6 animate-pulse">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}