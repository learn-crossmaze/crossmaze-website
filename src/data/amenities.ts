// Amenities a branch can tick in the admin panel. Keys are stored in content/branches.json. `tone` is the
// accent colour of the icon's badge on the branch page (global.css .tone-*).
export const amenityList: Record<string, { icon: string; label: string; tone: 'sun' | 'coral' | 'green' | 'sky' | 'navy' }> = {
  fire: { icon: 'Flame', label: 'Fire safety', tone: 'coral' },
  infra: { icon: 'Baby', label: 'Child-friendly infrastructure', tone: 'sun' },
  classrooms: { icon: 'Building2', label: 'Age-appropriate classrooms', tone: 'sky' },
  cctv: { icon: 'Cctv', label: 'CCTV surveillance', tone: 'navy' },
  montessori: { icon: 'Shapes', label: 'Montessori area', tone: 'green' },
  indoorPlay: { icon: 'Blocks', label: 'Indoor play space', tone: 'sky' },
  outdoorPlay: { icon: 'Trees', label: 'Outdoor play area', tone: 'green' },
  pantry: { icon: 'Utensils', label: 'Dry pantry', tone: 'sun' },
  sleeping: { icon: 'BedDouble', label: 'Sleeping room', tone: 'navy' },
  app: { icon: 'Smartphone', label: 'Mobile app for parents', tone: 'coral' },
  transport: { icon: 'Bus', label: 'In-house transport', tone: 'sun' },
};

// Icons offered in the admin panel's icon pickers (lucide.dev icon names).
export const iconChoices = [
  'Award', 'Baby', 'BedDouble', 'Blocks', 'BookOpen', 'Brain', 'Building2', 'Bus', 'Cctv', 'Check', 'Clock',
  'Eye', 'Flame', 'GraduationCap', 'HandHeart', 'Heart', 'Lightbulb', 'MapPin', 'Music', 'Palette', 'Phone',
  'Puzzle', 'Shapes', 'ShieldCheck', 'Smartphone', 'Smile', 'Sparkles', 'Sprout', 'Star', 'Sun', 'Trees',
  'Users', 'Utensils', 'Bike', 'Camera', 'Carrot', 'Dumbbell', 'Gift', 'Globe', 'Leaf', 'Medal', 'Mic',
  'Paintbrush', 'Pencil', 'Rocket', 'Rainbow', 'School', 'Shirt', 'Stethoscope', 'Theater', 'Trophy', 'Wifi',
];
