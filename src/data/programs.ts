// Programs offered across Crossmaze branches. Text follows the original crossmaze.in program pages.
// `icon` is a lucide-static icon name (https://lucide.dev/icons).
import type { ImageMetadata } from 'astro';
import playArea from '../assets/photos/play-area.jpg';
import classTable from '../assets/photos/class-table.jpg';
import teacherFlashcards from '../assets/photos/teacher-flashcards.jpg';
import yoga from '../assets/photos/yoga.jpg';
import napRoom from '../assets/photos/nap-room.jpg';

export interface Program {
  slug: string;
  name: string;
  ages: string;
  icon: string;
  color: 'sun' | 'coral' | 'green' | 'sky' | 'navy';
  timing: string;
  headline: string;
  summary: string;
  paragraphs: string[];
  focusTitle: string;
  focus: string[];
  photo: ImageMetadata;
  photoAlt: string;
}

export const programs: Program[] = [
  {
    slug: 'play-group',
    name: 'Play Group',
    ages: '2 – 3 years',
    icon: 'Blocks',
    color: 'sun',
    timing: '9:00 am – 12:30 pm',
    headline: 'Where learning meets fun and friendship',
    summary: 'A joyful first journey of discovery: learning about the world, making friends and building social skills.',
    paragraphs: [
      'Playgroup is one of the most delightful ways for your child to begin a journey of discovery. It’s a place to learn about the world, cultivate friendships and hone essential social skills, and an enriching experience for parents, grandparents and caregivers too.',
      'Our Playgroup sessions nurture physical development, stimulate problem-solving, foster effective communication and encourage positive social interaction, with every moment packed with joy. Our qualified staff create a safe space where children aged 2 and above can explore, learn and play together.',
    ],
    focusTitle: 'What children build',
    focus: ['Physical development', 'Problem-solving', 'Communication', 'Sensory and social skills'],
    photo: playArea,
    photoAlt: 'Colourful indoor play area with rockers and a slide at a Crossmaze centre',
  },
  {
    slug: 'nursery',
    name: 'Nursery',
    ages: '3 – 4 years',
    icon: 'Sprout',
    color: 'green',
    timing: '9:00 am – 12:30 pm',
    headline: 'Where comfort and confidence flourish',
    summary: 'A second home where children build self-esteem, friendships and their first academic foundations.',
    paragraphs: [
      'Nursery is often a child’s first experience away from their parents, so we have crafted it to be a second home, full of materials that captivate, comfort and keep them secure.',
      'Here children discover themselves and build self-esteem: they understand the significance of their own name, the value of their belongings and the joy of friendship. Our Nursery program weaves academic foundations together with creativity and thematic exploration, setting the stage for future success. A strong start leads to a triumphant finish.',
    ],
    focusTitle: 'What children build',
    focus: ['Self-discovery and self-esteem', 'Effective communication', 'Early academic foundations', 'Creativity and thematic exploration'],
    photo: classTable,
    photoAlt: 'Children in Crossmaze uniforms working together at a classroom table',
  },
  {
    slug: 'junior-kg',
    name: 'Junior KG',
    ages: '4 – 5 years',
    icon: 'Puzzle',
    color: 'coral',
    timing: '9:00 am – 12:30 pm',
    headline: 'Nurturing holistic development',
    summary: 'Numeracy, literacy, fine motor skills, logical thinking and problem-solving, learnt together.',
    paragraphs: [
      'Junior KG is a pivotal phase where we embrace each child’s comprehensive development. Our curriculum focuses on the key areas that lay the foundation for a bright future: numeracy, literacy, fine motor skills, logical thinking and problem-solving.',
      'At this age children are refining their language and cognitive abilities and are eager to explore new languages, while a keen sense of numbers develops. Through engaging group activities our teachers build teamwork, participation, sharing and taking turns.',
    ],
    focusTitle: 'Focus areas',
    focus: ['Numeracy', 'Literacy', 'Fine motor skills', 'Logical thinking', 'Problem-solving'],
    photo: teacherFlashcards,
    photoAlt: 'A Crossmaze teacher showing a letter card to a group of children',
  },
  {
    slug: 'senior-kg',
    name: 'Senior KG',
    ages: '5 – 6 years',
    icon: 'GraduationCap',
    color: 'sky',
    timing: '9:00 am – 12:30 pm',
    headline: 'Preparing for school success',
    summary: 'A confident, seamless step into primary school, aligned with State, CBSE and ICSE boards.',
    paragraphs: [
      'At 5 to 6, we prepare your child for a seamless transition into school. A stimulating environment encourages them to explore language, mathematics, science, physical activity, music and art, so they grow competent and confident while staying compassionate and caring.',
      'Learning goes beyond language and writing: we place strong emphasis on cognitive development, communication and problem-solving, with extracurricular activities that let children express themselves. Our curriculum is aligned with the requirements of State, CBSE and ICSE boards, so children step into mainstream schools well prepared.',
    ],
    focusTitle: 'Focus areas',
    focus: ['Language and mathematics', 'Science and discovery', 'Music, art and movement', 'Aligned with State, CBSE and ICSE boards'],
    photo: yoga,
    photoAlt: 'Children doing a yoga pose together in a bright Crossmaze hall',
  },
  {
    slug: 'day-care',
    name: 'Day Care',
    ages: '2 – 8 years',
    icon: 'Sun',
    color: 'navy',
    timing: '9:00 am – 6:00 pm',
    headline: 'Day care and enrichment centre, where learning meets safety',
    summary: 'A nurturing, home-like full day with trained caregivers and a 1:6 adult-to-child ratio.',
    paragraphs: [
      'Our Day Care and Activity Centre is a unique haven where learning takes an unconventional yet captivating form. Dedicated, trained caretakers keep children safe at all times, giving working parents peace of mind while they pursue their careers.',
      'Day care is open to both Crossmaze students and children from other schools, with a smooth transition from preschool to end-of-day activities.',
    ],
    focusTitle: 'What’s included',
    focus: [
      'Live CCTV access for parents',
      'Collaborative parenting app',
      'Air-conditioned resting and indoor play areas',
      'A hygienic, professional and welcoming atmosphere',
      'Visiting instructors for art, craft, dance and more (additional charges may apply)',
      'Pick-up from the nearby drop point of other schools',
    ],
    photo: napRoom,
    photoAlt: 'Rows of child-sized nap cots in an air-conditioned Crossmaze sleeping room',
  },
];

export const daycareHighlights = [
  'Structured routines',
  'Designated nap rooms',
  'Expert and trained caregivers',
  'Live CCTV monitoring',
  'Parents communication app',
  '1:6 adult-to-child ratio',
];

export const approach = [
  {
    icon: 'Brain',
    title: 'Foundational Development Program',
    text: 'Goes beyond traditional preschool education, laying the groundwork for essential life skills and equipping children for the challenges of tomorrow’s world.',
  },
  {
    icon: 'Shapes',
    title: 'Montessori-based learning',
    text: 'A Montessori-based approach with hands-on materials, so children learn through their senses and build independence.',
  },
  {
    icon: 'BookOpen',
    title: 'Thematic curriculum',
    text: 'Each theme integrates cognitive, language, personal, social, emotional and physical development into one immersive experience.',
  },
  {
    icon: 'Eye',
    title: 'Visual, practical learning',
    text: 'Children under 5 have a strong visual understanding, so we teach practically. Visual learning is everlasting.',
  },
];

export const extracurricular = [
  { icon: 'Palette', label: 'Art and craft' },
  { icon: 'Music', label: 'Music and rhymes' },
  { icon: 'Smile', label: 'Dance and performance' },
  { icon: 'Sprout', label: 'Yoga and movement' },
  { icon: 'Award', label: 'Annual day and celebrations' },
  { icon: 'Trees', label: 'Indoor and outdoor play' },
];
