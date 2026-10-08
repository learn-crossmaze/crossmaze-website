// School-wide details. The values live in content/site.json and content/sections.json
// (edited from the admin panel); this module adds the derived links the pages need.
import { siteContent, sectionsContent } from './content';

const digits = (value: string) => value.replace(/[^\d]/g, '');

export const site = {
  ...siteContent,
  phoneHref: `tel:+${digits(siteContent.phone)}`,
  whatsappHref: `https://wa.me/${digits(siteContent.whatsapp || siteContent.phone)}`,
};

export const coreValues = sectionsContent.coreValues;
export const faqs = sectionsContent.faqs;
export const dayRoutine = sectionsContent.dayRoutine ?? [];
export const admissionSteps = sectionsContent.admissionSteps ?? [];

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Programs', href: '/our-programs' },
  { label: 'Branches', href: '/branch' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
] as const;
