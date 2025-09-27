import { Skeleton } from "./skeleton";
import { Card } from "./card";
import { Badge } from "./badge";

// Match Card Skeleton
export function MatchCardSkeleton() {
  return (
    <Card className="glass-card h-[280px]"> {/* Fixed height prevents layout shift */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        
        <Skeleton className="h-8 w-full" />
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        
        <Skeleton className="h-6 w-full" />
      </div>
    </Card>
  );
}

// Leaderboard Row Skeleton
export function LeaderboardRowSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-lg bg-muted/10 h-[88px]"> {/* Fixed height */}
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        <div className="flex items-center justify-center w-10 h-10">
          <Skeleton className="h-6 w-6" />
        </div>
        
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      
      <div className="text-right w-full sm:w-auto">
        <Skeleton className="h-6 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// Header Skeleton for wallet balance and notifications
export function HeaderSkeletons() {
  return (
    <>
      {/* Wallet Balance Skeleton */}
      <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-md bg-muted h-8 w-24"> {/* Fixed dimensions */}
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Notification Button Skeleton */}
      <div className="relative">
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
      
      {/* Profile Button Skeleton */}
      <Skeleton className="h-9 w-9 rounded-md" />
    </>
  );
}

// Live Match Feed Skeleton
export function LiveMatchFeedSkeleton() {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-background/50 min-h-[600px]"> {/* Fixed min-height */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        
        {/* Filter buttons */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        </div>
        
        {/* Match grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
        
        {/* CTA */}
        <div className="text-center mt-8">
          <Skeleton className="h-12 w-48 mx-auto" />
        </div>
      </div>
    </section>
  );
}

// Leaderboard Section Skeleton
export function LeaderboardSectionSkeleton() {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-background/50 min-h-[800px]"> {/* Fixed min-height */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="glass-card p-2 flex flex-wrap justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-20" />
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
                
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <LeaderboardRowSkeleton key={i} />
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Skeleton className="h-9 w-40 mx-auto" />
                </div>
              </div>
            </Card>
          </div>
          
          {/* Side Stats */}
          <div className="space-y-6">
            <Card className="glass-card h-[200px]"> {/* Fixed height */}
              <div className="p-6 text-center">
                <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
                <Skeleton className="h-5 w-20 mx-auto mb-2" />
                <Skeleton className="h-8 w-32 mx-auto mb-1" />
                <Skeleton className="h-4 w-40 mx-auto mb-4" />
                <Skeleton className="h-6 w-24 mx-auto" />
              </div>
            </Card>
            
            <Card className="glass-card h-[180px]"> {/* Fixed height */}
              <div className="p-6">
                <Skeleton className="h-5 w-24 mb-4" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* CTA */}
        <div className="text-center mt-12">
          <div className="glass-card max-w-2xl mx-auto p-8 h-[200px]"> {/* Fixed height */}
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-5 w-80 mx-auto mb-2" />
            <Skeleton className="h-5 w-72 mx-auto mb-6" />
            <Skeleton className="h-12 w-40 mx-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}

// Game Card Skeleton
export function GameCardSkeleton() {
  return (
    <Card className="glass-card overflow-hidden">
      <div className="card-slot card-slot--game">
        <div className="relative">
          <Skeleton className="w-full h-48" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </Card>
  );
}

// Tournament Card Skeleton
export function TournamentCardSkeleton() {
  return (
    <Card className="glass-card overflow-hidden">
      <div className="card-slot card-slot--tournament p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-6 w-48" />
        <div className="text-center">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-20 mx-auto mt-1" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </Card>
  );
}

// Generic content skeleton for preventing shifts
export function ContentSkeleton({ 
  height = "h-20", 
  children 
}: { 
  height?: string; 
  children?: React.ReactNode; 
}) {
  return (
    <div className={`${height} flex items-center justify-center`}>
      {children || <Skeleton className="h-8 w-32" />}
    </div>
  );
}
