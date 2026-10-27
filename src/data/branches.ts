// Every Crossmaze centre (content/branches.json, edited from the admin panel).
// Each entry becomes a page at /branch/<slug>; keep slugs unchanged so old links keep working.
// A branch's first photo is its cover; up to nine more fill the gallery, and the album has them all.
import type { ImageMetadata } from 'astro';
import { amenityList } from './amenities';
import { cleanBatches } from './batches';
import { branchesContent, hasImage, image, programsContent, sectionsContent, siteContent, type BranchContent } from './content';

export type Branch = BranchContent;

export { amenityList } from './amenities';

export const facilities = sectionsContent.facilities;

export const branches: Branch[] = branchesContent.map((b) => ({
  ...b,
  amenities: b.amenities.filter((key) => key in amenityList),
  // Only batches of programs the branch offers that are on the website, earliest first.
  batches: cleanBatches(b.batches).filter((batch) => b.programs.includes(batch.program) && programsContent.some((p) => p.slug === batch.program)),
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

/**
 * Where the centre is, as its page names it for search: its area (or its short name when the area is empty),
 * with ", Electronic City" added when the address is in Electronic City but the area doesn't say so
 * ("Neeladri Nagar, Electronic City"). Its parts are always separated by ", ".
 */
export function branchPlace(branch: Branch) {
  const ec = /electronic city/i;
  const area = (branch.area ?? '').split(',').map((part) => part.trim()).filter(Boolean).join(', ') || shortName(branch);
  return !ec.test(area) && branch.address.some((line) => ec.test(line)) ? `${area}, Electronic City` : area;
}

/** A branch's page, and the centre's id in structured data (its own page, and the school's subOrganization). */
export const branchUrl = (branch: Branch) => new URL(`/branch/${branch.slug}`, siteContent.url).href;
export const branchId = (branch: Branch) => `${branchUrl(branch)}#centre`;

/** The map field as coordinates ("12.8598706,77.613154") for structured data; undefined when it is a place search. */
export function branchGeo(branch: Branch) {
  const m = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(branch.mapQuery ?? '');
  if (!m) return undefined;
  const [latitude, longitude] = [Number(m[1]), Number(m[2])];
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { '@type': 'GeoCoordinates', latitude, longitude } : undefined;
}
