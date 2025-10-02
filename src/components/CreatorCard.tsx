import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Creator } from '@/hooks/useCreators';
import { 
  Instagram, 
  Youtube, 
  Twitter, 
  Facebook, 
  Twitch,
  ExternalLink,
  Users,
  Eye,
  Video
} from 'lucide-react';

interface CreatorCardProps {
  creator: Creator;
  featured?: boolean;
}

const SocialIcon = ({ platform }: { platform: string }) => {
  const iconProps = { size: 18, className: "text-current" };
  
  switch (platform.toLowerCase()) {
    case 'instagram': return <Instagram {...iconProps} />;
    case 'youtube': return <Youtube {...iconProps} />;
    case 'twitter': return <Twitter {...iconProps} />;
    case 'facebook': return <Facebook {...iconProps} />;
    case 'twitch': return <Twitch {...iconProps} />;
    default: return <ExternalLink {...iconProps} />;
  }
};

const formatNumber = (num: number | undefined): string => {
  if (!num) return '0';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator, featured = false }) => {
  const socialLinks = creator.social_links || {};
  const stats = creator.stats || {};
  
  return (
    <Card className={`group hover:shadow-xl transition-all duration-300 ${featured ? 'ring-2 ring-primary/20' : ''}`}>
      {/* Cover Image */}
      {creator.cover_image_url && (
        <div className="relative h-32 overflow-hidden rounded-t-lg">
          <img
            src={creator.cover_image_url}
            alt={`${creator.name} cover`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}
      
      <CardContent className="p-6">
        {/* Profile Section */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <img
              src={creator.profile_image_url}
              alt={creator.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-background"
            />
            {featured && (
              <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-1 text-xs">
                Featured
              </Badge>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground mb-1">{creator.name}</h3>
            {creator.title && (
              <p className="text-sm text-muted-foreground mb-2">{creator.title}</p>
            )}
            
            {/* Stats */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              {stats.followers && (
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  {formatNumber(stats.followers)}
                </div>
              )}
              {stats.total_views && (
                <div className="flex items-center gap-1">
                  <Eye size={12} />
                  {formatNumber(stats.total_views)}
                </div>
              )}
              {stats.videos_created && (
                <div className="flex items-center gap-1">
                  <Video size={12} />
                  {stats.videos_created}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {creator.bio}
        </p>

        {/* Social Links */}
        {Object.keys(socialLinks).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(socialLinks).map(([platform, url]) => (
              url && (
                <Button
                  key={platform}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-primary"
                  onClick={() => window.open(url, '_blank')}
                >
                  <SocialIcon platform={platform} />
                </Button>
              )
            ))}
          </div>
        )}

        {/* Featured Period */}
        <div className="text-xs text-muted-foreground">
          Featured until {new Date(creator.featured_until).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};