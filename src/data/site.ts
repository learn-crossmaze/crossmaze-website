// School-wide details. The values live in content/site.json and content/sections.json
// (edited from the admin panel); this module adds the derived links the pages need.
import { siteContent, sectionsContent, postsContent } from './content';

const digits = (value: string) => value.replace(/[^\d]/g, '');

export const site = {
  ...siteContent,
  // Only while "Show the founders on the About page" is on (admin: Site settings → About page); until then the
  // website leaves the founders out entirely, including the Organization search engines read (BaseLayout).
  founders: siteContent.showFounders ? siteContent.founders : [],
  phoneHref: `tel:+${digits(siteContent.phone)}`,
  whatsappHref: `https://wa.me/${digits(siteContent.whatsapp || siteContent.phone)}`,
};

/** The school in structured data (BaseLayout): each centre, the website and the blog point at it by this id. */
export const orgId = `${siteContent.url}/#organization`;

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
