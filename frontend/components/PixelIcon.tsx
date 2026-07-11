'use client';

import { useState } from 'react';
import { spriteMap, type SpriteEntry } from '@/lib/spriteMap';

type PixelIconProps = {
  name: string;
  size?: number;
  className?: string;
  alt?: string;
};

export default function PixelIcon({ name, size = 24, className = '', alt }: PixelIconProps) {
  const [useFallback, setUseFallback] = useState(false);
  const entry: SpriteEntry | undefined = spriteMap[name];

  if (!entry) {
    return <span className={className} style={{ fontSize: size }}>{name}</span>;
  }

  if (useFallback) {
    return (
      <span
        className={className}
        style={{ fontSize: size, lineHeight: 1, display: 'inline-block', width: size, height: size, textAlign: 'center' }}
        role="img"
        aria-label={alt || name}
      >
        {entry.fallback}
      </span>
    );
  }

  return (
    <img
      src={entry.src}
      alt={alt || name}
      width={size}
      height={size}
      className={`pixelated ${className}`}
      style={{ imageRendering: 'pixelated' }}
      onError={() => setUseFallback(true)}
    />
  );
}