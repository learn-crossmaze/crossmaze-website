// The blog's designs and categories, shared by the website (src/data/blog.ts) and the admin panel
// (src/admin/schemas.ts). Kept free of content and images so the admin panel can load it cheaply.

export const templates = [
  { id: 'classic', label: 'Classic', text: 'A clean article with the cover photo on top. Good for most posts.' },
  { id: 'magazine', label: 'Magazine', text: 'A big cover photo with the title over it and a contents list beside the text. For longer reads.' },
  { id: 'story', label: 'Photo story', text: 'Large photos beside short text, and every photo opens in an album. For events and trips.' },
  { id: 'tips', label: 'Tips', text: 'Each section becomes a numbered card, with the key points at the end. For “5 ways to…” posts.' },
  { id: 'notice', label: 'Notice', text: 'A short announcement in a single card with a big button. For admissions, holidays and news.' },
  { id: 'letter', label: 'Letter', text: 'A personal note, signed by the author. For messages from the principal or the team.' },
] as const;

export type TemplateId = (typeof templates)[number]['id'];

export const categories: Record<string, string> = {
  news: 'News',
  tips: 'Parenting tips',
  learning: 'Learning and play',
  events: 'Events',
  announcements: 'Announcements',
  letters: 'Letters',
};
