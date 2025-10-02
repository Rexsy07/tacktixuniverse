import React, { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { BlogPostCard } from '@/components/BlogPostCard';
import { useBlogPosts, useBlogCategories } from '@/hooks/useBlog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  BookOpen, 
  Search, 
  Filter,
  TrendingUp,
  Calendar
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PostSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-48 w-full rounded-lg" />
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-16 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  </div>
);

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  
  // Fetch data
  const { posts, loading: postsLoading, error: postsError, refetch: refetchPosts } = useBlogPosts();
  const { categories, loading: categoriesLoading, error: categoriesError } = useBlogCategories();
  const { posts: featuredPosts, loading: featuredLoading } = useBlogPosts({ featured: true, limit: 3 });

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category?.slug === selectedCategory);
    }

    // Sort posts
    return filtered.sort((a, b) => {
      if (sortBy === 'popular') {
        return b.views - a.views;
      }
      return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
    });
  }, [posts, searchQuery, selectedCategory, sortBy]);

  const loading = postsLoading || categoriesLoading;
  const error = postsError || categoriesError;

  return (
    <div className="min-h-screen bg-background page-with-header">
      <Header />
      
      <main className="container mx-auto px-4 page-content">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="text-primary" size={32} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              TackTix Blog
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Stay updated with the latest gaming news, tournament highlights, platform updates, 
            and tips from the TackTix community.
          </p>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BookOpen size={16} />
              <span>{posts.length} Articles</span>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <span>{categories.length} Categories</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} />
              <span>Updated Daily</span>
            </div>
          </div>
        </div>

        {/* Featured Posts Section */}
        {!featuredLoading && featuredPosts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="text-primary" size={20} />
              <h2 className="text-2xl font-bold">Featured Posts</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map(post => (
                <BlogPostCard key={post.id} post={post} featured />
              ))}
            </div>
          </section>
        )}

        {/* Filters Section */}
        <div className="bg-muted/30 p-6 rounded-lg mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Search articles, topics, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: 'latest' | 'popular') => setSortBy(value)}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Active Filters */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchQuery && (
                <Badge variant="secondary" className="gap-2">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="gap-2">
                  Category: {categories.find(c => c.slug === selectedCategory)?.name}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load blog posts: {error}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetchPosts()}
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
              <PostSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && !error && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {searchQuery || selectedCategory !== 'all' 
                  ? `Search Results (${filteredAndSortedPosts.length})` 
                  : 'Latest Articles'
                }
              </h2>
              
              {filteredAndSortedPosts.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={14} />
                  <span>Sorted by {sortBy === 'latest' ? 'Latest' : 'Most Popular'}</span>
                </div>
              )}
            </div>

            {filteredAndSortedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedPosts.map(post => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto text-muted-foreground mb-4" size={64} />
                <h3 className="text-2xl font-semibold mb-2">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'No posts found' 
                    : 'No posts yet'
                  }
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Try adjusting your search terms or filters.'
                    : 'Check back soon for new content!'
                  }
                </p>
                <Button onClick={() => refetchPosts()} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}