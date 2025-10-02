import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAdminCreators } from '@/hooks/useCreators';
import { Creator } from '@/hooks/useCreators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  Star,
  Eye,
  Video,
  Save,
  RefreshCw,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Twitch,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CreatorFormData {
  name: string;
  title: string;
  bio: string;
  profile_image_url: string;
  cover_image_url: string;
  social_links: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
    facebook?: string;
    twitch?: string;
    discord?: string;
  };
  stats: {
    followers?: number;
    total_views?: number;
    videos_created?: number;
  };
  featured_from: string;
  featured_until: string;
  is_active: boolean;
  sort_order: number;
}

const initialCreatorData: CreatorFormData = {
  name: '',
  title: '',
  bio: '',
  profile_image_url: '',
  cover_image_url: '',
  social_links: {},
  stats: {},
  featured_from: new Date().toISOString().split('T')[0],
  featured_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  is_active: true,
  sort_order: 0
};

const SocialIcon = ({ platform }: { platform: string }) => {
  const iconProps = { size: 16, className: "text-current" };
  
  switch (platform.toLowerCase()) {
    case 'instagram': return <Instagram {...iconProps} />;
    case 'youtube': return <Youtube {...iconProps} />;
    case 'twitter': return <Twitter {...iconProps} />;
    case 'facebook': return <Facebook {...iconProps} />;
    case 'twitch': return <Twitch {...iconProps} />;
    default: return <ExternalLink {...iconProps} />;
  }
};

export default function AdminCreatorsManager() {
  const {
    creators,
    loading,
    error,
    createCreator,
    updateCreator,
    deleteCreator,
    toggleCreatorStatus,
    fetchAllCreators
  } = useAdminCreators();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  const [creatorData, setCreatorData] = useState<CreatorFormData>(initialCreatorData);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCreators = creators.filter(creator =>
    creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCreator = () => {
    setCreatorData({
      ...initialCreatorData,
      sort_order: Math.max(...creators.map(c => c.sort_order), 0) + 1
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditCreator = (creator: Creator) => {
    setEditingCreator(creator);
    setCreatorData({
      name: creator.name,
      title: creator.title || '',
      bio: creator.bio,
      profile_image_url: creator.profile_image_url,
      cover_image_url: creator.cover_image_url || '',
      social_links: creator.social_links || {},
      stats: creator.stats || {},
      featured_from: creator.featured_from.split('T')[0],
      featured_until: creator.featured_until.split('T')[0],
      is_active: creator.is_active,
      sort_order: creator.sort_order
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!creatorData.name.trim() || !creatorData.bio.trim() || !creatorData.profile_image_url.trim()) {
      toast({
        title: 'Error',
        description: 'Name, bio, and profile image are required',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingCreator) {
        await updateCreator(editingCreator.id, creatorData);
        toast({
          title: 'Success',
          description: 'Creator updated successfully'
        });
        setIsEditDialogOpen(false);
      } else {
        await createCreator(creatorData);
        toast({
          title: 'Success',
          description: 'Creator created successfully'
        });
        setIsCreateDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save creator',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCreator = async (creator: Creator) => {
    if (!confirm(`Are you sure you want to delete "${creator.name}"?`)) return;
    
    try {
      await deleteCreator(creator.id);
      toast({
        title: 'Success',
        description: 'Creator deleted successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete creator',
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = async (creator: Creator) => {
    try {
      await toggleCreatorStatus(creator.id, !creator.is_active);
      toast({
        title: 'Success',
        description: `Creator ${!creator.is_active ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update creator status',
        variant: 'destructive'
      });
    }
  };

  const updateSocialLink = (platform: string, url: string) => {
    setCreatorData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: url || undefined
      }
    }));
  };

  const updateStat = (stat: string, value: number) => {
    setCreatorData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: value || undefined
      }
    }));
  };

  const CreatorDialog = ({ open, onOpenChange, title }: { open: boolean; onOpenChange: (open: boolean) => void; title: string }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {editingCreator ? 'Edit creator details and featured period' : 'Create a new featured creator'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Basic Info */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name *</label>
                <Input
                  value={creatorData.name}
                  onChange={(e) => setCreatorData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Creator's full name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={creatorData.title}
                  onChange={(e) => setCreatorData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Gaming Content Creator"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bio *</label>
              <Textarea
                value={creatorData.bio}
                onChange={(e) => setCreatorData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Brief description about the creator"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Profile Image URL *</label>
                <Input
                  value={creatorData.profile_image_url}
                  onChange={(e) => setCreatorData(prev => ({ ...prev, profile_image_url: e.target.value }))}
                  placeholder="https://example.com/profile.jpg"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Cover Image URL</label>
                <Input
                  value={creatorData.cover_image_url}
                  onChange={(e) => setCreatorData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                  placeholder="https://example.com/cover.jpg"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Social Media Links</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries({
                instagram: 'Instagram',
                youtube: 'YouTube',
                twitter: 'Twitter',
                facebook: 'Facebook',
                twitch: 'Twitch',
                tiktok: 'TikTok',
                discord: 'Discord'
              }).map(([platform, label]) => (
                <div key={platform}>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <SocialIcon platform={platform} />
                    {label}
                  </label>
                  <Input
                    value={creatorData.social_links[platform as keyof typeof creatorData.social_links] || ''}
                    onChange={(e) => updateSocialLink(platform, e.target.value)}
                    placeholder={`https://${platform}.com/username`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Followers</label>
                <Input
                  type="number"
                  value={creatorData.stats.followers || ''}
                  onChange={(e) => updateStat('followers', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Total Views</label>
                <Input
                  type="number"
                  value={creatorData.stats.total_views || ''}
                  onChange={(e) => updateStat('total_views', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Videos Created</label>
                <Input
                  type="number"
                  value={creatorData.stats.videos_created || ''}
                  onChange={(e) => updateStat('videos_created', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Featured Period */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Featured Period</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Featured From</label>
                <Input
                  type="date"
                  value={creatorData.featured_from}
                  onChange={(e) => setCreatorData(prev => ({ ...prev, featured_from: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Featured Until</label>
                <Input
                  type="date"
                  value={creatorData.featured_until}
                  onChange={(e) => setCreatorData(prev => ({ ...prev, featured_until: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Sort Order</label>
                <Input
                  type="number"
                  value={creatorData.sort_order}
                  onChange={(e) => setCreatorData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-4">
              <Switch
                checked={creatorData.is_active}
                onCheckedChange={(checked) => setCreatorData(prev => ({ ...prev, is_active: checked }))}
              />
              <label className="text-sm font-medium">Active (visible to public)</label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {editingCreator ? 'Update' : 'Create'} Creator
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <DashboardLayout title="Creators Manager" description="Manage featured creators of the week">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Creators Manager" description="Manage featured creators of the week">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-end items-center">
          <Button onClick={handleCreateCreator}>
            <Plus className="mr-2 h-4 w-4" />
            Add Creator
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="text-primary" size={20} />
                <div>
                  <p className="text-2xl font-bold">{creators.length}</p>
                  <p className="text-sm text-muted-foreground">Total Creators</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="text-green-500" size={20} />
                <div>
                  <p className="text-2xl font-bold">{creators.filter(c => c.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-primary" size={20} />
                <div>
                  <p className="text-2xl font-bold">
                    {creators.filter(c => 
                      c.is_active && 
                      new Date(c.featured_from) <= new Date() && 
                      new Date(c.featured_until) >= new Date()
                    ).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Currently Featured</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button variant="outline" onClick={fetchAllCreators}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Creators Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured Period</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCreators.map(creator => (
                  <TableRow key={creator.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={creator.profile_image_url}
                          alt={creator.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">{creator.name}</p>
                          {creator.title && (
                            <p className="text-sm text-muted-foreground">{creator.title}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={creator.is_active}
                          onCheckedChange={() => handleToggleStatus(creator)}
                          size="sm"
                        />
                        <Badge variant={creator.is_active ? 'default' : 'secondary'}>
                          {creator.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(creator.featured_from).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          to {new Date(creator.featured_until).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-3 text-sm">
                        {creator.stats.followers && (
                          <div className="flex items-center gap-1">
                            <Users size={12} />
                            {creator.stats.followers.toLocaleString()}
                          </div>
                        )}
                        {creator.stats.total_views && (
                          <div className="flex items-center gap-1">
                            <Eye size={12} />
                            {creator.stats.total_views.toLocaleString()}
                          </div>
                        )}
                        {creator.stats.videos_created && (
                          <div className="flex items-center gap-1">
                            <Video size={12} />
                            {creator.stats.videos_created}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">{creator.sort_order}</Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCreator(creator)}
                        >
                          <Edit size={16} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCreator(creator)}
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CreatorDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          title="Add New Creator"
        />
        
        <CreatorDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="Edit Creator"
        />
      </div>
    </DashboardLayout>
  );
}