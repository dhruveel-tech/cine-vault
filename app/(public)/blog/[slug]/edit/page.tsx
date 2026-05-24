import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { serializeBlogDetail } from "@/lib/blog-utils";
import Blog from "@/models/Blog";
import BlogEditor from "@/components/blog/BlogEditor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EditBlogPageProps = { params: Promise<{ slug: string }> };

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { slug } = await params;
  await dbConnect();
  const raw: any = await Blog.findOne({ slug })
    .populate("author", "name email avatar image role")
    .populate("relatedMovie", "title slug releaseYear posterUrl")
    .populate("comments.user", "name avatar image role")
    .lean();

  if (!raw) notFound();

  const canEdit = String(raw.author?._id) === session.user.id || session.user.role === "admin";
  if (!canEdit) redirect(`/blog/${slug}`);

  raw.__viewerRole = session.user.role;
  const blog = serializeBlogDetail(raw, session.user.id);

  return (
    <div className="shell-container py-10 md:py-14">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">Edit article</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">{blog.title}</h1>
      </div>
      <BlogEditor mode="edit" initialBlog={blog} />
    </div>
  );
}
