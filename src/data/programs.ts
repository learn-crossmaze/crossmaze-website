// Programs offered across Crossmaze branches (content/programs.json, edited from the admin panel).
import type { ImageMetadata } from 'astro';
import { image, programsContent, sectionsContent, type ProgramContent } from './content';

export interface Program extends Omit<ProgramContent, 'photo'> {
  photo: ImageMetadata;
}

export const programs: Program[] = programsContent.map((p) => ({ ...p, photo: image(p.photo) }));

export const daycareHighlights = sectionsContent.daycareHighlights;
export const approach = sectionsContent.approach;
export const extracurricular = sectionsContent.extracurricular;
