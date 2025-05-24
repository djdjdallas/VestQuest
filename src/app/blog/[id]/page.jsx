"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Clock, 
  User, 
  Eye,
  ChevronLeft,
  Share2,
  ArrowLeft
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

// Estimate reading time
const estimateReadingTime = (content) => {
  if (!content) return "5 min read";
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
};

export default function BlogPostPage() {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const params = useParams();
  const { id } = params;
  
  const supabase = createClient();

  // Fetch the blog post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching blog post with ID:", id);
        
        // Check if ID is numeric or needs conversion
        const postId = isNaN(id) ? id : parseInt(id, 10);
        console.log("Using post ID (after conversion if needed):", postId);

        // Try to fetch by ID first - removed bio and avatar_url fields from author query
        let { data, error } = await supabase
          .from("blog_posts")
          .select(`
            *,
            author:blog_authors!author_id(id, name, email),
            categories:blog_post_categories(
              category:blog_categories(id, name, slug)
            )
          `)
          .eq("id", postId)
          .eq("status", "published")
          .single();
          
        // If no result found by ID, try using the id as slug
        if (!data && (error || error?.code === 'PGRST116')) {
          console.log("No post found by ID, trying slug instead");
          const { data: slugData, error: slugError } = await supabase
            .from("blog_posts")
            .select(`
              *,
              author:blog_authors!author_id(id, name, email),
              categories:blog_post_categories(
                category:blog_categories(id, name, slug)
              )
            `)
            .eq("slug", id)
            .eq("status", "published")
            .single();
            
          if (slugData) {
            console.log("Found post by slug");
            data = slugData;
            error = slugError;
          }
        }

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }
        
        if (!data) {
          console.error("No data found for ID:", postId);
          throw new Error("Blog post not found");
        }
        
        console.log("Blog post data:", data);

        setPost(data);

        // Increment view count (optimistic update)
        const newViewCount = (data.views || 0) + 1;
        
        // Update view count in database
        await supabase
          .from("blog_posts")
          .update({ views: newViewCount })
          .eq("id", data.id);

        // Fetch related posts based on categories or tags
        if (data.tags && data.tags.length) {
          const { data: relatedData } = await supabase
            .from("blog_posts")
            .select(`
              id, title, slug, excerpt, featured_image, published_at, tags
            `)
            .neq("id", data.id)
            .eq("status", "published")
            .overlaps("tags", data.tags)
            .order("published_at", { ascending: false })
            .limit(3);

          setRelatedPosts(relatedData || []);
        }
      } catch (error) {
        console.error("Error fetching blog post:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        setError("Unable to load the blog post. Please try again later.");
        toast.error("Failed to load blog post");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, supabase]);

  // Handle share button click
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href
        });
      } else {
        // Fallback for browsers that don't support navigator.share
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-6" />
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-64 w-full mb-8 rounded-lg" />
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full mb-4" />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <Alert variant="destructive" className="mb-6 mx-auto max-w-lg">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <h1 className="text-2xl font-bold mb-4">We couldn't find that post</h1>
        <p className="text-muted-foreground mb-6">
          The blog post you're looking for might have been moved or doesn't exist.
        </p>
        <Button asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back to blog link */}
      <Link 
        href="/blog" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to all articles
      </Link>

      <article className="max-w-4xl mx-auto">
        {/* Article header */}
        <header className="mb-8">
          {post.categories?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map(({ category }) => (
                <Badge key={category.id} variant="secondary">
                  {category.name}
                </Badge>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {post.title}
          </h1>

          {/* Author and meta info */}
          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mr-3">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">{post.author?.name || "VestQuest Team"}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(post.published_at, "long")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {estimateReadingTime(post.content)}
              </span>
              <span className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {post.views || 1} views
              </span>
            </div>
          </div>

          {/* Featured image */}
          {post.featured_image && (
            <div className="relative h-[400px] rounded-lg overflow-hidden mb-8">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </header>

        {/* Article content */}
        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-lg prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:p-1 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded-lg">
          <ReactMarkdown
            components={{
              // Add custom rendering for specific elements
              h1: ({node, ...props}) => <h1 className="text-3xl mt-8 mb-4" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-2xl mt-8 mb-4" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl mt-6 mb-3" {...props} />,
              a: ({node, ...props}) => <a className="underline transition-colors" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 my-4" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-4" {...props} />,
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-4 border-primary/20 pl-4 italic my-4" {...props} />
              ),
              code: ({node, inline, ...props}) => 
                inline ? 
                  <code className="font-mono text-sm" {...props} /> : 
                  <code className="block font-mono text-sm p-4 my-4 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-auto" {...props} />
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="mt-12">
            <h3 className="text-sm font-medium mb-3">Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Share button */}
        <div className="mt-8 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Author info section */}
        {post.author && (
          <div className="mt-12 p-6 bg-muted rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">About {post.author.name}</h3>
                <p className="text-muted-foreground">
                  Author at VestQuest
                </p>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-4xl mx-auto mt-16">
          <Separator className="mb-12" />
          <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Link key={relatedPost.id} href={`/blog/${relatedPost.id}`} prefetch={false}>
                <Card className="h-full hover:shadow-md transition-shadow group">
                  {relatedPost.featured_image && (
                    <div className="relative h-40 overflow-hidden rounded-t-lg">
                      <Image
                        src={relatedPost.featured_image}
                        alt={relatedPost.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <CardContent className="pt-6">
                    <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      {formatDate(relatedPost.published_at)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}