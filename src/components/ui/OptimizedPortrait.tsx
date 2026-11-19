'use client';

import React, { useState } from 'react';
import { PersonAvatarIllustration } from '@/components/ui/PersonAvatarIllustration';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Rewrites Cloudinary upload URLs to serve fast edge-resized AVIF/WebP images
 * (f_auto,q_auto,c_fill,g_face) — typically 20-40x smaller than raw JPEGs.
 */
export function getOptimizedImageUrl(url: string, width = 320): string {
  if (!url) return url;
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    // Avoid double-transforming if already transformed
    if (url.includes('/image/upload/f_auto')) return url;
    return url.replace(
      '/image/upload/',
      `/image/upload/f_auto,q_auto,c_fill,g_face,w_${width},h_${width}/`
    );
  }
  return url;
}

interface OptimizedPortraitProps {
  src?: string;
  alt: string;
  gender?: 'male' | 'female' | 'unknown';
  width?: number;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

export function OptimizedPortrait({
  src,
  alt,
  gender = 'unknown',
  width = 280,
  className,
  imgClassName,
  priority = false,
}: OptimizedPortraitProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className={cn('relative size-full overflow-hidden', className)}>
        <PersonAvatarIllustration gender={gender} />
      </div>
    );
  }

  const optimizedSrc = getOptimizedImageUrl(src, width);

  return (
    <div className={cn('relative size-full overflow-hidden bg-stone-200', className)}>
      {!loaded && <Skeleton className="absolute inset-0 size-full rounded-none" />}
      <img
        src={optimizedSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={cn(
          'size-full object-cover object-top transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName
        )}
      />
    </div>
  );
}
