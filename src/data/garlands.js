// ---------------------------------------------------------------------------
// SAMPLE GARLAND DATA
// ---------------------------------------------------------------------------
// This is placeholder/sample data for Phase 1. In a later phase this file
// will be replaced by data fetched from an API/backend — the shape of each
// garland object below is the "contract" that GarlandCard, the Collection
// page and the Details page all rely on, so a future data source only needs
// to return objects in this same shape for the UI to keep working unchanged.
//
// IMAGES: swap the paths below for real product photography later. Every
// image currently lives in /public/images/ — drop new files in that same
// folder (or a subfolder) and update the paths here. No other file needs to
// change.
// ---------------------------------------------------------------------------

const garlands = [
  {
    id: 1,
    slug: 'royal-rose-wedding-garland',
    name: 'Royal Rose Wedding Garland',
    category: 'Wedding',
    price: 2499,
    shortDescription: 'A lush, ceremonial garland of deep red roses layered with fragrant jasmine.',
    description:
      'The Royal Rose Wedding Garland is hand-strung with premium long-stem roses and threaded jasmine buds, designed for the varmala ceremony and other centerpiece wedding moments. Each strand is finished with a silk tassel and gold thread wrap, giving it a couture, heirloom quality that photographs beautifully.',
    flowers: ['Red Rose', 'Jasmine', 'Silk Thread Tassel'],
    sizes: ['Medium (36")', 'Large (42")', 'Bridal (48")'],
    customization: true,
    customizationNote: 'Flower ratio, tassel colour and length can be tailored to your ceremony.',
    delivery: 'Available in selected locations, 24-hour advance order recommended.',
    images: [
      '/images/royal-rose-main.jpg',
      '/images/royal-rose-alt.jpg',
      '/images/royal-rose-strand.jpg',
    ],
  },
  {
    id: 2,
    slug: 'premium-white-jasmine-garland',
    name: 'Premium White Jasmine Garland',
    category: 'Traditional',
    price: 1299,
    shortDescription: 'Delicate, fragrant jasmine strung close for a soft, luminous finish.',
    description:
      'Our Premium White Jasmine Garland is composed entirely of fresh, tightly-budded jasmine for a fragrance-forward, minimal aesthetic. A favourite for engagements, poojas and everyday elegance, it pairs beautifully with both traditional and contemporary attire.',
    flowers: ['Jasmine'],
    sizes: ['Small (24")', 'Medium (36")', 'Large (42")'],
    customization: true,
    customizationNote: 'Available with a thin gold trim on request.',
    delivery: 'Available in selected locations, same-day delivery where possible.',
    images: [
      '/images/white-jasmine-main.svg',
      '/images/white-jasmine-alt.svg',
      '/images/white-jasmine-strand.svg',
    ],
  },
  {
    id: 3,
    slug: 'traditional-red-rose-garland',
    name: 'Traditional Red Rose Garland',
    category: 'Traditional',
    price: 1799,
    shortDescription: 'A classic, full-bodied red rose garland for ceremonies and celebrations.',
    description:
      'A timeless choice for pooja ceremonies, felicitations and traditional functions, the Traditional Red Rose Garland is generously packed with fresh red roses for a rich, saturated look. Finished simply, letting the flowers themselves take centre stage.',
    flowers: ['Red Rose'],
    sizes: ['Medium (36")', 'Large (42")'],
    customization: false,
    customizationNote: 'This design is offered as-is to preserve its classic silhouette.',
    delivery: 'Available in selected locations.',
    images: [
      '/images/traditional-red-main.svg',
      '/images/traditional-red-alt.svg',
      '/images/traditional-red-strand.svg',
    ],
  },
  {
    id: 4,
    slug: 'white-and-pink-wedding-garland',
    name: 'White & Pink Wedding Garland',
    category: 'Wedding',
    price: 2199,
    shortDescription: 'A romantic blend of blush roses and white blooms for modern weddings.',
    description:
      'Designed for the modern couple, the White & Pink Wedding Garland combines soft blush roses with white seasonal blooms for a light, romantic palette. It suits both indoor and outdoor wedding settings and pairs elegantly with pastel or ivory outfits.',
    flowers: ['Blush Rose', 'White Chrysanthemum', 'Jasmine'],
    sizes: ['Medium (36")', 'Large (42")', 'Bridal (48")'],
    customization: true,
    customizationNote: 'Colour ratio of blush-to-white blooms can be adjusted.',
    delivery: 'Available in selected locations, 24-hour advance order recommended.',
    images: [
      '/images/white-pink-main.svg',
      '/images/white-pink-alt.svg',
      '/images/white-pink-strand.svg',
    ],
  },
  {
    id: 5,
    slug: 'luxury-orchid-garland',
    name: 'Luxury Orchid Garland',
    category: 'Luxury',
    price: 3499,
    shortDescription: 'An editorial, statement garland strung with premium orchid blooms.',
    description:
      'For clients seeking something distinctive, the Luxury Orchid Garland features imported orchid blooms individually wired and strung for a striking, sculptural silhouette. This is our most premium offering, suited to milestone celebrations and luxury events.',
    flowers: ['Orchid', 'Eucalyptus Accent'],
    sizes: ['Medium (36")', 'Large (42")'],
    customization: true,
    customizationNote: 'Orchid colour (purple, white or blush) can be selected at order time.',
    delivery: 'Available in selected locations, 48-hour advance order required.',
    images: [
      '/images/luxury-orchid-main.svg',
      '/images/luxury-orchid-alt.svg',
      '/images/luxury-orchid-strand.svg',
    ],
  },
  {
    id: 6,
    slug: 'classic-jasmine-garland',
    name: 'Classic Jasmine Garland',
    category: 'Everyday',
    price: 899,
    shortDescription: 'A simple, everyday jasmine garland for gifting and daily rituals.',
    description:
      'The Classic Jasmine Garland is our most accessible offering, ideal for daily rituals, small gifting occasions and everyday elegance. Fresh jasmine, simply strung, with the same care and quality as our larger ceremonial pieces.',
    flowers: ['Jasmine'],
    sizes: ['Small (24")', 'Medium (36")'],
    customization: false,
    customizationNote: 'Offered in a fixed, classic length for daily use.',
    delivery: 'Available in selected locations, same-day delivery where possible.',
    images: [
      '/images/classic-jasmine-main.svg',
      '/images/classic-jasmine-alt.svg',
      '/images/classic-jasmine-strand.svg',
    ],
  },
];

export default garlands;

export function getGarlandBySlug(slug) {
  return garlands.find((g) => g.slug === slug);
}

export function getFeaturedGarlands(count = 3) {
  return garlands.slice(0, count);
}
