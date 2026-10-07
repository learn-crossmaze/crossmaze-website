// Open positions shown on /careers, as listed on the original crossmaze.in careers page.
// Remove an entry to close a role.

export interface Responsibility {
  title?: string;
  text: string;
}

export interface Job {
  slug: string;
  title: string;
  qualification: string;
  experience: string;
  timings: string[];
  ageLimit?: string;
  overview: string;
  responsibilities: Responsibility[];
  extra?: { title: string; text: string };
}

const overview =
  'We are seeking female graduates with a warm personality, abundant energy, and a passion for nurturing young children in a fast-growing organisation.';

export const jobs: Job[] = [
  {
    slug: 'teacher-facilitator',
    title: 'Teacher / Facilitator',
    qualification:
      'Graduation, with specialised certification in early childhood education, such as NTT, Montessori, ECE or CIDTT.',
    experience: '6+ months of teaching experience',
    timings: ['8:30 am – 3:30 pm'],
    overview,
    responsibilities: [
      { text: 'Develop and implement engaging, developmentally appropriate lesson plans and activities that support the social, emotional, cognitive and physical growth of preschool children.' },
      { text: 'Create a warm and inclusive classroom where every child feels valued, supported and encouraged to explore and learn.' },
      { text: 'Build positive relationships with students, parents and colleagues through open communication, collaboration and mutual respect.' },
      { text: 'Assess children’s progress and development, and share findings with parents and caregivers in a timely, constructive way.' },
      { text: 'Maintain accurate records of attendance, observations and assessments, and use them to individualise learning.' },
      { text: 'Take part in professional development, staff meetings and parent-teacher conferences.' },
    ],
  },
  {
    slug: 'day-care-in-charge',
    title: 'Day Care In-Charge',
    qualification:
      'Graduation and training in Early Childhood Education or a related field, with strong knowledge of child development, excellent communication and interpersonal skills, leadership ability, and flexibility.',
    experience: '6+ months of day care management experience',
    timings: ['Full day: 9:00 am – 6:00 pm', 'Half day: 11:00 am – 6:00 pm'],
    overview,
    responsibilities: [
      { title: 'Daily operations', text: 'Manage the day care’s daily operations, ensuring a safe, nurturing and stimulating environment for children.' },
      { title: 'Staff supervision', text: 'Lead and guide teachers, assistants and support staff to uphold the highest standards of care and professionalism.' },
      { title: 'Parent communication', text: 'Keep open, transparent communication with parents, with regular updates on their child’s progress.' },
      { title: 'Training and development', text: 'Coordinate staff training sessions, workshops and professional development.' },
      { title: 'Emergency preparedness', text: 'Develop and implement emergency procedures to keep children and staff safe.' },
      { title: 'Quality assurance', text: 'Regularly evaluate operations, programs and staff performance to keep improving the quality of care.' },
      { title: 'Community outreach', text: 'Represent the day care in the community and build relationships with local organisations.' },
    ],
  },
  {
    slug: 'center-head',
    title: 'Center Head / Center Director',
    qualification:
      'At least 1 year of administrative experience, strong organisational skills, proficiency in Microsoft Office, excellent communication, problem-solving ability and a commitment to confidentiality. A Master’s degree is preferred but not mandatory.',
    experience: '1+ year as Center Head',
    timings: ['8:30 am – 5:00 pm'],
    ageLimit: '25 – 45 years',
    overview:
      'We are seeking a meticulous and organised female individual to join our team as Center Head. You will provide comprehensive administrative support for the efficient operation of the centre, with excellent communication, multitasking and attention to detail.',
    responsibilities: [
      { text: 'Provide administrative support, including managing calls, emails and correspondence.' },
      { text: 'Maintain accurate, confidential student records in line with data protection rules.' },
      { text: 'Schedule and coordinate meetings, workshops and events, and prepare their materials.' },
      { text: 'Manage inventory and procurement of office supplies.' },
      { text: 'Support recruitment and onboarding of new staff.' },
      { text: 'Liaise with external vendors and service providers.' },
      { text: 'Assist with financial tasks such as processing invoices and monitoring expenses.' },
      { text: 'Help develop and implement administrative policies and procedures.' },
    ],
    extra: {
      title: 'Leadership skills',
      text: 'Setting vision and goals, building and motivating teams, effective communication, problem-solving and decision-making, and continuous improvement.',
    },
  },
];

export const perks = [
  { icon: 'Heart', title: 'An ideal workplace for women', text: 'Equal opportunities and a culture of respect and inclusivity.' },
  { icon: 'Award', title: 'Career advancement', text: 'Real support to grow, from facilitator to centre leadership.' },
  { icon: 'Clock', title: 'Work-life balance', text: 'Flexible work arrangements, including full-day and half-day roles.' },
  { icon: 'Baby', title: 'Childcare assistance', text: 'Benefits that support working mothers.' },
];
