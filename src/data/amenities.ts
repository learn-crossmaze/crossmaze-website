// Amenities a branch can tick in the admin panel. Keys are stored in content/branches.json.
export const amenityList: Record<string, { icon: string; label: string }> = {
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
};

// Icons offered in the admin panel's icon pickers (lucide.dev icon names).
export const iconChoices = [
  'Award', 'Baby', 'BedDouble', 'Blocks', 'BookOpen', 'Brain', 'Building2', 'Bus', 'Cctv', 'Check', 'Clock',
  'Eye', 'Flame', 'GraduationCap', 'HandHeart', 'Heart', 'Lightbulb', 'MapPin', 'Music', 'Palette', 'Phone',
  'Puzzle', 'Shapes', 'ShieldCheck', 'Smartphone', 'Smile', 'Sparkles', 'Sprout', 'Star', 'Sun', 'Trees',
  'Users', 'Utensils', 'Bike', 'Camera', 'Carrot', 'Dumbbell', 'Gift', 'Globe', 'Leaf', 'Medal', 'Mic',
  'Paintbrush', 'Pencil', 'Rocket', 'Rainbow', 'School', 'Shirt', 'Stethoscope', 'Theater', 'Trophy', 'Wifi',
];
