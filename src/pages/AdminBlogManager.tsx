import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAdminBlog } from '@/hooks/useBlog';
import { BlogPost, BlogCategory } from '@/hooks/useBlog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Star,
  FileText,
  Tag,
  Upload,
  Send,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  category_id: string;
  is_featured: boolean;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  meta_title: string;
  meta_description: string;
}

const initialPostData: PostFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featured_image_url: '',
  category_id: '',
  is_featured: false,
  status: 'draft',
  tags: [],
  meta_title: '',
  meta_description: ''
};

export default function AdminBlogManager() {
  const {
    posts,
    categories,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    publishPost,
    fetchAllPosts
  } = useAdminBlog();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postData, setPostData] = useState<PostFormData>(initialPostData);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePost = () => {
    setPostData(initialPostData);
    setTagInput('');
    setIsCreateDialogOpen(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featured_image_url: post.featured_image_url || '',
      category_id: post.category_id || '',
      is_featured: post.is_featured,
      status: post.status,
      tags: post.tags || [],
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || ''
    });
    setTagInput((post.tags || []).join(', '));
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!postData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const tags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const dataToSubmit = { ...postData, tags };

      if (editingPost) {
        await updatePost(editingPost.id, dataToSubmit);
        toast({
          title: 'Success',
          description: 'Post updated successfully'
        });
        setIsEditDialogOpen(false);
      } else {
        await createPost(dataToSubmit);
        toast({
          title: 'Success',
          description: 'Post created successfully'
        });
        setIsCreateDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save post',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (post: BlogPost) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;
    
    try {
      await deletePost(post.id);
      toast({
        title: 'Success',
        description: 'Post deleted successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive'
      });
    }
  };

  const handlePublishPost = async (post: BlogPost) => {
    try {
      await publishPost(post.id);
      toast({
        title: 'Success',
        description: 'Post published successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish post',
        variant: 'destructive'
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const PostDialog = ({ open, onOpenChange, title }: { open: boolean; onOpenChange: (open: boolean) => void; title: string }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {editingPost ? 'Edit your blog post details' : 'Create a new blog post'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title *</label>
              <Input
                value={postData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setPostData(prev => ({ 
                    ...prev, 
                    title,
                    slug: prev.slug === generateSlug(prev.title) || !prev.slug ? generateSlug(title) : prev.slug
                  }));
                }}
                placeholder="Enter post title"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Slug *</label>
              <Input
                value={postData.slug}
                onChange={(e) => setPostData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="url-friendly-slug"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Excerpt</label>
            <Textarea
              value={postData.excerpt}
              onChange={(e) => setPostData(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Brief description of the post"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Content *</label>
            <Textarea
              value={postData.content}
              onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your post content here (HTML supported)"
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Featured Image URL</label>
              <Input
                value={postData.featured_image_url}
                onChange={(e) => setPostData(prev => ({ ...prev, featured_image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={postData.category_id} onValueChange={(value) => setPostData(prev => ({ ...prev, category_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Tags (comma separated)</label>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="gaming, tournament, news"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={postData.status} onValueChange={(value: 'draft' | 'published' | 'archived') => setPostData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="featured"
                checked={postData.is_featured}
                onChange={(e) => setPostData(prev => ({ ...prev, is_featured: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="featured" className="text-sm font-medium">Featured Post</label>
            </div>
          </div>

          {/* SEO */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">SEO Settings</h4>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Meta Title</label>
                <Input
                  value={postData.meta_title}
                  onChange={(e) => setPostData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="SEO title (leave empty to use post title)"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Meta Description</label>
                <Textarea
                  value={postData.meta_description}
                  onChange={(e) => setPostData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="SEO description (leave empty to use excerpt)"
                  rows={2}
                />
              </div>
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
                {editingPost ? 'Update' : 'Create'} Post
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <DashboardLayout title="Blog Manager" description="Manage your blog posts and content">
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
    <DashboardLayout title="Blog Manager" description="Manage your blog posts and content">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-end items-center">
          <Button onClick={handleCreatePost}>
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
          
          <Button onClick={handleCreatePost}>
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="text-primary" size={20} />
                <div>
                  <p className="text-2xl font-bold">{posts.length}</p>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Send className="text-green-500" size={20} />
                <div>
                  <p className="text-2xl font-bold">{posts.filter(p => p.status === 'published').length}</p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Edit className="text-yellow-500" size={20} />
                <div>
                  <p className="text-2xl font-bold">{posts.filter(p => p.status === 'draft').length}</p>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="text-primary" size={20} />
                <div>
                  <p className="text-2xl font-bold">{posts.filter(p => p.is_featured).length}</p>
                  <p className="text-sm text-muted-foreground">Featured</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={fetchAllPosts}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map(post => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {post.is_featured && <Star className="text-primary" size={16} />}
                        <div>
                          <p className="font-medium">{post.title}</p>
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {post.category && (
                        <Badge style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}>
                          {post.category.name}
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={
                        post.status === 'published' ? 'default' :
                        post.status === 'draft' ? 'secondary' : 'outline'
                      }>
                        {post.status}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        {post.views}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar size={14} />
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPost(post)}
                        >
                          <Edit size={16} />
                        </Button>
                        
                        {post.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublishPost(post)}
                          >
                            <Send size={16} />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post)}
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
        <PostDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          title="Create New Post"
        />
        
        <PostDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="Edit Post"
        />
      </div>
    </DashboardLayout>
  );
}