import type { APIRoute, GetStaticPaths } from "astro";
import { eraOf, metaFor } from "../../lib/chapter-meta";
import { chapters } from "../../lib/chapters";
import { renderChapterCard, renderHomeCard, type ChapterCard } from "../../lib/og-card";

type Props = { card: ChapterCard | "home" };

export const getStaticPaths = (() => [
  { params: { slug: "home" }, props: { card: "home" } satisfies Props },
  ...chapters
    .filter((chapter) => chapter.status === "live")
    .map((chapter) => {
      const meta = metaFor(chapter.slug);
      const year = meta?.year ?? chapter.year;
      const card: ChapterCard = { year, title: meta?.title ?? chapter.title, hook: chapter.hook, era: meta?.era ?? eraOf(year) };
      return { params: { slug: chapter.slug }, props: { card } satisfies Props };
    }),
]) satisfies GetStaticPaths;

export const GET: APIRoute<Props> = async ({ props }) => {
  const png = props.card === "home" ? await renderHomeCard() : await renderChapterCard(props.card);
  return new Response(png, { headers: { "Content-Type": "image/png" } });
};
