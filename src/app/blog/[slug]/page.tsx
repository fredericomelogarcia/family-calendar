import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import { MDXRemote } from "next-mdx-remote/rsc";

async function getPostBySlug(slug: string) {
  try {
    const filePath = path.join(process.cwd(), "src", "app", "blog", "posts", `${slug}.mdx`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    return { fileContent, slug };
  } catch (error) {
    return null;
  }
}

function parseFrontmatter(mdxContent: string) {
  const frontmatterMatch = mdxContent.match(/^---\n([\s\S]*?)\n---\n/);
  let title = "";
  let date = new Date().toISOString().split("T")[0];
  let excerpt = "";
  let keywords: string[] = [];
  let author = "Zawly";

  if (frontmatterMatch) {
    const fm = frontmatterMatch[1];
    const titleMatch = fm.match(/title:\s*"?([^\n"]+)"?/);
    const dateMatch = fm.match(/date:\s*"?([^\n"]+)"?/);
    const excerptMatch = fm.match(/excerpt:\s*"?([^\n"]+)"?/);
    const keywordsMatch = fm.match(/keywords:\s*\[([^\]]+)\]/);
    const authorMatch = fm.match(/author:\s*"?([^\n"]+)"?/);
    if (titleMatch) title = titleMatch[1];
    if (dateMatch) date = dateMatch[1];
    if (excerptMatch) excerpt = excerptMatch[1];
    if (keywordsMatch) keywords = keywordsMatch[1].split(",").map((k: string) => k.trim().replace(/"/g, ""));
    if (authorMatch) author = authorMatch[1];
  }

  // Calculate reading time
  const contentWithoutFrontmatter = mdxContent.replace(/^---\n[\s\S]*?\n---\n/, "");
  const wordCount = contentWithoutFrontmatter.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200) + " min read";

  return { title, date, excerpt, keywords, author, readingTime };
}

export const metadata = {
  title: "Blog — Zawly",
  description: "Read our blog for tips on family calendar management, household budgeting, and productivity.",
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { title, date, excerpt, readingTime, author } = parseFrontmatter(post.fileContent);
  const mdxSource = post.fileContent.replace(/^---\n[\s\S]*?\n---\n/, "");

  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-text-tertiary hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to blog
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              Blog
            </span>
            <time className="text-sm text-text-tertiary">{formattedDate}</time>
            <span className="text-sm text-text-tertiary">•</span>
            <span className="text-sm text-text-tertiary">{readingTime}</span>
            {author && (
              <>
                <span className="text-sm text-text-tertiary">•</span>
                <span className="text-sm text-text-tertiary">{author}</span>
              </>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary font-[family-name:var(--font-heading)] leading-[1.1]">
            {title || slug.replace(/-/g, " ")}
          </h1>

          {excerpt && (
            <p className="mt-6 text-xl text-text-secondary leading-relaxed">
              {excerpt}
            </p>
          )}
        </header>

        {/* Divider */}
        <div className="h-px bg-border mb-12" />

        {/* Content */}
        <div className="prose prose-lg max-w-none
          prose-headings:font-[family-name:var(--font-heading)] prose-headings:text-text-primary
          prose-p:text-text-secondary prose-p:leading-relaxed
          prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
          prose-strong:text-text-primary
          prose-ul:list-disc prose-ul:text-text-secondary
          prose-ol:list-decimal prose-ol:text-text-secondary
          prose-li:text-text-secondary prose-li:leading-relaxed
          prose-blockquote:border-primary prose-blockquote:text-text-secondary
          prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-medium
          prose-pre:bg-surface-alt prose-pre:border prose-pre:border-border prose-pre:rounded-xl
          prose-img:rounded-xl prose-img:border prose-img:border-border
        ">
          <MDXRemote source={mdxSource} />
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to all posts
          </Link>
        </div>
      </div>
    </article>
  );
}
