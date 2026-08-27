// ---------------------------------------------------------------------------
// SITE CONFIGURATION
// ---------------------------------------------------------------------------
// Edit the values below to update business details across the entire site.
// Nothing else in the codebase should hard-code the phone number or business
// name — everything reads from here.
// ---------------------------------------------------------------------------

const siteConfig = {
  // TODO (Business owner / later phase): replace with the real business name.
  businessName: 'BloomAura',

  tagline: 'Handcrafted Garlands for Life\u2019s Most Beautiful Moments',

  // TODO (PLACEHOLDER): replace with the real business phone number.
  // Keep phoneDisplay and phoneDial in sync — phoneDial must be digits only
  // (with a leading +country code) so the "tel:" links work correctly.
  phoneDisplay: '+91 98765 43210',
  phoneDial: '+919876543210',

  // TODO (PLACEHOLDER): replace with the real business WhatsApp number.
  // Often the same number as phoneDial for a small business, but kept as
  // its own value in case the owner ever uses a separate WhatsApp-only
  // number. whatsappDial should be digits only, with country code, no "+".
  whatsappDisplay: '+91 98765 43210',
  whatsappDial: '919876543210',

  // TODO (PLACEHOLDER): replace with the real business address.
  address: 'Shop No. 4, Green Avenue Market, Nagpur, Maharashtra, India',

  // TODO (PLACEHOLDER): replace with real business hours.
  hours: [
    { day: 'Monday \u2013 Saturday', time: '9:00 AM \u2013 8:00 PM' },
    { day: 'Sunday', time: '10:00 AM \u2013 5:00 PM' },
  ],

  email: 'hello@bloomaura.example',

  socials: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
  },
};

export default siteConfig;
