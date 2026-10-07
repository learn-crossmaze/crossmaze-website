// Programs offered across Crossmaze branches.
// `icon` is a lucide-static icon name (https://lucide.dev/icons).

export interface Program {
  slug: string;
  name: string;
  ages: string;
  icon: string;
  color: 'sun' | 'coral' | 'teal' | 'sky' | 'plum';
  timing: string;
  summary: string;
  description: string;
  highlights: string[];
}

export const programs: Program[] = [
  {
    slug: 'play-group',
    name: 'Play Group',
    ages: '2 – 3 years',
    icon: 'Blocks',
    color: 'sun',
    timing: '9:00 am – 12:30 pm',
    summary: 'A gentle first step away from home, built around play, movement and making friends.',
    description:
      'Our Play Group sessions nurture physical development, spark problem-solving, build early communication and encourage positive social interaction. Qualified, caring staff create a safe space where two-year-olds can explore, learn and play together at their own pace.',
    highlights: [
      'Sensory and free-play corners',
      'Gross and fine motor activities',
      'Rhymes, stories and music',
      'Settling-in support for first-time separation',
    ],
  },
  {
    slug: 'nursery',
    name: 'Nursery',
    ages: '3 – 4 years',
    icon: 'Sprout',
    color: 'teal',
    timing: '9:00 am – 12:30 pm',
    summary: 'Early academic foundations woven together with creativity and themed exploration.',
    description:
      'The Nursery program blends early literacy and numeracy with art, music and themed exploration. Children begin to recognise letters, sounds, numbers and shapes through hands-on Montessori materials, while building confidence, independence and friendships.',
    highlights: [
      'Montessori practical-life and sensorial work',
      'Phonics readiness and early numeracy',
      'Theme-based weekly learning',
      'Art, craft and pretend play',
    ],
  },
  {
    slug: 'junior-kg',
    name: 'Junior KG',
    ages: '4 – 5 years',
    icon: 'Puzzle',
    color: 'coral',
    timing: '9:00 am – 12:30 pm',
    summary: 'Reading, writing and number sense, learnt by doing, asking and discovering.',
    description:
      'In Junior KG children move from recognising to using: blending sounds into words, writing letters with control, and working with numbers. A thematic curriculum connects language, maths, science and the world around them, so every concept is learnt in context.',
    highlights: [
      'Phonics, blending and early reading',
      'Pre-writing to letter formation',
      'Number operations with concrete materials',
      'Show-and-tell and confidence building',
    ],
  },
  {
    slug: 'senior-kg',
    name: 'Senior KG',
    ages: '5 – 6 years',
    icon: 'GraduationCap',
    color: 'sky',
    timing: '9:00 am – 12:30 pm',
    summary: 'Confident, curious and ready for Grade 1, academically and socially.',
    description:
      'Senior KG prepares children for a smooth move to primary school. Children read simple sentences, write independently, solve number problems and express their ideas clearly, while practical life skills like problem-solving, communication and collaboration grow alongside.',
    highlights: [
      'Independent reading and sentence writing',
      'Addition, subtraction, time and money',
      'Simple science and environment projects',
      'School-readiness and life skills',
    ],
  },
  {
    slug: 'day-care',
    name: 'Day Care',
    ages: '2 – 8 years',
    icon: 'Sun',
    color: 'plum',
    timing: '9:00 am – 6:00 pm',
    summary: 'A secure, homely full day for children of working parents, with naps, meals and play.',
    description:
      'Our in-house Day Care gives children a safe and nurturing place to spend the rest of their day. Air-conditioned sleeping rooms, supervised meals, homework help for older children and plenty of indoor play keep the day calm and happy, and parents can check in any time on live CCTV.',
    highlights: [
      'Air-conditioned sleeping rooms',
      'Supervised meals and snack time',
      'Homework support for school-goers',
      'Live CCTV access for parents',
    ],
  },
];

export const approach = [
  {
    icon: 'Brain',
    title: 'Foundational Development Program',
    text: 'Lays the groundwork for essential life skills such as problem-solving, communication and collaboration, preparing children for the challenges of tomorrow.',
  },
  {
    icon: 'Shapes',
    title: 'Montessori-based learning',
    text: 'Hands-on Montessori materials let children learn through their senses, follow their curiosity and build independence and concentration.',
  },
  {
    icon: 'BookOpen',
    title: 'Thematic curriculum',
    text: 'Every theme brings together cognitive, language, personal, social, emotional and physical development, so learning feels like one connected adventure.',
  },
  {
    icon: 'HandHeart',
    title: 'Values and manners',
    text: 'Academics and discipline are valued equally with culture, manners and behaviour, for the holistic growth of every child.',
  },
];

export const extracurricular = [
  { icon: 'Music', label: 'Music and rhythm' },
  { icon: 'Palette', label: 'Art and craft' },
  { icon: 'Trees', label: 'Outdoor and physical play' },
  { icon: 'Smile', label: 'Dance and movement' },
  { icon: 'Lightbulb', label: 'Brain development activities' },
  { icon: 'Award', label: 'Celebrations and events' },
];
