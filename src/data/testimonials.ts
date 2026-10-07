// Parent testimonials shown on the home page. The section stays hidden while
// this list is empty, so only add real quotes, with the parent's permission.

export interface Testimonial {
  quote: string;
  name: string;
  detail: string; // e.g. 'Parent, Nursery – Neotown'
}

export const testimonials: Testimonial[] = [];
