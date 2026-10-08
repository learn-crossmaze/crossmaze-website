// Loads the site content from /content/*.json.
//
// Those JSON files are the snapshot the site is built from. The admin panel (/admin) edits
// the same content in Firestore; scripts/sync-content.mjs pulls it into these files (and the
// photos into src/assets/cms/) before every deploy, so the site always reflects the admin panel.
//
// Image fields hold a path relative to src/assets/, e.g. "branches/crossmaze-neotown/01.jpg".
import type { ImageMetadata } from 'astro';

const images = import.meta.glob<{ default: ImageMetadata }>('../assets/**/*.{jpg,jpeg,png,webp,gif,avif}', {
  eager: true,
});

/** Resolves an image path from the content files to an optimisable Astro image. */
export function image(path: string): ImageMetadata {
  const found = images[`../assets/${path}`];
  if (!found) throw new Error(`Content refers to a missing image: src/assets/${path}`);
  return found.default;
}

export const hasImage = (path: string | undefined | null): path is string =>
  Boolean(path && images[`../assets/${path}`]);

export interface Photo {
  image: string;
  alt: string;
}

export interface SiteContent {
  name: string;
  fullName: string;
  legalName: string;
  tagline: string;
  description: string;
  url: string;
  logo: string;
  mascot: string;
  phone: string;
  whatsapp: string;
  admissionsEmail: string;
  careEmail: string;
  careersEmail: string;
  address: string[];
  addressPincode: string;
  hours: { preschool: string; daycare: string };
  hero: {
    titleStart: string;
    titleHighlight: string;
    lead: string;
    photos: Photo[];
    badgeValue: string;
    badgeLabel: string;
  };
  promise: string;
  about: string[];
  aboutPhoto: Photo;
  quote: { text: string; author: string };
  stats: { value: string; label: string }[];
  daycarePhoto: Photo;
  moments: Photo[];
  founders: string[];
  foundedYear: number;
  social: { label: string; href: string }[];
}

export interface IconItem {
  icon: string;
  title: string;
  text: string;
}

export interface SectionsContent {
  coreValues: IconItem[];
  approach: IconItem[];
  daycareHighlights: string[];
  extracurricular: { icon: string; label: string }[];
  facilities: IconItem[];
  perks: IconItem[];
  faqs: { q: string; a: string }[];
}

export type ToneColor = 'sun' | 'coral' | 'green' | 'sky' | 'navy';

export interface ProgramContent {
  slug: string;
  name: string;
  ages: string;
  icon: string;
  color: ToneColor;
  timing: string;
  headline: string;
  summary: string;
  paragraphs: string[];
  focusTitle: string;
  focus: string[];
  photo: string;
  photoAlt: string;
}

export interface BranchContent {
  slug: string;
  name: string;
  area: string;
  intro: string;
  description: string[];
  address: string[];
  pincode: string;
  mapQuery: string;
  phone: string;
  email: string;
  centerHead?: { name: string; bio: string[]; photo?: string };
  carpetArea?: string;
  capacity?: number;
  amenities: string[];
  programs: string[];
  photos: string[];
}

export interface JobContent {
  slug: string;
  title: string;
  qualification: string;
  experience: string;
  timings: string[];
  ageLimit?: string;
  overview: string;
  responsibilities: { title?: string; text: string }[];
  extra?: { title: string; text: string };
}

export interface TestimonialContent {
  quote: string;
  name: string;
  detail: string;
}

import siteJson from '../../content/site.json';
import sectionsJson from '../../content/sections.json';
import programsJson from '../../content/programs.json';
import branchesJson from '../../content/branches.json';
import jobsJson from '../../content/jobs.json';
import testimonialsJson from '../../content/testimonials.json';

export const siteContent = siteJson as SiteContent;
export const sectionsContent = sectionsJson as SectionsContent;
export const programsContent = programsJson as ProgramContent[];
export const branchesContent = branchesJson as BranchContent[];
export const jobsContent = jobsJson as JobContent[];
export const testimonialsContent = testimonialsJson as TestimonialContent[];
