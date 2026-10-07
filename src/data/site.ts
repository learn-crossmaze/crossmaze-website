// School-wide details used across every page.
// Edit here once and the header, footer, contact page and SEO tags all update.

export const site = {
  name: 'Crossmaze',
  fullName: 'Crossmaze Preschool and Day Care',
  legalName: 'Crossmaze Education India Pvt. Ltd.',
  tagline: 'Where little minds find their way',
  description:
    'Crossmaze Preschool and Day Care in Electronic City and Begur, Bengaluru. Montessori-based Play Group, Nursery, Junior KG, Senior KG and Day Care with live CCTV, transport and a parent app.',
  url: 'https://www.crossmaze.in',
  city: 'Bengaluru',

  phone: '+91 72599 21508',
  phoneHref: 'tel:+917259921508',
  whatsappHref: 'https://wa.me/917259921508',
  admissionsEmail: 'admission@crossmaze.in',
  adminEmail: 'admin@crossmaze.in',
  careersEmail: 'admin@crossmaze.in',

  founders: ['Manushree Chaturvedi', 'Abhishek Jain'],
  foundedYear: 2018,

  hours: {
    preschool: '9:00 am – 12:30 pm',
    daycare: '9:00 am – 6:00 pm',
  },

  social: [
    { label: 'Facebook', href: 'https://www.facebook.com/crossmaze.care/' },
    { label: 'Facebook – Neeladri', href: 'https://www.facebook.com/crossmaze.ecity/' },
  ],
} as const;

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Programs', href: '/our-programs' },
  { label: 'Branches', href: '/branch' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
] as const;
