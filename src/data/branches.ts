// Every Crossmaze centre. Each entry becomes a page at /branch/<slug>.
// Keep slugs unchanged so links from the old site and Google keep working.

export interface Branch {
  slug: string;
  name: string;
  area: string;
  intro: string;
  address: string[];
  pincode: string;
  mapQuery: string;
  phone: string;
  email: string;
  centerHead?: string;
  carpetArea?: string;
  capacity?: number;
  programs: string[];
  /** Optional photo in /public, e.g. '/images/branches/crossmaze-neotown.jpg' */
  image?: string;
}

export const amenities = [
  { icon: 'Flame', label: 'Fire safety' },
  { icon: 'Baby', label: 'Child-friendly infrastructure' },
  { icon: 'Building2', label: 'Age-appropriate classrooms' },
  { icon: 'Cctv', label: 'CCTV surveillance' },
  { icon: 'Shapes', label: 'Montessori area' },
  { icon: 'Blocks', label: 'Indoor play space' },
  { icon: 'Utensils', label: 'Dry pantry' },
  { icon: 'BedDouble', label: 'Sleeping room' },
  { icon: 'Smartphone', label: 'Mobile app for parents' },
] as const;

const allPrograms = ['play-group', 'nursery', 'junior-kg', 'senior-kg', 'day-care'];

export const branches: Branch[] = [
  {
    slug: 'crossmaze-neotown',
    name: 'Crossmaze – Neotown',
    area: 'Neotown, Electronic City',
    intro:
      'Our largest centre, in Neotown, Thirupalya, is the preferred choice for busy parents in the area, with spacious classrooms, a dedicated Montessori area and full-day care.',
    address: ['Site No. 3/4, Opposite GM Infinite', 'Neotown, Electronic City Phase 1', 'Bengaluru, Karnataka'],
    pincode: '560099',
    mapQuery: 'Crossmaze Preschool and Day Care, Neotown, Electronic City, Bengaluru 560099',
    phone: '+91 72599 21508',
    email: 'admission@crossmaze.in',
    centerHead: 'Ms. Aishwarya',
    carpetArea: '12,000 sq ft',
    capacity: 180,
    programs: allPrograms,
  },
  {
    slug: 'crossmaze-neeladri',
    name: 'Crossmaze – Neeladri Nagar',
    area: 'Neeladri Nagar, Electronic City',
    intro:
      'Close to the heart of Electronic City Phase 1, our Neeladri Nagar centre welcomes up to 200 children across preschool and day care, in a bright, purpose-designed space.',
    address: ['Malligue Residency, 16th Cross Road', 'Neeladri Nagar, Electronic City Phase 1', 'Bengaluru, Karnataka'],
    pincode: '560100',
    mapQuery: 'Crossmaze Preschool and Day Care, Neeladri Nagar, Electronic City Phase 1, Bengaluru 560100',
    phone: '+91 72599 21508',
    email: 'admission@crossmaze.in',
    centerHead: 'Mrs. Pallavi Priya',
    carpetArea: '7,200 sq ft',
    capacity: 200,
    programs: allPrograms,
  },
  {
    slug: 'crossmaze-snn-greenbay',
    name: 'Crossmaze – SNN Greenbay',
    area: 'SNN Raj Greenbay, Electronic City',
    intro:
      'Right inside the SNN Raj Greenbay community, this centre makes drop-off and pick-up effortless for families in and around Electronic City Phase 2.',
    address: ['G1, Commercial Complex, SNN Raj Greenbay', '1st Main Road, Electronic City Phase 2', 'Bengaluru, Karnataka'],
    pincode: '560100',
    mapQuery: 'Crossmaze Preschool and Day Care, SNN Raj Greenbay, Electronic City, Bengaluru 560100',
    phone: '+91 72599 21508',
    email: 'admission@crossmaze.in',
    carpetArea: '3,200 sq ft',
    capacity: 144,
    programs: allPrograms,
  },
  {
    slug: 'crossmaze-the-hub',
    name: 'Crossmaze – The Hub, Begur',
    area: 'The Hub, Begur',
    intro:
      'Located at SNN The Hub opposite SNN Raj Serenity, our Begur centre brings the Crossmaze experience to families along Begur and Yelenahalli.',
    address: ['SNN The Hub, opposite SNN Raj Serenity', 'Suraksha Nagar, Yelenahalli, Begur', 'Bengaluru, Karnataka'],
    pincode: '560068',
    mapQuery: 'Crossmaze Preschool and Day Care, The Hub, Begur, Bengaluru 560068',
    phone: '+91 72040 21508',
    email: 'admission@crossmaze.in',
    carpetArea: '4,200 sq ft',
    capacity: 150,
    programs: allPrograms,
  },
  {
    slug: 'crossmaze-ananth-nagar',
    name: 'Crossmaze – Ananth Nagar',
    area: 'Ananth Nagar, Electronic City',
    intro:
      'Situated in the heart of Ananth Nagar, this centre is a trusted choice for parents looking for quality early education and care within this thriving community.',
    address: ['Ananth Nagar, Electronic City', 'Bengaluru, Karnataka'],
    pincode: '560100',
    mapQuery: 'Crossmaze Preschool, Ananth Nagar, Electronic City, Bengaluru 560100',
    phone: '+91 72599 21508',
    email: 'admission@crossmaze.in',
    carpetArea: '3,000 sq ft',
    capacity: 144,
    programs: allPrograms,
  },
];

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
