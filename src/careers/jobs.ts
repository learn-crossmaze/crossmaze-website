// What a shared job says about itself: its own link, where it is, and the facts its picture shows
// (src/careers/poster.ts). Also used by the job's own page and the Share button (CareersContent.astro).
import type { Job } from '../data/jobs';
import { site } from '../data/site';

/** Where a job is, when the admin panel doesn't say (every centre is in one of these two areas). */
export const DEFAULT_WHERE = 'Electronic City & Begur, Bengaluru';
/** A qualification longer than this doesn't fit the picture: "Qualification in a few words" is used instead. */
const SHORT = 60;

export const jobUrl = (job: Job) => new URL(`/careers/${job.slug}`, site.url).href;
export const jobWhere = (job: Job) => job.location?.trim() || DEFAULT_WHERE;

/** The facts on the picture: the qualification (when short enough), the experience and the work timings. */
export function jobFacts(job: Job): { icon: string; text: string }[] {
  const qualification = job.shortQualification?.trim() || (job.qualification.trim().length <= SHORT ? job.qualification.trim() : '');
  return [
    qualification && { icon: 'GraduationCap', text: qualification },
    job.experience?.trim() && { icon: 'Briefcase', text: job.experience.trim() },
    job.timings.length > 0 && { icon: 'Clock', text: job.timings.slice(0, 2).join('\n') },
  ].filter((f): f is { icon: string; text: string } => !!f);
}

/** The words sent with the job's link and picture. */
export const shareText = (job: Job) =>
  `${job.title} at ${site.fullName}, ${jobWhere(job).replace(/, Bengaluru$/, '')}. See the details and apply: ${jobUrl(job)}`;
