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
  phoneDisplay: '+91 80071 06430',
  phoneDial: '+918007106430',

  // TODO (PLACEHOLDER): replace with the real business WhatsApp number.
  // Often the same number as phoneDial for a small business, but kept as
  // its own value in case the owner ever uses a separate WhatsApp-only
  // number. whatsappDial should be digits only, with country code, no "+".
  whatsappDisplay: '+91 8007106430',
  whatsappDial: '918007106430',

  // TODO (PLACEHOLDER): replace with the real business address.
  address: ' Nagpur, Maharashtra, India',

  // TODO (PLACEHOLDER): replace with real business hours.
  hours: [
    { day: 'Monday – Sunday', time: '8:00 AM – 9:00 PM' },
  ],

  email: 'bloomaura01@gmail.com',


};

export default siteConfig;
