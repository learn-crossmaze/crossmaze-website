// Parent testimonials shown on the home page, as published on the original crossmaze.in.
// The section hides itself if this list is empty.

export interface Testimonial {
  quote: string;
  name: string;
  detail: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      'Great and best Montessori school in Electronic City. I wish to continue here if they come up with classes from 1st std onward too. Kids who learn here are learning more advanced compared to other schools. Very happy with the curriculum they are following.',
    name: 'Manju & Lata',
    detail: 'Parents of Drishaal',
  },
  {
    quote:
      'It’s a moment of pure ecstasy and satisfaction when you see your child growing in an environment which is caring, stimulating and feels right when you enter the door. Crossmaze is a perfect fit for our family, with great teachers and staff.',
    name: 'Sunakshi & Gautam',
    detail: 'Parents of Shanaya',
  },
  {
    quote:
      'Crossmaze has made my daughter more confident with colors, numbers, words and shapes & many more. In fact she started singing many rhymes, whatever she learns from her school. It gives me immense pleasure that actually my baby is growing now. I’m really happy with all the staff in the school. Thank you for your fab input into my daughter. I recommend this school to everyone I see.',
    name: 'Smruti & Satya',
    detail: 'Parents of Divyanshi',
  },
  {
    quote:
      'Happy to share that I see a lot of new things which my son has learnt in such a short span of time. I am impressed with the progress we have seen so far. Thanks very much Crossmaze for all your efforts and innovative means and methodology that are applied in teaching.',
    name: 'Preetham & Niranjan',
    detail: 'Parents of Reyansh',
  },
  {
    quote:
      'This is one of the best preschools and day cares which I have come across. I love the way they teach in school and online as well. My kid misses school a lot, he loves going to Crossmaze school. Whole staff and principal are good and very supportive. Kudos to the whole team. I am happy that my kid is part of this school.',
    name: 'Smitha & Suresha',
    detail: 'Parents of Manaswin',
  },
  {
    quote:
      'We are so happy because the decision which we have taken for our little prince is the right one. As a mother I felt a little bit scared and tense about his new environment, but the caring and learning methods which they have adopted are so good, and he is happy and easily adjusted to the environment. He feels a homely atmosphere.',
    name: 'Salini & Sajeev',
    detail: 'Parents of Kanishk S',
  },
];
