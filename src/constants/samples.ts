import type { Greeting } from '@/types'

/**
 * High-quality sample greetings built from FICTIONAL data only.
 * Used by Demo Mode, the landing page preview and the /demo route.
 * They are always clearly labeled as samples — never presented as real
 * user data or as something that was "saved".
 */
export const SAMPLE_GREETINGS: Greeting[] = [
  {
    id: 'Aarav7X',
    ownerId: 'sample',
    occasion: 'birthday',
    templateId: 'birthday-cinematic',
    recipientName: 'Aarav',
    senderName: 'Your Best Friend',
    nickname: 'Aaru',
    relationship: 'Best Friend',
    specialDate: '',
    message:
      'Happy Birthday, Aarav! 🎂 From bunking classes to chasing big dreams — every story with you is my favorite one. May this year bring you closer to everything you deserve. The world got louder the day you showed up in it. ❤️✨',
    theme: 'galaxy',
    animation: 'code-intro',
    music: 'dreamy',
    privacy: 'unlisted',
    status: 'active',
    views: 0,
    shares: 0,
    scheduledAt: null,
    expiresAt: null,
    passwordHash: null,
    passwordSalt: null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    isDemo: true,
  },
  {
    id: 'Meera02',
    ownerId: 'sample',
    occasion: 'love',
    templateId: 'heart-reveal',
    recipientName: 'Meera',
    senderName: 'Someone Special',
    nickname: '',
    relationship: 'Partner',
    specialDate: '',
    message:
      'Meera, every particle on this screen found its way into a heart — the way every ordinary day of mine finds its way back to you. I love you, in every timeline. ❤️',
    theme: 'heart',
    animation: 'heart-formation',
    music: 'romantic',
    privacy: 'unlisted',
    status: 'active',
    views: 0,
    shares: 0,
    scheduledAt: null,
    expiresAt: null,
    passwordHash: null,
    passwordSalt: null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    isDemo: true,
  },
  {
    id: 'Kabir91',
    ownerId: 'sample',
    occasion: 'congratulations',
    templateId: 'congrats-rise',
    recipientName: 'Kabir',
    senderName: 'The Whole Team',
    nickname: '',
    relationship: 'Colleague',
    specialDate: '',
    message:
      'Kabir — you did it! 🏆 That promotion wasn’t luck, it was every late commit and every calm crisis you handled. The team is throwing confetti (digitally). Congratulations, superstar!',
    theme: 'celebration',
    animation: 'confetti-burst',
    music: 'celebration',
    privacy: 'unlisted',
    status: 'active',
    views: 0,
    shares: 0,
    scheduledAt: null,
    expiresAt: null,
    passwordHash: null,
    passwordSalt: null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    isDemo: true,
  },
]

export const PRIMARY_SAMPLE = SAMPLE_GREETINGS[0]!

export function getSampleGreeting(id: string): Greeting | undefined {
  return SAMPLE_GREETINGS.find((g) => g.id === id)
}
