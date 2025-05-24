"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Calendar,
  Clock,
  User,
  Eye,
  ChevronRight,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

// Constants
const POSTS_PER_PAGE = 9;
const FEATURED_POSTS_COUNT = 3;
const DEBOUNCE_DELAY = 300;

// Custom hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const supabase = createClient();
  const debouncedSearchQuery = useDebounce(searchQuery, DEBOUNCE_DELAY);

  // Fetch posts with better error handling and retry logic
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("blog_posts")
        .select(
          `
          *,
          author:blog_authors!author_id(id, name, email),
          categories:blog_post_categories(
            category:blog_categories(id, name, slug)
          )
        `
        )
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.contains("tags", [selectedCategory]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Unable to load blog posts. Please try again later.");
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, supabase]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Don't show error for categories as it's not critical
    }
  }, [supabase]);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [fetchPosts, fetchCategories]);

  // Memoized filtered posts
  const filteredPosts = useMemo(() => {
    if (!debouncedSearchQuery) return posts;

    const query = debouncedSearchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.content?.toLowerCase().includes(query) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [posts, debouncedSearchQuery]);

  // Memoized pagination calculations
  const { currentPosts, totalPages } = useMemo(() => {
    const indexOfLastPost = currentPage * POSTS_PER_PAGE;
    const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
    const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

    return { currentPosts, totalPages };
  }, [filteredPosts, currentPage]);

  // Memoized featured posts
  const featuredPosts = useMemo(
    () => posts.slice(0, FEATURED_POSTS_COUNT),
    [posts]
  );

  // Estimate reading time with memoization
  const estimateReadingTime = useCallback((content) => {
    if (!content) return "5 min read";
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  }, []);

  // Reset page when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedCategory]);

  // Newsletter subscription handler
  const handleNewsletterSubscribe = async () => {
    if (!emailInput) {
      toast.error("Please enter your email address");
      return;
    }

    setSubscribing(true);
    try {
      // Simulate API call - replace with actual newsletter integration
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Successfully subscribed to newsletter!");
      setEmailInput("");
    } catch (error) {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pageNumbers.map((number) => (
          <Button
            key={number}
            variant={currentPage === number ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(number)}
          >
            {number}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  // Post card component for reusability
  const PostCard = ({ post, isFeatured = false }) => (
    <Link href={`/blog/${post.slug}`} prefetch={false}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        {post.featured_image && (
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
            />
            {isFeatured && (
              <Badge className="absolute top-2 left-2 bg-primary">
                Featured
              </Badge>
            )}
          </div>
        )}
        <CardHeader>
          {!isFeatured && post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {post.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {post.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{post.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-3">
            {post.excerpt || post.content?.substring(0, 150) + "..."}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {isFeatured ? (
              <div className="flex items-center gap-4">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(post.published_at)}
                </span>
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {estimateReadingTime(post.content)}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <span className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {post.author?.name || "VestQuest Team"}
                  </span>
                  <span className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {post.views || 0}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(post.published_at)}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {estimateReadingTime(post.content)}
                  </span>
                </div>
              </>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardFooter>
      </Card>
    </Link>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">VestQuest Blog</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Expert insights on equity compensation, tax strategies, and financial
          planning for startup employees
        </p>
      </header>

      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search articles..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search blog posts"
        />
      </div>

      {/* Categories */}
      <nav
        className="flex flex-wrap justify-center gap-2 mb-8"
        aria-label="Blog categories"
      >
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
          aria-pressed={selectedCategory === "all"}
        >
          All Posts
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.slug ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.slug)}
            aria-pressed={selectedCategory === category.slug}
          >
            {category.name}
          </Button>
        ))}
      </nav>

      <Separator className="mb-8" />

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Featured Posts Section */}
      {selectedCategory === "all" &&
        currentPage === 1 &&
        featuredPosts.length > 0 &&
        !debouncedSearchQuery && (
          <section className="mb-12" aria-labelledby="featured-heading">
            <h2 id="featured-heading" className="text-2xl font-bold mb-6">
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredPosts.map((post, index) => (
                <PostCard key={post.id} post={post} isFeatured={index === 0} />
              ))}
            </div>
            <Separator className="mt-12 mb-8" />
          </section>
        )}

      {/* Main Posts Grid */}
      <main aria-label="Blog posts">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-full">
                <Skeleton className="h-48 rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : currentPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {debouncedSearchQuery
                ? `No articles found matching "${debouncedSearchQuery}"`
                : "No articles found in this category."}
            </p>
            {debouncedSearchQuery && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            <PaginationControls />
          </>
        )}
      </main>

      {/* Newsletter CTA */}
      <section
        className="mt-16 bg-primary/5 rounded-lg p-8 text-center"
        aria-labelledby="newsletter-heading"
      >
        <h3 id="newsletter-heading" className="text-2xl font-bold mb-4">
          Stay Updated
        </h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Get the latest insights on equity compensation and financial planning
          delivered to your inbox.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            className="flex-1"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            aria-label="Email address for newsletter"
          />
          <Button onClick={handleNewsletterSubscribe} disabled={subscribing}>
            {subscribing ? "Subscribing..." : "Subscribe"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
