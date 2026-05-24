import type { BlogDetail, BlogListItem } from "@/types/blog.types";

export const BLOG_CATEGORIES = [
  { value: "review", label: "Reviews" },
  { value: "analysis", label: "Analysis" },
  { value: "news", label: "News" },
  { value: "top-list", label: "Top Lists" },
  { value: "opinion", label: "Opinion" }
] as const;

export function estimateReadTimeFromHtml(html: string) {
  const text = stripHtml(html);
  if (!text) return 1;
  return Math.max(1, Math.ceil(text.split(" ").length / 200));
}

export function stripHtml(html: string) {
  return String(html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeHtml(html: string) {
  return String(html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+="[^"]*"/gi, "")
    .replace(/\son[a-z]+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export function buildExcerpt(content: string, provided?: string) {
  const clean = (provided?.trim() || stripHtml(content)).slice(0, 260);
  return clean.length >= 260 ? `${clean.slice(0, 257)}...` : clean;
}

export function normalizeTags(tags: string[] | string | undefined) {
  const list = Array.isArray(tags) ? tags : String(tags || "").split(",");
  return Array.from(new Set(list.map((tag) => tag.trim().toLowerCase()).filter(Boolean))).slice(0, 8);
}

export function categoryLabel(category: string) {
  return BLOG_CATEGORIES.find((item) => item.value === category)?.label || category;
}

export function serializeBlogListItem(blog: any): BlogListItem {
  const author = blog.author || {};
  const relatedMovie = blog.relatedMovie || null;

  return {
    id: String(blog._id),
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    coverImage: blog.coverImage || "",
    category: blog.category,
    tags: blog.tags || [],
    status: blog.status,
    isEditorsPick: Boolean(blog.isEditorsPick),
    views: Number(blog.views || 0),
    likesCount: Array.isArray(blog.likes) ? blog.likes.length : 0,
    commentsCount: Array.isArray(blog.comments) ? blog.comments.length : 0,
    readTime: Number(blog.readTime || estimateReadTimeFromHtml(blog.content || "")),
    publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : null,
    createdAt: new Date(blog.createdAt || Date.now()).toISOString(),
    updatedAt: new Date(blog.updatedAt || Date.now()).toISOString(),
    author: {
      id: String(author._id || author.id || ""),
      name: author.name || "CineVault Writer",
      email: author.email,
      avatar: author.avatar,
      image: author.image,
      role: author.role
    },
    relatedMovie: relatedMovie
      ? {
          id: String(relatedMovie._id || relatedMovie.id),
          title: relatedMovie.title,
          slug: relatedMovie.slug,
          releaseYear: relatedMovie.releaseYear,
          posterUrl: relatedMovie.posterUrl
        }
      : null
  };
}

export function serializeBlogDetail(blog: any, viewerId?: string | null): BlogDetail {
  const base = serializeBlogListItem(blog);
  const viewer = viewerId ? String(viewerId) : null;
  const viewerRole = blog.__viewerRole;
  const authorId = base.author.id;

  return {
    ...base,
    content: blog.content,
    comments: (blog.comments || []).map((comment: any) => {
      const user = comment.user || {};
      return {
        id: String(comment._id),
        text: comment.text,
        createdAt: new Date(comment.createdAt || Date.now()).toISOString(),
        user: {
          id: String(user._id || user.id || ""),
          name: user.name || "CineVault User",
          avatar: user.avatar,
          image: user.image,
          role: user.role
        }
      };
    }),
    likedByViewer: viewer ? (blog.likes || []).some((id: unknown) => String(id) === viewer) : false,
    canEdit: Boolean(viewer && (viewer === authorId || viewerRole === "admin")),
    canModerate: viewerRole === "admin" || viewerRole === "moderator",
    moderationNote: blog.moderationNote || ""
  };
}
