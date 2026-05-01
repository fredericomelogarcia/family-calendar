import fs from "fs";
import path from "path";
import Link from "next/link";

// We'll read the posts directory and get the list of mdx files.
export default async function BlogIndexPage() {
  const postsDirectory = path.join(process.cwd(), "src", "app", "blog", "posts");
  const fileNames = fs.readdirSync(postsDirectory);

  // We'll create an array of posts with their metadata (for now, just the title and date from the filename or frontmatter).
  // For simplicity, we'll assume the filename is the slug and we can get the title from the frontmatter.
  // However, to avoid reading each file twice, we can read the frontmatter here.
  // But note: we are in a server component, so we can read the filesystem.

  const posts = fileNames
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const filePath = path.join(postsDirectory, fileName);
      const fileContent = fs.readFileSync(filePath, "utf8");

      const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n/);
      let title = slug.replace(/-/g, " ");
      let date = new Date().toISOString().split("T")[0];
      let excerpt = "";
      let keywords = "";

      if (frontmatterMatch) {
        const fm = frontmatterMatch[1];
        const titleMatch = fm.match(/title:\s*"?([^\n"]+)"?/);
        const dateMatch = fm.match(/date:\s*"?([^\n"]+)"?/);
        const excerptMatch = fm.match(/excerpt:\s*"?([^\n"]+)"?/);
        const keywordsMatch = fm.match(/keywords:\s*\[?([^\]\n]+)\]?/);
        if (titleMatch) title = titleMatch[1];
        if (dateMatch) date = dateMatch[1];
        if (excerptMatch) excerpt = excerptMatch[1];
        if (keywordsMatch) keywords = keywordsMatch[1];
      }

      // Calculate reading time (average 200 words per minute)
      const contentWithoutFrontmatter = fileContent.replace(/^---\n[\s\S]*?\n---\n/, "");
      const wordCount = contentWithoutFrontmatter.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200) + " min read";

      return {
        slug,
        title,
        date,
        excerpt,
        keywords,
        readingTime,
      };
    })
    // Sort by date descending (newest first)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <section className="px-6 py-16 md:py-20 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="mb-4 text-4xl font-bold">Blog</h1>
        <p className="mb-8 text-text-secondary max-w-2xl mx-auto">
          Read our latest posts on using Zawly, family calendar management, and household expense tracking.
        </p>
      </div>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-3xl bg-surface border border-border p-10 hover:border-primary/30 hover:shadow-2xl transition-all duration-300 min-h-[320px]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-text-primary group-hover:text-primary transition-colors leading-tight">
                  {post.title}
                </h2>
              </div>
              <p className="text-text-secondary text-lg flex-grow mb-8 leading-relaxed">
                {post.excerpt || post.slug.replace(/-/g, " ")}
              </p>
                  <div className="flex items-center justify-between pt-6 border-t border-border">
                    <div className="flex items-center gap-3 text-base text-text-tertiary">
                      <time>
                        {new Date(post.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                      <span>•</span>
                      <span>{post.readingTime}</span>
                    </div>
                    <span className="text-base font-semibold text-primary">
                      Read more →
                    </span>
                  </div>
            </Link>
          ))}
      </div>
      {posts.length === 0 && (
        <p className="text-text-secondary text-center">No posts yet. Check back soon!</p>
      )}
    </section>
  );
}