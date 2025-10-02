import React from 'react';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { CreatorCard } from '@/components/CreatorCard';
import { useCreators } from '@/hooks/useCreators';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Star, Users, Trophy } from 'lucide-react';

const CreatorSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full rounded-lg" />
    <div className="p-6 space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  </div>
);

export default function CreatorsOfTheWeek() {
  const { creators, loading, error, refetch } = useCreators();

  return (
    <div className="min-h-screen bg-background page-with-header">
      <Header />
      
      <main className="container mx-auto px-4 page-content">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="text-primary" size={32} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Creators of the Week
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Discover and connect with the most talented gaming content creators in our community. 
            These amazing creators are featured for their outstanding content and engagement.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{creators.length} Featured Creators</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={16} />
              <span>Updated Weekly</span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load creators: {error}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <CreatorSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Creators Grid */}
        {!loading && !error && creators.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator, index) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                featured={index === 0} // First creator is featured
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && creators.length === 0 && (
          <div className="text-center py-12">
            <Star className="mx-auto text-muted-foreground mb-4" size={64} />
            <h3 className="text-2xl font-semibold mb-2">No Creators Featured Yet</h3>
            <p className="text-muted-foreground mb-6">
              Check back soon! We're always featuring new and amazing creators.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Again
            </Button>
          </div>
        )}

        {/* CTA Section */}
        {creators.length > 0 && (
          <div className="text-center mt-16 p-8 bg-muted/50 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Want to be Featured?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Create amazing gaming content, engage with our community, and you could be our next 
              featured creator of the week!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" asChild>
                <a href="/how-it-works">Learn More</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/tournaments">Join Tournaments</a>
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}