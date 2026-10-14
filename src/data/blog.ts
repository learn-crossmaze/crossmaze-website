// Blog posts (content/posts.json, written in the admin panel under Blog).
//
// Each post picks one of six designs ("templates", listed in ./blogOptions.ts), so the blog doesn't
// look the same post after post. Every template uses the same fields; some make more of certain
// ones (the Photo story of the section photos, the Letter of the author, the Notice of the button).
import type { ImageMetadata } from 'astro';
import { hasImage, image, postsContent, type PostContent } from './content';
import { plain } from './richText';
import { categories, templates, type TemplateId } from './blogOptions';

export type Post = PostContent;

export { categories, templates, type TemplateId } from './blogOptions';

export const categoryLabel = (id: string) => categories[id] ?? 'News';
export const templateOf = (post: Post): TemplateId =>
  templates.some((t) => t.id === post.template) ? (post.template as TemplateId) : 'classic';

const newestFirst = (a: Post, b: Post) => (b.date || '').localeCompare(a.date || '');

/** Posts on the website, newest first. */
export const posts: Post[] = postsContent.filter((p) => !p.hidden).sort(newestFirst);

/** Drafts, built only at their private preview address. */
export const drafts: Post[] = postsContent.filter((p) => p.hidden && p.previewKey).sort(newestFirst);

export const postUrl = (post: Post) => (post.hidden ? `/blog/preview/${post.previewKey}` : `/blog/${post.slug}`);

/** "13 October 2026" */
export function formatPostDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function readingMinutes(post: Post) {
  const text = [post.intro, ...post.sections.flatMap((s) => [s.heading, s.text]), post.quote.text, ...post.takeaways].map(plain).join(' ');
  return Math.max(1, Math.round(text.split(' ').filter(Boolean).length / 200));
}

export const cover = (post: Post): ImageMetadata | undefined => (hasImage(post.cover) ? image(post.cover) : undefined);

/** The cover and every section photo, for the photo album. */
export function photosOf(post: Post): { src: ImageMetadata; caption: string; alt: string }[] {
  const list = [
    ...(hasImage(post.cover) ? [{ src: image(post.cover), caption: post.title, alt: post.coverAlt || post.title }] : []),
    ...post.sections
      .filter((s) => hasImage(s.photo))
      .map((s) => ({ src: image(s.photo), caption: s.caption || s.heading, alt: s.caption || s.heading || post.title })),
  ];
  // The same photo used twice (e.g. as the cover and in a section) shows once.
  return list.filter((p, i) => list.findIndex((q) => q.src.src === p.src.src) === i);
}

/** Up to three other posts, same category first. */
export function related(post: Post, count = 3) {
  const others = posts.filter((p) => p.slug !== post.slug);
  return [...others.filter((p) => p.category === post.category), ...others.filter((p) => p.category !== post.category)].slice(0, count);
}
