export type BlogCategory = "review" | "analysis" | "news" | "top-list" | "opinion";
export type BlogStatus = "draft" | "pending" | "published" | "rejected";

export type BlogAuthor = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  image?: string;
  role?: string;
};

export type BlogMovieRef = {
  id: string;
  title: string;
  slug: string;
  releaseYear?: number;
  posterUrl?: string;
};

export type BlogComment = {
  id: string;
  user: BlogAuthor;
  text: string;
  createdAt: string;
};

export type BlogListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  category: BlogCategory;
  tags: string[];
  status: BlogStatus;
  isEditorsPick: boolean;
  views: number;
  likesCount: number;
  commentsCount: number;
  readTime: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author: BlogAuthor;
  relatedMovie?: BlogMovieRef | null;
};

export type BlogDetail = BlogListItem & {
  content: string;
  comments: BlogComment[];
  likedByViewer: boolean;
  canEdit: boolean;
  canModerate: boolean;
  moderationNote?: string;
};
