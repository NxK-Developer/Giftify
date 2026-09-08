import type { TemplateConfig, OccasionId } from '@/types'

/**
 * Configuration-driven template system.
 * Every template is pure data (id, name, occasion, theme, animation,
 * defaultText, music). Selecting a template pre-fills the wizard —
 * no template has its own hardcoded page anywhere in the app.
 */
export const TEMPLATES: TemplateConfig[] = [
  /* ----------------------------- Birthday ----------------------------- */
  {
    id: 'birthday-celebration',
    name: 'Birthday Celebration',
    description: 'Confetti cannons, party energy and pure joy',
    occasion: 'birthday',
    theme: 'celebration',
    animation: 'confetti-burst',
    music: 'celebration',
    accentEmoji: '🎉',
    defaultText: {
      headline: 'Happy Birthday!',
      message:
        'Today the whole universe throws you a party — confetti, cake and all. May this year bring you louder laughs, brighter wins and every little thing that makes you smile. 🎂✨',
    },
    featured: true,
  },
  {
    id: 'birthday-cinematic',
    name: 'Birthday Cinematic',
    description: 'A terminal boot sequence into a galaxy birthday surprise',
    occasion: 'birthday',
    theme: 'galaxy',
    animation: 'code-intro',
    music: 'dreamy',
    accentEmoji: '🎬',
    defaultText: {
      headline: 'A Surprise Is Loading…',
      message:
        'Somewhere between all the stars, one day was reserved just for you. Happy Birthday — may your year be as vast and brilliant as the night sky. 🌌🎂',
    },
    featured: true,
  },
  {
    id: 'birthday-surprise',
    name: 'Birthday Surprise',
    description: 'Particles gather into a heart before the big reveal',
    occasion: 'birthday',
    theme: 'heart',
    animation: 'heart-formation',
    music: 'dreamy',
    accentEmoji: '🎁',
    defaultText: {
      headline: 'You Have a Surprise!',
      message:
        'Every heart-shaped particle on this screen carried one wish for you: a birthday full of love, magic and everything you deserve. Happy Birthday! 🎁❤️',
    },
  },

  /* ------------------------------- Love ------------------------------- */
  {
    id: 'heart-reveal',
    name: 'Heart Reveal',
    description: 'The signature mathematical heart formation, then your words',
    occasion: 'love',
    theme: 'heart',
    animation: 'heart-formation',
    music: 'romantic',
    accentEmoji: '❤️',
    defaultText: {
      headline: 'Hey, You ❤️',
      message:
        'They say the heart is just a muscle. Then I met you, and mine learned to glow. This little universe of light? Every particle is a reason I adore you. ✨',
    },
    scriptStyle: true,
    featured: true,
  },
  {
    id: 'romantic-night',
    name: 'Romantic Night',
    description: 'Starlight, nebulae and a love letter in the galaxy',
    occasion: 'love',
    theme: 'galaxy',
    animation: 'code-intro',
    music: 'romantic',
    accentEmoji: '🌙',
    defaultText: {
      headline: 'Under the Same Sky',
      message:
        'I asked the night sky to hold a message for you. It scattered it across a thousand stars — because one star could never carry how much you mean to me. 🌙💫',
    },
    scriptStyle: true,
    featured: true,
  },
  {
    id: 'love-letter',
    name: 'Love Letter',
    description: 'Petals drift as an elegant handwritten-style letter unfolds',
    occasion: 'love',
    theme: 'blossom',
    animation: 'petal-bloom',
    music: 'romantic',
    accentEmoji: '💌',
    defaultText: {
      headline: 'A Letter For You',
      message:
        'Dear you — if I could gather every petal that ever fell in spring, I would still run out before I ran out of things I love about you. Yours, always. 🌸💌',
    },
    scriptStyle: true,
  },

  /* ---------------------------- Friendship ---------------------------- */
  {
    id: 'best-friend',
    name: 'Best Friend',
    description: 'High-energy confetti for your partner in crime',
    occasion: 'friendship',
    theme: 'celebration',
    animation: 'confetti-burst',
    music: 'celebration',
    accentEmoji: '🤝',
    defaultText: {
      headline: 'To My Favorite Human',
      message:
        'Through every plot twist, bad joke and 2 AM conversation — you stayed. This confetti is small compared to how big your friendship feels. 🎊🤝',
    },
    featured: true,
  },
  {
    id: 'forever-friend',
    name: 'Forever Friend',
    description: 'A calm starfield for a friendship that outlasts distance',
    occasion: 'friendship',
    theme: 'galaxy',
    animation: 'classic-reveal',
    music: 'calm',
    accentEmoji: '💫',
    defaultText: {
      headline: 'Side by Side or Miles Apart',
      message:
        'Some friendships are quiet like starlight — you don’t always see them, but they never stop shining. Thank you for being my constant. 💫',
    },
  },

  /* ------------------------ Special / Secret -------------------------- */
  {
    id: 'secret-message',
    name: 'Secret Message',
    description: 'Digital rain decodes into a message only they will see',
    occasion: 'special',
    theme: 'matrix',
    animation: 'digital-rain',
    music: 'none',
    accentEmoji: '🤫',
    defaultText: {
      headline: 'Classified: For Your Eyes Only',
      message:
        'This message traveled through a thousand lines of falling code to reach exactly one person — you. Whatever happens next, remember: someone out there is quietly rooting for you. 🟩',
    },
  },
  {
    id: 'emotional-message',
    name: 'Emotional Message',
    description: 'Minimal, elegant and heartfelt — no noise, just feelings',
    occasion: 'special',
    theme: 'minimal',
    animation: 'classic-reveal',
    music: 'emotional',
    accentEmoji: '🕊️',
    defaultText: {
      headline: 'Something I Needed to Say',
      message:
        'I don’t always find the right words, but today I found the right silence — the kind where feelings speak for themselves. You matter to me, more than this screen could ever show. 🕊️',
    },
  },
  {
    id: 'just-because',
    name: 'Just Because',
    description: 'No occasion needed — a surprise for absolutely no reason',
    occasion: 'custom',
    theme: 'sunset',
    animation: 'petal-bloom',
    music: 'calm',
    accentEmoji: '🎨',
    defaultText: {
      headline: 'For No Reason At All',
      message:
        'You don’t need a festival, a birthday or an anniversary to be celebrated. You being you is reason enough. This one’s just because. 🌇✨',
    },
  },

  /* --------------------------- Thank You ------------------------------ */
  {
    id: 'thank-you-classic',
    name: 'Thank You Classic',
    description: 'Soft blossoms and warm gratitude',
    occasion: 'thankyou',
    theme: 'blossom',
    animation: 'petal-bloom',
    music: 'calm',
    accentEmoji: '🙏',
    defaultText: {
      headline: 'Thank You',
      message:
        'Gratitude looks better in bloom. Thank you for the kindness you didn’t have to show, and the time you didn’t have to give. 🌸🙏',
    },
    featured: true,
  },

  /* ------------------------- Congratulations -------------------------- */
  {
    id: 'congrats-rise',
    name: 'Golden Rise',
    description: 'Sunset gold and confetti for their big moment',
    occasion: 'congratulations',
    theme: 'sunset',
    animation: 'confetti-burst',
    music: 'celebration',
    accentEmoji: '🏆',
    defaultText: {
      headline: 'You Did It!',
      message:
        'Every late night, every doubt you outworked — it led here. Congratulations! May this win be the first of a very long highlight reel. 🏆🌅',
    },
    featured: true,
  },

  /* ---------------------------- Anniversary --------------------------- */
  {
    id: 'forever-us',
    name: 'Forever Us',
    description: 'Two hearts, one sky — an anniversary in starlight',
    occasion: 'anniversary',
    theme: 'galaxy',
    animation: 'heart-formation',
    music: 'romantic',
    accentEmoji: '💞',
    defaultText: {
      headline: 'Another Year of Us',
      message:
        'We’ve collected moments like other people collect things — laughter, fights we survived, sunsets we shared. Here’s to every chapter so far, and all the ones still unwritten. 💞✨',
    },
    scriptStyle: true,
  },

  /* ------------------------------- Sorry ------------------------------ */
  {
    id: 'mend-a-heart',
    name: 'Mend a Heart',
    description: 'Gentle light and honest words, softly delivered',
    occasion: 'sorry',
    theme: 'minimal',
    animation: 'classic-reveal',
    music: 'emotional',
    accentEmoji: '🥺',
    defaultText: {
      headline: 'I’m Sorry',
      message:
        'I thought about the right words for a long time. There aren’t any perfect ones — only honest ones: I was wrong, you matter, and I’ll do better. 🥺💙',
    },
  },

  /* --------------------------- Good Morning --------------------------- */
  {
    id: 'morning-glow',
    name: 'Morning Glow',
    description: 'Sunrise warmth to start their day right',
    occasion: 'good-morning',
    theme: 'sunset',
    animation: 'classic-reveal',
    music: 'calm',
    accentEmoji: '🌅',
    defaultText: {
      headline: 'Good Morning!',
      message:
        'The sun came up today and somehow it still didn’t outshine you. May your coffee be strong, your commute be short and your day be kind. ☀️🌅',
    },
  },

  /* ---------------------------- Good Night ---------------------------- */
  {
    id: 'starlit-night',
    name: 'Starlit Night',
    description: 'A quiet galaxy to wish them sweet dreams',
    occasion: 'good-night',
    theme: 'galaxy',
    animation: 'classic-reveal',
    music: 'dreamy',
    accentEmoji: '🌙',
    defaultText: {
      headline: 'Good Night',
      message:
        'I hung a few extra stars in the sky tonight, just in case you needed a nightlight. Sleep well — the world will still be lucky to have you tomorrow. 🌙✨',
    },
  },

  /* ------------------------------ Festival ---------------------------- */
  {
    id: 'festive-sparkle',
    name: 'Festive Sparkle',
    description: 'Lights, sparkle and celebration for any festival',
    occasion: 'festival',
    theme: 'celebration',
    animation: 'confetti-burst',
    music: 'celebration',
    accentEmoji: '🪔',
    defaultText: {
      headline: 'Happy Festive Season!',
      message:
        'May your home glow with lights, your table overflow with sweets, and your heart overflow with the people you love. Wishing you a celebration as colorful as you are. 🪔🎆',
    },
  },
]

export const TEMPLATE_MAP: Record<string, TemplateConfig> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t]),
)

export function getTemplate(id: string | undefined | null): TemplateConfig | undefined {
  return id ? TEMPLATE_MAP[id] : undefined
}

export function getTemplatesForOccasion(occasion: OccasionId | null): TemplateConfig[] {
  if (!occasion) return TEMPLATES
  const matching = TEMPLATES.filter((t) => t.occasion === occasion)
  return matching.length > 0 ? matching : TEMPLATES
}

/** Default template per occasion — used when a user skips manual selection. */
export const DEFAULT_TEMPLATE_FOR_OCCASION: Record<OccasionId, string> = {
  birthday: 'birthday-celebration',
  love: 'heart-reveal',
  friendship: 'best-friend',
  congratulations: 'congrats-rise',
  anniversary: 'forever-us',
  thankyou: 'thank-you-classic',
  sorry: 'mend-a-heart',
  'good-morning': 'morning-glow',
  'good-night': 'starlit-night',
  special: 'secret-message',
  festival: 'festive-sparkle',
  custom: 'just-because',
}
