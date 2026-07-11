'use client';

import { useState } from 'react';
import { avatarVideoMap, avatarFallbackMap, AVATAR_FRAME_SRC, avatarTierToSpriteKey, getRankName } from '@/lib/spriteMap';

type AvatarHeroProps = {
  avatarLevel: number;
  className?: string;
  showRankName?: boolean;
};

export default function AvatarHero({ avatarLevel, className = '', showRankName = true }: AvatarHeroProps) {
  const [videoError, setVideoError] = useState(false);
  const spriteKey = avatarTierToSpriteKey(avatarLevel);
  const videoSrc = avatarVideoMap[spriteKey];
  const fallbackEmoji = avatarFallbackMap[spriteKey] || '🔰';
  const rankName = getRankName(avatarLevel);

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