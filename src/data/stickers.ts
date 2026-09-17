export interface PremadeSticker {
  id: string;
  name: string;
  url: string;
  category: 'love' | 'hugs' | 'cute' | 'reactions';
}

export const PREMADE_GIFS_AND_STICKERS: PremadeSticker[] = [
  {
    id: 'gif-1',
    name: 'Blowing Kisses 💕',
    url: 'https://i.giphy.com/M90mJvfWfd5mbUuULX.webp',
    category: 'love'
  },
  {
    id: 'gif-2',
    name: 'Sweet Hug 🧸',
    url: 'https://i.giphy.com/PHZ7v9tfQu0o0.webp',
    category: 'hugs'
  },
  {
    id: 'gif-3',
    name: 'Love Attack 💖',
    url: 'https://i.giphy.com/vFKqnCdLPNOKc.webp',
    category: 'love'
  },
  {
    id: 'gif-4',
    name: 'Cutie Dance 🌸',
    url: 'https://i.giphy.com/MDJ9IbxxvDUQM.webp',
    category: 'cute'
  },
  {
    id: 'gif-5',
    name: 'Heart Eyes ✨',
    url: 'https://i.giphy.com/c76IJLufpNwSULPk77.webp',
    category: 'love'
  },
  {
    id: 'gif-6',
    name: 'Warm Squeeze 🤍',
    url: 'https://i.giphy.com/11sBLVxNs7v6WA.webp',
    category: 'hugs'
  },
  {
    id: 'gif-7',
    name: 'Happy Wiggle 🎉',
    url: 'https://i.giphy.com/3o7TKoWXm3okO1kgHC.webp',
    category: 'reactions'
  },
  {
    id: 'gif-8',
    name: 'Giggle Cute 🥺',
    url: 'https://i.giphy.com/xT0xeJpnrWC4XWblEk.webp',
    category: 'cute'
  },
  {
    id: 'gif-9',
    name: 'Sleeping Cuddle 🌙',
    url: 'https://i.giphy.com/3ohzdIuqJoo8QdKlnW.webp',
    category: 'hugs'
  },
  {
    id: 'gif-10',
    name: 'Excited Bounce 🍓',
    url: 'https://i.giphy.com/3oEjHV0z8S7WM4MwnK.webp',
    category: 'reactions'
  },
  {
    id: 'gif-11',
    name: 'Blush & Smile 🌷',
    url: 'https://i.giphy.com/l0MYt5jPR6QX5pnqM.webp',
    category: 'love'
  },
  {
    id: 'gif-12',
    name: 'Celebration 🥂',
    url: 'https://i.giphy.com/26AHPxxnSw1L9T1rW.webp',
    category: 'reactions'
  }
];
