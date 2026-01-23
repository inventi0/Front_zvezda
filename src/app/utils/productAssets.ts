// Utility to map product slugs to image and icon paths
import steamImage from '@/app/assets/images/steam_image.jpg';
import telegramImage from '@/app/assets/images/telegram_image.jpg';
import playstationImage from '@/app/assets/images/playstation_image.jpg';
import xboxImage from '@/app/assets/images/xbox_image.jpg';
import fortniteImage from '@/app/assets/images/fortnite_image.jpg';
import genshinImage from '@/app/assets/images/Genshin_impact_image.jpg';
import robloxImage from '@/app/assets/images/Roblox_image.jpg';
import valorantImage from '@/app/assets/images/valorant_image.jpg';
import netflixImage from '@/app/assets/images/Netflix_image.jpg';
import spotifyImage from '@/app/assets/images/spotify_image.jpg';
import googleImage from '@/app/assets/images/Google_play_image.jpg';
import appleImage from '@/app/assets/images/apple_image.jpg';

import steamLogo from '@/app/assets/icons/steam.svg';
import telegramLogo from '@/app/assets/icons/telegram.svg';
import playstationLogo from '@/app/assets/icons/playstation.svg';
import xboxLogo from '@/app/assets/icons/xbox.svg';
import fortniteLogo from '@/app/assets/icons/fortnite.svg';
import genshinLogo from '@/app/assets/icons/genshin-impact.svg';
import robloxLogo from '@/app/assets/icons/roblox.svg';
import valorantLogo from '@/app/assets/icons/valorant.svg';
import netflixLogo from '@/app/assets/icons/netflix.svg';
import spotifyLogo from '@/app/assets/icons/spotify.svg';
import googleLogo from '@/app/assets/icons/google.svg';
import appleLogo from '@/app/assets/icons/apple.svg';

export const getProductImage = (slug: string): string => {
  const imageMap: Record<string, string> = {
    'steam-wallet': steamImage,
    'telegram-stars': telegramImage,
    'playstation-wallet': playstationImage,
    'xbox-gift-card': xboxImage,
    'fortnite-vbucks': fortniteImage,
    'genshin-crystals': genshinImage,
    'roblox-robux': robloxImage,
    'valorant-points': valorantImage,
    'netflix-subscription': netflixImage,
    'spotify-premium': spotifyImage,
    'google-play-card': googleImage,
    'apple-gift-card': appleImage,
  };

  return imageMap[slug] || steamImage; // fallback
};

export const getProductLogo = (slug: string): string => {
  const logoMap: Record<string, string> = {
    'steam-wallet': steamLogo,
    'telegram-stars': telegramLogo,
    'playstation-wallet': playstationLogo,
    'xbox-gift-card': xboxLogo,
    'fortnite-vbucks': fortniteLogo,
    'genshin-crystals': genshinLogo,
    'roblox-robux': robloxLogo,
    'valorant-points': valorantLogo,
    'netflix-subscription': netflixLogo,
    'spotify-premium': spotifyLogo,
    'google-play-card': googleLogo,
    'apple-gift-card': appleLogo,
  };

  return logoMap[slug] || steamLogo; // fallback
};
