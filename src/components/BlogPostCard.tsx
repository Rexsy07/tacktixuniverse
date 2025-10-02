import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BlogPost } from '@/hooks/useBlog';
import { 
  Calendar,
  Eye,
  Heart,
  User,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogPostCardProps {
  post: BlogPost;
  featured?: boolean;
  compact?: boolean;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
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

export const BlogPostCard: React.FC<BlogPostCardProps> = ({ 
  post, 
  featured = false, 
  compact = false 
}) => {
  const CardWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <Card className={`group hover:shadow-xl transition-all duration-300 ${className || ''}`}>
      {children}
    </Card>
  );

  if (compact) {
    return (
      <CardWrapper className="h-full">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {post.featured_image_url && (
              <div className="w-20 h-20 flex-shrink-0">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {post.category && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}
                  >
                    {post.category.name}
                  </Badge>
                )}
                {featured && (
                  <Badge variant="default" className="text-xs">
                    Featured
                  </Badge>
                )}
              </div>
              
              <Link to={`/blog/${post.slug}`}>
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                  {post.title}
                </h3>
              </Link>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar size={10} />
                  {formatDate(post.published_at || post.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={10} />
                  {formatNumber(post.views)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper className={`h-full ${featured ? 'ring-2 ring-primary/20' : ''}`}>
      {/* Featured Image */}
      {post.featured_image_url && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          
          {/* Featured Badge */}
          {featured && (
            <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
        </div>
      )}
      
      <CardContent className="p-6">
        {/* Category and Meta */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {post.category && (
              <Badge 
                variant="secondary"
                style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}
              >
                {post.category.name}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={12} />
            {readingTime(post.content)} min read
          </div>
        </div>

        {/* Title */}
        <Link to={`/blog/${post.slug}`}>
          <h3 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-muted-foreground mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            {formatDate(post.published_at || post.created_at)}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye size={14} />
              {formatNumber(post.views)}
            </div>
            <div className="flex items-center gap-1">
              <Heart size={14} />
              {formatNumber(post.likes)}
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Read More Button */}
        <Link to={`/blog/${post.slug}`}>
          <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80 group/btn">
            Read More
            <ArrowRight size={16} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </CardWrapper>
  );
};