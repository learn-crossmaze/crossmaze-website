// Describes every editable piece of content. The admin panel builds its forms from these schemas,
// and the field keys match content/*.json (which the website is built from).
import { amenityList, iconChoices } from '../data/amenities';

export interface Option {
  value: string;
  label: string;
}

interface Base {
  key: string;
  label: string;
  help?: string;
  required?: boolean;
}

export type Field =
  | (Base & { type: 'text' | 'email' | 'tel' | 'url'; placeholder?: string })
  | (Base & { type: 'textarea'; rows?: number })
  | (Base & { type: 'number' })
  | (Base & { type: 'boolean' })
  | (Base & { type: 'select'; options: Option[] })
  | (Base & { type: 'icon' })
  | (Base & { type: 'checkboxes'; options?: Option[]; optionsFrom?: 'programs' })
  | (Base & { type: 'list'; itemLabel: string; multiline?: boolean })
  | (Base & { type: 'image'; folder: string })
  | (Base & { type: 'images'; folder: string })
  | (Base & { type: 'group'; fields: Field[] })
  | (Base & { type: 'objects'; itemLabel: string; fields: Field[]; summary?: string })
  | { type: 'heading'; label: string; help?: string; key?: undefined };

export const iconOptions: Option[] = iconChoices.map((name) => ({ value: name, label: name }));
const colorOptions: Option[] = [
  { value: 'navy', label: 'Navy' },
  { value: 'sun', label: 'Yellow' },
  { value: 'coral', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'sky', label: 'Blue' },
];
const amenityOptions: Option[] = Object.entries(amenityList).map(([value, a]) => ({ value, label: a.label }));

const photoFields = (folder: string): Field[] => [
  { key: 'image', label: 'Photo', type: 'image', folder, required: true },
  { key: 'alt', label: 'Description', type: 'text', help: 'Describes the photo for screen readers and Google.' },
];

export type ObjectsField = Extract<Field, { type: 'objects' }>;

const iconItem = (itemLabel: string): ObjectsField => ({
  key: '',
  label: '',
  type: 'objects',
  itemLabel,
  summary: 'title',
  fields: [
    { key: 'icon', label: 'Icon', type: 'icon' },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'text', label: 'Text', type: 'textarea', rows: 2 },
  ],
});

// ------------------------------------------------------------------- site settings

export const siteSchema: Field[] = [
  { type: 'heading', label: 'School' },
  { key: 'name', label: 'Short name', type: 'text', required: true },
  { key: 'fullName', label: 'Full name', type: 'text', required: true },
  { key: 'legalName', label: 'Company name', type: 'text', help: 'Shown in the footer copyright.' },
  { key: 'tagline', label: 'Tagline', type: 'text' },
  { key: 'description', label: 'Description for Google', type: 'textarea', rows: 3, help: 'About 150 characters. Shown in search results.' },
  { key: 'logo', label: 'Logo', type: 'image', folder: 'brand', required: true, help: 'A wide PNG with a transparent background works best.' },
  { key: 'mascot', label: 'Mascot / footer illustration', type: 'image', folder: 'brand' },

  { type: 'heading', label: 'Contact details' },
  { key: 'phone', label: 'Phone number', type: 'tel', required: true },
  { key: 'whatsapp', label: 'WhatsApp number', type: 'tel', help: 'With country code, e.g. 917204021508. Leave empty to use the phone number.' },
  { key: 'admissionsEmail', label: 'Admissions email', type: 'email' },
  { key: 'careEmail', label: 'Parent support email', type: 'email' },
  { key: 'careersEmail', label: 'Careers email', type: 'email' },
  { key: 'address', label: 'Main address', type: 'list', itemLabel: 'Line' },
  { key: 'addressPincode', label: 'Main address PIN code', type: 'text' },
  {
    key: 'hours',
    label: 'Timings',
    type: 'group',
    fields: [
      { key: 'preschool', label: 'Preschool', type: 'text' },
      { key: 'daycare', label: 'Day care', type: 'text' },
    ],
  },
  {
    key: 'social',
    label: 'Social media links',
    type: 'objects',
    itemLabel: 'Link',
    summary: 'label',
    fields: [
      { key: 'label', label: 'Name', type: 'text', required: true },
      { key: 'href', label: 'Link', type: 'url', required: true },
    ],
  },

  { type: 'heading', label: 'Home page' },
  {
    key: 'hero',
    label: 'Top banner',
    type: 'group',
    fields: [
      { key: 'titleStart', label: 'Heading', type: 'text' },
      { key: 'titleHighlight', label: 'Underlined part of the heading', type: 'text' },
      { key: 'lead', label: 'Introduction', type: 'textarea', rows: 3 },
      { key: 'badgeValue', label: 'Badge number', type: 'text', help: 'E.g. 1000+. Leave empty to hide the badge.' },
      { key: 'badgeLabel', label: 'Badge text', type: 'text' },
      { key: 'photos', label: 'Photos', type: 'objects', itemLabel: 'Photo', summary: 'alt', fields: photoFields('home'), help: 'The first is the large photo; the next two appear below it.' },
    ],
  },
  {
    key: 'stats',
    label: 'Numbers strip',
    type: 'objects',
    itemLabel: 'Number',
    summary: 'value',
    fields: [
      { key: 'value', label: 'Number', type: 'text', required: true },
      { key: 'label', label: 'Label', type: 'text', required: true },
    ],
  },
  { key: 'promise', label: 'Our promise', type: 'textarea', rows: 4, help: 'Also used as the About page introduction.' },
  { key: 'about', label: 'About us paragraphs', type: 'list', itemLabel: 'Paragraph', multiline: true },
  { key: 'aboutPhoto', label: 'About us photo', type: 'group', fields: photoFields('home') },
  {
    key: 'quote',
    label: 'Quote',
    type: 'group',
    fields: [
      { key: 'text', label: 'Quote', type: 'textarea', rows: 2 },
      { key: 'author', label: 'Author', type: 'text' },
    ],
  },
  { key: 'daycarePhoto', label: 'Day care photo', type: 'group', fields: photoFields('home') },

  { type: 'heading', label: 'About page' },
  { key: 'moments', label: '“Life at Crossmaze” photos', type: 'objects', itemLabel: 'Photo', summary: 'alt', fields: photoFields('about') },
  { key: 'founders', label: 'Founders', type: 'list', itemLabel: 'Name' },
  { key: 'foundedYear', label: 'Year founded', type: 'number' },
];

// ------------------------------------------------------------------- shared page sections

export const sectionsSchema: Field[] = [
  { ...iconItem('Value'), key: 'coreValues', label: 'Core values', help: 'Home and About pages.' },
  { ...iconItem('Point'), key: 'approach', label: 'How we teach', help: 'Programs and About pages.' },
  { key: 'daycareHighlights', label: 'Day care highlights', type: 'list', itemLabel: 'Highlight' },
  {
    key: 'extracurricular',
    label: 'Extra-curricular activities',
    type: 'objects',
    itemLabel: 'Activity',
    summary: 'label',
    fields: [
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'label', label: 'Activity', type: 'text', required: true },
    ],
  },
  { ...iconItem('Facility'), key: 'facilities', label: 'Facilities', help: 'Home and Branches pages.' },
  { ...iconItem('Perk'), key: 'perks', label: 'Why work with us', help: 'Careers page.' },
  {
    ...iconItem('Part of the day'),
    key: 'dayRoutine',
    label: 'A day at Crossmaze',
    help: 'Home and Programs pages, in order. Remove every entry to hide the section.',
  },
  {
    ...iconItem('Step'),
    key: 'admissionSteps',
    label: 'How admission works',
    help: 'Home and Contact pages, in order. Remove every entry to hide the section.',
  },
  {
    key: 'faqs',
    label: 'Frequently asked questions',
    type: 'objects',
    itemLabel: 'Question',
    summary: 'q',
    help: 'Programs page.',
    fields: [
      { key: 'q', label: 'Question', type: 'text', required: true },
      { key: 'a', label: 'Answer', type: 'textarea', rows: 3, required: true },
    ],
  },
];

// ------------------------------------------------------------------- collections

export const branchSchema: Field[] = [
  { type: 'heading', label: 'Branch' },
  { key: 'name', label: 'Branch name', type: 'text', required: true, placeholder: 'Crossmaze – Neotown' },
  { key: 'area', label: 'Area', type: 'text', placeholder: 'Neotown, Thirupalya' },
  { key: 'intro', label: 'Short introduction', type: 'textarea', rows: 2, help: 'Shown at the top of the branch page.' },
  { key: 'description', label: 'About this centre', type: 'list', itemLabel: 'Paragraph', multiline: true },
  { key: 'photos', label: 'Photos', type: 'images', folder: 'branches', help: 'The first photo is the cover; the next five fill the gallery. Use the arrows to reorder.' },

  { type: 'heading', label: 'Contact and location' },
  { key: 'address', label: 'Address', type: 'list', itemLabel: 'Line' },
  { key: 'pincode', label: 'PIN code', type: 'text' },
  { key: 'mapQuery', label: 'Google Maps search', type: 'text', help: 'Where the map points: the centre’s coordinates (latitude,longitude, e.g. 12.8598,77.6131) or what to search on Google Maps.' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'email', label: 'Email', type: 'email' },

  { type: 'heading', label: 'Facts and facilities' },
  { key: 'carpetArea', label: 'Carpet area', type: 'text', placeholder: '4,200 sq ft' },
  { key: 'capacity', label: 'Capacity (children)', type: 'number' },
  { key: 'amenities', label: 'Amenities', type: 'checkboxes', options: amenityOptions },
  { key: 'programs', label: 'Programs offered', type: 'checkboxes', optionsFrom: 'programs' },

  { type: 'heading', label: 'Centre head' },
  {
    key: 'centerHead',
    label: '',
    type: 'group',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'photo', label: 'Photo', type: 'image', folder: 'heads', help: 'A square portrait works best.' },
      { key: 'bio', label: 'Biography', type: 'list', itemLabel: 'Paragraph', multiline: true },
    ],
  },
];

export const programSchema: Field[] = [
  { key: 'name', label: 'Program name', type: 'text', required: true },
  { key: 'ages', label: 'Age group', type: 'text', required: true, placeholder: '2 – 3 years' },
  { key: 'timing', label: 'Timing', type: 'text', placeholder: '9:00 am – 12:30 pm' },
  { key: 'icon', label: 'Icon', type: 'icon' },
  { key: 'color', label: 'Colour', type: 'select', options: colorOptions },
  { key: 'photo', label: 'Photo', type: 'image', folder: 'programs', required: true },
  { key: 'photoAlt', label: 'Photo description', type: 'text' },
  { key: 'headline', label: 'Headline', type: 'text' },
  { key: 'summary', label: 'Summary', type: 'textarea', rows: 2, help: 'Shown on the program cards.' },
  { key: 'paragraphs', label: 'Description', type: 'list', itemLabel: 'Paragraph', multiline: true },
  { key: 'focusTitle', label: 'List title', type: 'text', placeholder: 'Focus areas' },
  { key: 'focus', label: 'List items', type: 'list', itemLabel: 'Item' },
];

export const jobSchema: Field[] = [
  { key: 'title', label: 'Job title', type: 'text', required: true },
  { key: 'overview', label: 'Overview', type: 'textarea', rows: 3 },
  { key: 'qualification', label: 'Qualification', type: 'textarea', rows: 3 },
  { key: 'experience', label: 'Experience', type: 'text' },
  { key: 'timings', label: 'Work timings', type: 'list', itemLabel: 'Timing' },
  { key: 'ageLimit', label: 'Age limit', type: 'text', help: 'Optional.' },
  {
    key: 'responsibilities',
    label: 'Responsibilities',
    type: 'objects',
    itemLabel: 'Responsibility',
    summary: 'text',
    fields: [
      { key: 'title', label: 'Heading (optional)', type: 'text' },
      { key: 'text', label: 'Responsibility', type: 'textarea', rows: 2, required: true },
    ],
  },
  {
    key: 'extra',
    label: 'Extra note',
    type: 'group',
    fields: [
      { key: 'title', label: 'Heading', type: 'text' },
      { key: 'text', label: 'Text', type: 'textarea', rows: 2 },
    ],
  },
];

export const testimonialSchema: Field[] = [
  { key: 'quote', label: 'Quote', type: 'textarea', rows: 5, required: true },
  { key: 'name', label: 'Parent names', type: 'text', required: true },
  { key: 'detail', label: 'Detail', type: 'text', placeholder: 'Parents of …' },
];

export interface CollectionConfig {
  name: 'branches' | 'programs' | 'jobs' | 'testimonials';
  title: string;
  singular: string;
  schema: Field[];
  titleField: string;
  subtitleField?: string;
  /** Collections whose items have a web address (slug) that becomes the document id. */
  slug?: { prefix: string; urlPrefix?: string };
  blank: () => Record<string, unknown>;
}

export const collections: Record<CollectionConfig['name'], CollectionConfig> = {
  branches: {
    name: 'branches',
    title: 'Branches',
    singular: 'branch',
    schema: branchSchema,
    titleField: 'name',
    subtitleField: 'area',
    slug: { prefix: 'crossmaze-', urlPrefix: '/branch/' },
    blank: () => ({
      name: '',
      area: '',
      intro: '',
      description: [],
      address: [],
      pincode: '',
      mapQuery: '',
      phone: '',
      email: '',
      amenities: Object.keys(amenityList).filter((k) => k !== 'outdoorPlay' && k !== 'transport'),
      programs: [],
      photos: [],
      centerHead: { name: '', bio: [], photo: '' },
    }),
  },
  programs: {
    name: 'programs',
    title: 'Programs',
    singular: 'program',
    schema: programSchema,
    titleField: 'name',
    subtitleField: 'ages',
    slug: { prefix: '', urlPrefix: '/our-programs#' },
    blank: () => ({ name: '', ages: '', timing: '', icon: 'Star', color: 'navy', photo: '', photoAlt: '', headline: '', summary: '', paragraphs: [], focusTitle: 'Focus areas', focus: [] }),
  },
  jobs: {
    name: 'jobs',
    title: 'Jobs',
    singular: 'job',
    schema: jobSchema,
    titleField: 'title',
    subtitleField: 'experience',
    slug: { prefix: '' },
    blank: () => ({ title: '', overview: '', qualification: '', experience: '', timings: [], responsibilities: [] }),
  },
  testimonials: {
    name: 'testimonials',
    title: 'Testimonials',
    singular: 'testimonial',
    schema: testimonialSchema,
    titleField: 'name',
    subtitleField: 'detail',
    blank: () => ({ quote: '', name: '', detail: '' }),
  },
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
