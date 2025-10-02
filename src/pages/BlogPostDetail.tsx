import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { BlogPostCard } from '@/components/BlogPostCard';
import { useBlogPost, useBlogPosts } from '@/hooks/useBlog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Calendar,
  Eye,
  Heart,
  Clock,
  Share2,
  User
} from 'lucide-react';

const ContentSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
    <Skeleton className="h-64 w-full rounded-lg" />
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-4/5'}`} />
      ))}
    </div>
  </div>
);

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const readingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading, error } = useBlogPost(slug || '');
  const { posts: relatedPosts } = useBlogPosts({ 
    category: post?.category?.slug, 
    limit: 3 
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background page-with-header">
        <Header />
        <main className="container mx-auto px-4 page-content">
          <ContentSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background page-with-header">
        <Header />
        <main className="container mx-auto px-4 page-content">
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>
              {error || 'Blog post not found'}
            </AlertDescription>
          </Alert>
          
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Post Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Filter out current post from related posts
  const filteredRelatedPosts = relatedPosts.filter(p => p.id !== post.id).slice(0, 2);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url: window.location.href
        });
      } catch (err) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-background page-with-header">
      <Header />
      
      <main className="container mx-auto px-4 page-content">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="p-0 h-auto mb-4 text-muted-foreground hover:text-primary">
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>

        <article className="max-w-4xl mx-auto">
          {/* Article Header */}
          <header className="mb-8">
            {/* Category Badge */}
            {post.category && (
              <Badge 
                className="mb-4"
                style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}
              >
                {post.category.name}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <time dateTime={post.published_at || post.created_at}>
                  {formatDate(post.published_at || post.created_at)}
                </time>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{readingTime(post.content)} min read</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Eye size={16} />
                <span>{formatNumber(post.views)} views</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Heart size={16} />
                <span>{formatNumber(post.likes)} likes</span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleShare}
                className="text-muted-foreground hover:text-primary p-0 h-auto"
              >
                <Share2 size={16} className="mr-1" />
                Share
              </Button>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="mb-8">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div 
              dangerouslySetInnerHTML={{ __html: post.content }}
              className="leading-relaxed text-foreground"
            />
          </div>

          {/* Article Footer */}
          <footer className="border-t pt-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye size={16} />
                  <span>{formatNumber(post.views)} views</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart size={16} />
                  <span>{formatNumber(post.likes)} likes</span>
                </div>
              </div>
              
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share Article
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-center mb-8">
              <Button asChild>
                <Link to="/blog">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to All Posts
                </Link>
              </Button>
            </div>
          </footer>
        </article>

        {/* Related Posts */}
        {filteredRelatedPosts.length > 0 && (
          <section className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRelatedPosts.map(relatedPost => (
                <BlogPostCard 
                  key={relatedPost.id} 
                  post={relatedPost} 
                  compact 
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}