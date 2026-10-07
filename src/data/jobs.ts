// Open positions shown on /careers. Remove an entry to close a role.

export interface Job {
  slug: string;
  title: string;
  type: string;
  timings?: string[];
  experience?: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
}

export const jobs: Job[] = [
  {
    slug: 'teacher-facilitator',
    title: 'Teacher / Facilitator',
    type: 'Full time',
    summary:
      'Guide a small group of children through our Montessori-based, thematic curriculum, and help every child feel seen, safe and excited to learn.',
    responsibilities: [
      'Plan and deliver age-appropriate, theme-based lessons and activities',
      'Use Montessori materials to support hands-on, self-directed learning',
      'Observe, record and share each child’s progress with parents',
      'Keep the classroom safe, organised and welcoming',
      'Take part in events, celebrations and parent-teacher meetings',
    ],
    requirements: [
      'Graduate, with a certification in ECCE / Montessori / NTT or similar',
      'Good spoken and written English',
      'Patience, warmth and genuine love for young children',
      'Creativity in storytelling, art, music or movement is a plus',
    ],
  },
  {
    slug: 'day-care-in-charge',
    title: 'Day Care In-Charge',
    type: 'Full day or half day',
    timings: ['Full day: 9:00 am – 6:00 pm', 'Half day: 11:00 am – 6:00 pm'],
    experience: 'Minimum 6 months of day care management experience',
    summary:
      'Run the day-to-day of our day care so that children are cared for, engaged and safe, and parents always know how their child’s day went.',
    responsibilities: [
      'Oversee daily day care operations: meals, naps, play and hygiene',
      'Lead, schedule and support the day care staff',
      'Keep open, regular communication with parents on each child’s day',
      'Coordinate staff training and development',
      'Ensure safety, cleanliness and compliance at all times',
    ],
    requirements: [
      'Graduation, plus training in Early Childhood Education or a related field',
      'Prior experience in day care or early childhood education',
      'Strong understanding of child development',
      'Excellent communication and people skills, with leadership ability',
      'Flexible and adaptable to the needs of a busy centre',
    ],
  },
  {
    slug: 'center-head',
    title: 'Center Head',
    type: 'Full time',
    summary:
      'Lead a Crossmaze centre end to end: academics, operations, people and parent relationships.',
    responsibilities: [
      'Own the academic quality and daily operations of the centre',
      'Hire, mentor and lead teachers and support staff',
      'Handle admissions enquiries, centre visits and parent relationships',
      'Ensure safety, hygiene and compliance standards are met',
      'Plan events and drive the centre’s growth in the community',
    ],
    requirements: [
      'Graduate / postgraduate, with ECCE or education management training preferred',
      'Experience managing a preschool or day care centre',
      'Confident communicator with parents and staff',
      'Organised, hands-on and calm under pressure',
    ],
  },
];

export const perks = [
  { icon: 'Heart', title: 'A workplace built for women', text: 'Equal opportunities, respect and an inclusive culture, every single day.' },
  { icon: 'Award', title: 'Room to grow', text: 'Real support for career advancement, from facilitator to centre leadership.' },
  { icon: 'Clock', title: 'Flexible arrangements', text: 'Full-day and half-day roles that fit around your life.' },
  { icon: 'Sparkles', title: 'Training that matters', text: 'Regular training in Montessori methods and early childhood development.' },
];
