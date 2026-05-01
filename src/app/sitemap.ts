import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://zawly.app";

  // Read blog posts from filesystem
  const postsDirectory = path.join(process.cwd(), "src", "app", "blog", "posts");
  const fileNames = fs.readdirSync(postsDirectory).filter((f) => f.endsWith(".mdx"));

  const blogPosts = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, "");
    const filePath = path.join(postsDirectory, fileName);
    const fileContent = fs.readFileSync(filePath, "utf8");

    const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n/);
    let date = new Date().toISOString();
    let keywords: string[] = [];

    if (frontmatterMatch) {
      const fm = frontmatterMatch[1];
      const dateMatch = fm.match(/date:\s*"?([^\n"]+)"?/);
      const keywordsMatch = fm.match(/keywords:\s*\[([^\]]+)\]/);
      if (dateMatch) date = dateMatch[1];
      if (keywordsMatch) {
        keywords = keywordsMatch[1].split(",").map((k: string) => k.trim().replace(/"/g, ""));
      }
    }

    return {
      url: `${baseUrl}/blog/${slug}`,
      lastModified: new Date(date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      keywords: keywords.length > 0 ? keywords : undefined,
    };
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPosts,
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-04-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2026-04-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}