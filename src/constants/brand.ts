/** NxK Developer brand identity constants — used consistently, never excessively. */

export const BRAND = {
  name: 'NxK Developer',
  app: 'NxK Greetings',
  monogram: 'NxK',
  founder: 'Nishant Singh',
  coFounder: 'Khushi',
  tagline: 'Cinematic Personalized Greetings',
  heroTitle: 'Make Someone’s Day Special ✨',
  heroSubtitle: 'Create a beautiful personalized greeting they will never forget.',
  version: '1.0.0',
} as const

export const CREDIT_LINES = [
  `Created with ${BRAND.name}`,
  `Founder — ${BRAND.founder}`,
  `Co-Founder — ${BRAND.coFounder}`,
] as const
