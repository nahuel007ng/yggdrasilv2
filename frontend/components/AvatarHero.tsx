'use client';

import { useState, useEffect } from 'react';
import { avatarVideoMap, avatarFallbackMap, AVATAR_FRAME_SRC, avatarTierToSpriteKey, getRankName } from '@/lib/spriteMap';
import PixelIcon from '@/components/PixelIcon';
import { TITLES_BY_CODE, titleToSpriteKey } from '@/lib/achievements';

type AvatarHeroProps = {
  avatarLevel: number;
  className?: string;
  showRankName?: boolean;
  activeTitle?: string | null;
};

export default function AvatarHero({ avatarLevel, className = '', showRankName = true, activeTitle = null }: AvatarHeroProps) {
  const [videoError, setVideoError] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const spriteKey = avatarTierToSpriteKey(avatarLevel);
  const videoSrc = avatarVideoMap[spriteKey];
  const fallbackEmoji = avatarFallbackMap[spriteKey] || '🔰';
  const rankName = getRankName(avatarLevel);
  const titleDef = activeTitle ? TITLES_BY_CODE[activeTitle] : null;
  const titleIconSize = isDesktop ? 86 : 48;

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="avatar-hero-container">
        {!videoError && videoSrc ? (
          <video
            className="avatar-hero-video"
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
          />
        ) : (
          <div className="avatar-hero-fallback">
            <span role="img" aria-label={`Avatar ${rankName}`}>
              {fallbackEmoji}
            </span>
          </div>
        )}
        <img
          src={AVATAR_FRAME_SRC}
          alt=""
          className="avatar-hero-frame pixelated"
          aria-hidden="true"
        />
        {titleDef && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '14.7%',
              transform: 'translate(-50%, -50%)',
              zIndex: 3,
            }}
          >
            <PixelIcon name={titleToSpriteKey(activeTitle!)} size={titleIconSize} alt={titleDef.name} />
          </div>
        )}
      </div>
      {showRankName && (
        <span
          className="pixel-font text-lg mt-2"
          style={{ color: 'var(--color-primary)' }}
        >
          {rankName}
        </span>
      )}
    </div>
  );
}