// Open positions shown on /careers (content/jobs.json, edited from the admin panel).
import { jobsContent, sectionsContent } from './content';

export type { JobContent as Job } from './content';

export const jobs = jobsContent;
export const perks = sectionsContent.perks;
