// Every Crossmaze centre. Each entry becomes a page at /branch/<slug>.
// Keep slugs unchanged so links from the old site and Google keep working.
//
// Photos are picked up automatically:
//   src/assets/branches/<slug>/*.jpg  -> gallery (first file, sorted by name, is the cover photo)
//   src/assets/heads/<slug>.jpg       -> centre head portrait
import type { ImageMetadata } from 'astro';

export interface CenterHead {
  name: string;
  bio: string[];
}

export interface Branch {
  slug: string;
  name: string;
  area: string;
  intro: string;
  description: string[];
  address: string[];
  pincode: string;
  mapQuery: string;
  phone: string;
  email: string;
  centerHead?: CenterHead;
  carpetArea?: string;
  capacity?: number;
  amenities: AmenityKey[];
  programs: string[];
}

export const amenityList = {
  fire: { icon: 'Flame', label: 'Fire safety' },
  infra: { icon: 'Baby', label: 'Child-friendly infrastructure' },
  classrooms: { icon: 'Building2', label: 'Age-appropriate classrooms' },
  cctv: { icon: 'Cctv', label: 'CCTV surveillance' },
  montessori: { icon: 'Shapes', label: 'Montessori area' },
  indoorPlay: { icon: 'Blocks', label: 'Indoor play space' },
  outdoorPlay: { icon: 'Trees', label: 'Outdoor play area' },
  pantry: { icon: 'Utensils', label: 'Dry pantry' },
  sleeping: { icon: 'BedDouble', label: 'Sleeping room' },
  app: { icon: 'Smartphone', label: 'Mobile app for parents' },
  transport: { icon: 'Bus', label: 'In-house transport' },
} as const;

export type AmenityKey = keyof typeof amenityList;

/** Facilities shared by every centre, as described on the original site. */
export const facilities = [
  { icon: 'Shapes', title: 'Activity-based learning', text: 'A Montessori-based approach to learning.' },
  { icon: 'ShieldCheck', title: 'Child-safe infrastructure', text: 'Designed with child safety as the top priority.' },
  { icon: 'Building2', title: 'Age-appropriate classes', text: 'Vibrant classrooms tailored to children’s needs.' },
  { icon: 'Cctv', title: 'CCTV surveillance', text: 'Live CCTV streams for parents, in real time.' },
  { icon: 'BedDouble', title: 'Dedicated nap rooms', text: 'Air-conditioned sleeping rooms designed for naps.' },
  { icon: 'Smartphone', title: 'Parents communication app', text: 'Daily updates on the Crossmaze Care parents app.' },
  { icon: 'Blocks', title: 'Indoor play area', text: 'Climate-controlled comfort all year round.' },
  { icon: 'GraduationCap', title: 'Expert teachers', text: 'Well-trained staff who prioritise care and safety.' },
  { icon: 'HandHeart', title: 'Trained caregivers', text: 'Vigilant staff for every child’s safety and comfort.' },
  { icon: 'Flame', title: 'Fire safe', text: 'Fire safety measures focused on prevention.' },
  { icon: 'Bus', title: 'In-house transport', text: 'Safe, reliable transport within a 5 km radius.' },
  { icon: 'Music', title: 'Extra-curricular activities', text: 'Physical well-being and growth beyond the curriculum.' },
] as const;

const allPrograms = ['play-group', 'nursery', 'junior-kg', 'senior-kg', 'day-care'];
const baseAmenities: AmenityKey[] = ['fire', 'infra', 'classrooms', 'cctv', 'montessori', 'indoorPlay', 'pantry', 'sleeping', 'app'];
const phone = '+91 72040 21508';
const email = 'admission@crossmaze.in';

export const branches: Branch[] = [
  {
    slug: 'crossmaze-the-hub',
    name: 'Crossmaze – The Hub',
    area: 'SNN – The Hub, Begur',
    intro:
      'Centrally located in SNN – The Hub, Begur, close to corporate offices and residential projects such as SNN Raj Serenity, Prestige Song of the South and Windsor Troika.',
    description: [
      'Crossmaze Preschool, in the heart of SNN – The Hub, Begur, is the preferred choice for discerning parents in this community. Close to numerous corporate offices and residential projects such as SNN Raj Serenity, Prestige Song of the South and Windsor Troika, it offers a meticulously maintained, secure and enriching environment for your young ones.',
      'Inside you’ll find well-lit classrooms, a fully equipped indoor play area and impeccably maintained restrooms. Alongside age-appropriate educational programs, we offer day care and after-school care tailored to working parents.',
      'Our infrastructure, child-centred facilities and stringent safety protocols come together to create a secure haven where children explore, learn, grow and unleash their creativity and imagination.',
    ],
    address: ['The Hub, in front of SNN Raj Serenity', 'Suraksha Nagar, Yelenahalli, Begur', 'Bengaluru, Karnataka'],
    pincode: '560068',
    mapQuery: 'Crossmaze Preschool and Day Care, The Hub, Begur, Bengaluru 560068',
    phone,
    email,
    centerHead: {
      name: 'Mrs. Ruchika Bansal',
      bio: [
        'Ms. Ruchika brings a strong blend of corporate experience and a deep passion for education to her role as Centre Head of Crossmaze – The Hub. Her leadership brings structure, innovation and a people-centric approach that benefits both students and staff.',
        'She is a graduate who has completed the Chartered Financial Analyst (CFA) program, with a Diploma in Advertising and Public Relations, a Diploma in Advanced Yoga and Face Yoga, and certification in the Jolly Phonics program.',
        'With over 8 years of experience across finance and operations at organisations such as Goldman Sachs, JP Morgan, KPMG and Genpact, she has consistently led, managed and mentored teams. Her interest in yoga and mindfulness helps create a calm, balanced and nurturing environment for every child.',
      ],
    },
    carpetArea: '4,200 sq ft',
    capacity: 150,
    amenities: [...baseAmenities, 'transport'],
    programs: allPrograms,
  },
  {
    slug: 'crossmaze-neotown',
    name: 'Crossmaze – Neotown',
    area: 'Neotown, Thirupalya',
    intro:
      'Our largest centre, in Neotown, Thirupalya, is the preferred choice for busy parents, close to numerous corporate offices.',
    description: [
      'Crossmaze Preschool in Neotown, Thirupalya, is the preferred choice for busy parents in the area. Close to numerous corporate offices, the centre offers a clean, secure and vibrant environment, with well-lit classrooms, immaculate washrooms and a fully equipped indoor and outdoor play area.',
      'Beyond age-appropriate educational programs, we provide day care and after-school care for working parents. The centre is a nurturing home away from home, with brightly lit, well-ventilated classrooms, supervised play zones for each age group and engaging activity centres.',
      'World-class infrastructure, child-friendly facilities and stringent safety measures make it a safe haven where children explore, learn and grow. Step in with your child and discover the Crossmaze difference.',
    ],
    address: ['Site No. 3/4, opposite GM Infinite', 'Neotown, Thirupalya, Electronic City Phase 1', 'Bengaluru, Karnataka'],
    pincode: '560099',
    mapQuery: 'Crossmaze Preschool and Day Care, Neotown, Thirupalya, Bengaluru 560099',
    phone,
    email,
    centerHead: {
      name: 'Mrs. Aishwarya Sharma',
      bio: [
        'Mrs. Aishwarya, Centre Head of Crossmaze – Neotown, brings a wealth of experience in Montessori and child-centred learning, and is deeply passionate about nurturing young minds and fostering a love of learning.',
        'She holds a Master’s degree in English and Chemistry and a Bachelor of Education, and is certified in Montessori education, with its emphasis on hands-on, personalised learning that sparks curiosity.',
        'Before leading the branch, she played a key role at Crossmaze, gaining deep insight into our educational philosophy. She is known for designing engaging, multi-level lessons that support each child’s individual academic and developmental journey.',
      ],
    },
    carpetArea: '12,000 sq ft',
    capacity: 180,
    amenities: [...baseAmenities, 'transport'],
    programs: allPrograms,
  },
  {
    slug: 'crossmaze-snn-greenbay',
    name: 'Crossmaze – SNN Greenbay',
    area: 'SNN Raj Greenbay, Electronic City',
    intro:
      'Within SNN Raj Greenbay in Electronic City, a favourite of parents with demanding schedules, close to many corporate offices.',
    description: [
      'Crossmaze Preschool, within SNN Raj Greenbay in Electronic City, is the favoured choice of parents with demanding schedules. Close to many corporate offices, it offers a meticulously maintained, secure and dynamic environment for your child’s holistic development.',
      'Well-lit classrooms and impeccably maintained restrooms create an ideal learning environment, complemented by a fully equipped indoor and outdoor play area that supports both cognitive and physical development.',
      'Alongside age-appropriate curricula, we offer day care and after-school care for working parents, all backed by child-centric facilities and uncompromising safety protocols.',
    ],
    address: ['G1, Commercial Complex, SNN Raj Greenbay', '1st Main Road, Electronic City Phase 2', 'Bengaluru, Karnataka'],
    pincode: '560100',
    mapQuery: 'Crossmaze Preschool and Day Care, SNN Raj Greenbay, Electronic City, Bengaluru 560100',
    phone,
    email,
    centerHead: {
      name: 'Mrs. Sheerin Seethara',
      bio: [
        'Mrs. Sheerin brings experience as a lecturer and preschool teacher, and a deep understanding of educational dynamics and child development, to her role as Centre Head.',
        'She holds a Master’s degree in Business Administration (MBA), giving her a comprehensive perspective on educational management. Her warm, approachable nature makes her a trusted resource for students and parents alike.',
        'Driven by collaboration and excellence, she keeps open lines of communication with students, parents and staff. Outside work she loves the culinary arts, and brings that passion into workshops and events for children.',
      ],
    },
    carpetArea: '3,200 sq ft',
    capacity: 144,
    amenities: baseAmenities,
    programs: allPrograms,
  },
  {
    slug: 'crossmaze-neeladri',
    name: 'Crossmaze – Neeladri Nagar',
    area: 'Neeladri Nagar, Electronic City',
    intro:
      'In the heart of Electronic City, close to major offices and residential apartments, with the best child-to-adult ratio and a strong focus on transparency.',
    description: [
      'Crossmaze Preschool, in the heart of Electronic City at Neeladri Nagar, is the top pick for busy parents in the neighbourhood. Close to major offices and residential apartments, it’s a clean, snug and enchanting place for little ones, with bright classrooms and sparkling play areas.',
      'We offer specialised programs for every age, with engaging activities and a vibrant curriculum, plus after-school care for busy parents. Play zones are tailored to every age group, with plenty of exciting activities.',
      'With the best child-to-adult ratio and a strong focus on transparency, your child’s safety is our top priority.',
    ],
    address: ['Malligue Residency, 16th Cross Road', 'Neeladri Nagar, Electronic City Phase 1', 'Bengaluru, Karnataka'],
    pincode: '560100',
    mapQuery: 'Crossmaze Preschool and Day Care, Neeladri Nagar, Electronic City Phase 1, Bengaluru 560100',
    phone,
    email,
    centerHead: {
      name: 'Mrs. Pallavi Priya',
      bio: [
        'Mrs. Pallavi Priya is a dedicated educator with a strong commitment to early childhood development. She holds a Master’s degree and a Diploma in Child Psychology, and has volunteered in UK schools, giving her a global perspective on education.',
        'Previously an Academic Counsellor at NIIT Computer Institute, Bangalore, she has been an integral part of Crossmaze for over two years, contributing to curriculum development and child development programs, and organising cultural events, extracurricular activities and celebrations.',
        'Outside work she enjoys painting, travelling, music and dancing, and brings that creativity and enthusiasm into everything she does.',
      ],
    },
    carpetArea: '7,200 sq ft',
    capacity: 200,
    amenities: [...baseAmenities.slice(0, 6), 'outdoorPlay', ...baseAmenities.slice(6)],
    programs: allPrograms,
  },
  {
    slug: 'crossmaze-ananth-nagar',
    name: 'Crossmaze – Ananth Nagar',
    area: 'Ananth Nagar, Electronic City',
    intro:
      'In the heart of Ananth Nagar, near corporate hubs and residential developments like Concorde Epitome, Daadys Elixir, Prakruthi Solitaire and Mahendra Aarna.',
    description: [
      'Conveniently situated in the heart of Ananth Nagar, Crossmaze Preschool is a trusted choice for parents seeking quality early education and care. Near major corporate hubs and residential developments like Concorde Epitome, Daadys Elixir Apartments, Prakruthi Solitaire and Mahendra Aarna, it provides a well-maintained, safe and enriching environment.',
      'Bright, airy classrooms, a dedicated outdoor play area, a fully equipped indoor play area and hygienic, child-friendly restrooms create a comfortable and engaging atmosphere.',
      'Alongside age-appropriate academic programs, we offer flexible day care and after-school care designed around the needs of working parents.',
    ],
    address: ['Ananth Nagar, Electronic City', 'Bengaluru, Karnataka'],
    pincode: '560100',
    mapQuery: 'Crossmaze Preschool, Ananth Nagar, Electronic City, Bengaluru 560100',
    phone,
    email,
    centerHead: {
      name: 'Dr. Megha Anand',
      bio: [
        'Dr. Megha Anand is an educationist with over 13 years of experience, whose commitment to inspiring a love for learning has earned her a respected place in the academic community.',
        'She merges deep expertise in educational leadership and child development with innovative approaches to early childhood education, advocating a holistic approach that values cognitive, social, emotional and physical growth.',
        'Committed to best practices, she fosters teamwork among teachers and actively involves parents in their child’s education, so that every child’s preschool experience is joyful, enriching and impactful.',
      ],
    },
    carpetArea: '3,000 sq ft',
    capacity: 144,
    amenities: baseAmenities,
    programs: allPrograms,
  },
];

const galleryFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/branches/*/*.{jpg,jpeg,png,webp}', {
  eager: true,
});
const headFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/heads/*.{jpg,jpeg,png,webp}', { eager: true });

export function branchPhotos(slug: string): ImageMetadata[] {
  return Object.keys(galleryFiles)
    .filter((path) => path.includes(`/branches/${slug}/`))
    .sort()
    .map((path) => galleryFiles[path]!.default);
}

export function headPhoto(slug: string): ImageMetadata | undefined {
  const path = Object.keys(headFiles).find((p) => p.includes(`/heads/${slug}.`));
  return path ? headFiles[path]!.default : undefined;
}

export const shortName = (branch: Branch) => branch.name.replace('Crossmaze – ', '');

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
