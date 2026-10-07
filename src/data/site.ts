// School-wide details used across every page.
// Edit here once and the header, footer, contact page and SEO tags all update.

export const site = {
  name: 'Crossmaze',
  fullName: 'Crossmaze Preschool and Day Care',
  legalName: 'Crossmaze Education India Pvt. Ltd.',
  tagline: 'A safe place to grow and learn',
  description:
    'Crossmaze Preschool and Day Care, Bengaluru: Montessori-based Play Group, Nursery, Junior KG, Senior KG and Day Care at five centres in Electronic City and Begur, with live CCTV, a parent app and in-house transport.',
  url: 'https://www.crossmaze.in',
  city: 'Bengaluru',

  phone: '+91 72040 21508',
  phoneHref: 'tel:+917204021508',
  whatsappHref: 'https://wa.me/917204021508',
  admissionsEmail: 'admission@crossmaze.in',
  careEmail: 'care@crossmaze.in',
  careersEmail: 'admin@crossmaze.in',
  address: [
    'Crossmaze Preschool and Day Care – The Hub',
    'In front of SNN Raj Serenity, Suraksha Nagar',
    'Yelenahalli, Begur, Bengaluru, Karnataka 560068',
  ],

  founders: ['Manushree Chaturvedi', 'Abhishek Jain'],
  foundedYear: 2018,

  hours: {
    preschool: '9:00 am – 12:30 pm',
    daycare: '9:00 am – 6:00 pm',
  },

  promise:
    'Crossmaze offers a secure, caring, and nurturing space for children to thrive and learn at their own pace. Our inclusive learning center is dedicated to fostering positive connections among children, parents, and staff. We are deeply committed to creating a safe and supportive environment where every child is cherished and respected.',

  about: [
    'Crossmaze is an interactive education place where children learn to excel along with the choice of their preferences. Children under the age of 5 have a strong visual understanding, so a practical approach suits them best, and visual learning is everlasting. We understand that each kid is special, and with a wide range of activities and learning material we lay a strong foundation for each child.',
    'Our learning and education program is designed to eliminate the achievement gap and encourage every student to become equally successful. Good pre-schooling is the first milestone in the development and growth of children, and a strong, positive self-image is the best possible preparation for success.',
    'At Crossmaze, activities are designed to give children opportunities to develop confidence and a positive image of themselves. Continuous motivation from teachers helps our students build a positive self-image, which in turn makes them confident individuals.',
  ],

  quote: {
    text: 'Good moral values are mostly molded from a place where love, faith and hope exist.',
    author: 'Arsenio V. Manalo Jr.',
  },

  stats: [
    { value: '1000+', label: 'happy children' },
    { value: '2000+', label: 'happy parents' },
    { value: '100+', label: 'passionate individuals' },
    { value: '6+ years', label: 'of childcare' },
  ],

  social: [
    { label: 'Facebook', href: 'https://www.facebook.com/crossmaze.care' },
    { label: 'Instagram', href: 'https://www.instagram.com/crossmaze.in/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/crossmaze-education/' },
  ],
} as const;

export const coreValues = [
  {
    icon: 'Users',
    title: 'Equality',
    text: 'We promote equality by embracing diversity and ensuring that every child feels valued and included, regardless of background or ability.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Integrity',
    text: 'We value transparency and ethical behaviour, fostering a culture of integrity in all interactions and communications.',
  },
  {
    icon: 'Award',
    title: 'Excellence',
    text: 'We are dedicated to a high-quality educational and nurturing environment, continually striving for improvement and innovation.',
  },
  {
    icon: 'Puzzle',
    title: 'Practical way',
    text: 'Our curriculum emphasises practical life skills such as problem-solving, communication and collaboration, preparing children for future challenges and successes.',
  },
  {
    icon: 'Star',
    title: 'Achieving targets',
    text: 'We set attainable goals for each child and work together to help them achieve them, celebrating both small and significant milestones.',
  },
  {
    icon: 'Lightbulb',
    title: 'Interactive education',
    text: 'We focus on interactive, hands-on educational methods that inspire curiosity and a love for learning in every child.',
  },
] as const;

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Programs', href: '/our-programs' },
  { label: 'Branches', href: '/branch' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
] as const;
