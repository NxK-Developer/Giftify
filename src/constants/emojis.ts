/** Curated emoji picker data — lightweight, no external assets. */

export interface EmojiCategory {
  id: string
  label: string
  icon: string
  emojis: string[]
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'hearts',
    label: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💖', '💗', '💓',
      '💞', '💕', '💘', '💝', '♥️', '💟', '❣️', '💔', '🫶', '🩷', '🩵', '🩶',
    ],
  },
  {
    id: 'faces',
    label: 'Faces',
    icon: '😊',
    emojis: [
      '😊', '😄', '😁', '🥰', '😍', '😘', '😜', '🤗', '🤭', '😌', '🙂', '😉',
      '😎', '🥳', '😭', '🥺', '😳', '😴', '🤩', '😇', '🫠', '🤔', '😏', '🙃',
    ],
  },
  {
    id: 'celebration',
    label: 'Party',
    icon: '🎉',
    emojis: [
      '🎉', '🎊', '🎂', '🍰', '🧁', '🎁', '🎈', '🪅', '✨', '🌟', '💫', '⭐',
      '🏆', '🥇', '🎆', '🎇', '🪔', '🥂', '🍾', '🎵', '🎶', '👏', '🙌', '🫧',
    ],
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: '🌸',
    emojis: [
      '🌸', '🌹', '🌺', '🌻', '🌷', '💐', '🌼', '🪷', '🍃', '🌿', '🍀', '🌙',
      '☀️', '🌈', '⛅', '🌤️', '🔥', '💧', '❄️', '🦋', '🕊️', '🌌', '💥', '🫶',
    ],
  },
  {
    id: 'gestures',
    label: 'Gestures',
    icon: '🙏',
    emojis: [
      '🙏', '🤝', '👍', '👌', '✌️', '🤞', '💪', '👋', '🫰', '🤟', '💑', '👩‍❤️‍👨',
      '🧑‍🤝‍🧑', '👯', '🫂', '💌', '✍️', '📬', '🔒', '🕰️', '⏳', '📅', '🎯', '🚀',
    ],
  },
]

export const QUICK_EMOJIS = ['❤️', '✨', '🎉', '🎂', '🌸', '💖', '🥳', '🙏', '💫', '🌹', '🤗', '🪔']
