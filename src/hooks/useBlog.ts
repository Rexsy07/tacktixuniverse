import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  category_id?: string;
  category?: BlogCategory;
  author_id: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  views: number;
  likes: number;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export function useBlogPosts(filters?: {
  category?: string;
  featured?: boolean;
  limit?: number;
}) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category.slug', filters.category);
      }

      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setPosts((data as BlogPost[]) || []);
    } catch (err: any) {
      console.error('Error fetching blog posts:', err);
      setError(err.message || 'Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    refetch: fetchPosts
  };
}

export function useBlogPost(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPost = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      if (error) throw error;
      
      setPost(data as BlogPost);

      // Track view
      if (data) {
        await supabase.rpc('increment_blog_post_views', {
          post_slug: slug,
          viewer_id: user?.id || null
        });
      }
    } catch (err: any) {
      console.error('Error fetching blog post:', err);
      setError(err.message || 'Failed to fetch blog post');
    } finally {
      setLoading(false);
    }
  }, [slug, user?.id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return {
    post,
    loading,
    error,
    refetch: fetchPost
  };
}

export function useBlogCategories() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      setCategories((data as BlogCategory[]) || []);
    } catch (err: any) {
      console.error('Error fetching blog categories:', err);
      setError(err.message || 'Failed to fetch blog categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  };
}

export function useAdminBlog() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setPosts((data as BlogPost[]) || []);
    } catch (err: any) {
      console.error('Error fetching blog posts:', err);
      setError(err.message || 'Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setCategories((data as BlogCategory[]) || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const createPost = useCallback(async (postData: Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{ ...postData, author_id: user.id }])
      .select('*, category:blog_categories(*)')
      .single();

    if (error) throw error;

    setPosts(prev => [data as BlogPost, ...prev]);
    return data as BlogPost;
  }, [user?.id]);

  const updatePost = useCallback(async (id: string, updates: Partial<BlogPost>) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select('*, category:blog_categories(*)')
      .single();

    if (error) throw error;

    setPosts(prev => prev.map(p => p.id === id ? (data as BlogPost) : p));
    return data as BlogPost;
  }, []);

  const deletePost = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  const publishPost = useCallback(async (id: string) => {
    return updatePost(id, { 
      status: 'published', 
      published_at: new Date().toISOString() 
    });
  }, [updatePost]);

  useEffect(() => {
    fetchAllPosts();
    fetchCategories();
  }, [fetchAllPosts, fetchCategories]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-blog-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blog_posts'
      }, fetchAllPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllPosts]);

  return {
    posts,
    categories,
    loading,
    error,
    fetchAllPosts,
    createPost,
    updatePost,
    deletePost,
    publishPost
  };
}