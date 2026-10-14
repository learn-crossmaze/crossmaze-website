// School-wide details. The values live in content/site.json and content/sections.json
// (edited from the admin panel); this module adds the derived links the pages need.
import { siteContent, sectionsContent, postsContent } from './content';

const digits = (value: string) => value.replace(/[^\d]/g, '');

export const site = {
  ...siteContent,
  phoneHref: `tel:+${digits(siteContent.phone)}`,
  whatsappHref: `https://wa.me/${digits(siteContent.whatsapp || siteContent.phone)}`,
};

/** The Google Analytics measurement ID ("G-…") from Site settings, or '' when it's off or mistyped. */
export const analyticsId = (() => {
  const id = (siteContent.analytics?.measurementId ?? '').trim().toUpperCase();
  return /^G-[A-Z0-9]{4,20}$/.test(id) ? id : '';
})();

export const coreValues = sectionsContent.coreValues;
export const faqs = sectionsContent.faqs;
export const dayRoutine = sectionsContent.dayRoutine ?? [];
export const admissionSteps = sectionsContent.admissionSteps ?? [];

// "Blog" appears once at least one post is published (not hidden) in the admin panel.
const hasBlog = postsContent.some((p) => !p.hidden);

export const nav: { label: string; href: string }[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Programs', href: '/our-programs' },
  { label: 'Branches', href: '/branch' },
  { label: 'Careers', href: '/careers' },
  ...(hasBlog ? [{ label: 'Blog', href: '/blog' }] : []),
  { label: 'Contact', href: '/contact' },
];
