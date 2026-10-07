// Every Crossmaze centre (content/branches.json, edited from the admin panel).
// Each entry becomes a page at /branch/<slug>; keep slugs unchanged so old links keep working.
// A branch's first photo is its cover; the next five fill the gallery.
import type { ImageMetadata } from 'astro';
import { amenityList } from './amenities';
import { branchesContent, hasImage, image, sectionsContent, type BranchContent } from './content';

export type Branch = BranchContent;

export { amenityList } from './amenities';

export const facilities = sectionsContent.facilities;

export const branches: Branch[] = branchesContent.map((b) => ({
  ...b,
  amenities: b.amenities.filter((key) => key in amenityList),
}));

export function branchPhotos(slug: string): ImageMetadata[] {
  const branch = branches.find((b) => b.slug === slug);
  return (branch?.photos ?? []).filter(hasImage).map(image);
}

export function headPhoto(slug: string): ImageMetadata | undefined {
  const photo = branches.find((b) => b.slug === slug)?.centerHead?.photo;
  return hasImage(photo) ? image(photo) : undefined;
}

export const shortName = (branch: Branch) => branch.name.replace(/^Crossmaze\s*[–-]\s*/, '');

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
