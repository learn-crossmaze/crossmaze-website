// Parent testimonials shown on the home page (content/testimonials.json, edited from the admin panel).
// The section hides itself if the list is empty.
import { testimonialsContent } from './content';

export type { TestimonialContent as Testimonial } from './content';

export const testimonials = testimonialsContent;
