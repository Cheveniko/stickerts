import { SITE_URL } from "$lib/seo";

const robots = [
  "User-agent: *",
  "Allow: /",
  `Sitemap: ${SITE_URL}/sitemap.xml`,
].join("\n");

export function GET() {
  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
