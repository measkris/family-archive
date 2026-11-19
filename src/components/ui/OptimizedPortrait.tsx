'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PersonAvatarIllustration } from '@/components/ui/PersonAvatarIllustration';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Normalizes portrait URLs (trims whitespace, adds leading slash for local images/)
 * and rewrites Cloudinary upload URLs to serve fast edge-resized AVIF/WebP images
 * (f_auto,q_auto,c_fill,g_face).
 */
export function getOptimizedImageUrl(url: string, width = 320): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('images/')) {
    return `/${trimmed}`;
  }
  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/image/upload/')) {
    if (trimmed.includes('/image/upload/f_auto')) return trimmed;
    return trimmed.replace(
      '/image/upload/',
      `/image/upload/f_auto,q_auto,c_fill,g_face,w_${width},h_${width}/`
    );
  }
  return trimmed;
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
  const optimizedSrc = src ? getOptimizedImageUrl(src, width) : '';
  const isLocalOrData =
    optimizedSrc.startsWith('/') ||
    optimizedSrc.startsWith('data:') ||
    optimizedSrc.startsWith('blob:');

  const [loadedSrc, setLoadedSrc] = useState<string>('');
  const [erroredSrc, setErroredSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle cached / SSR-preloaded / portal-mounted images where onLoad fired early
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0 && optimizedSrc) {
      setLoadedSrc(optimizedSrc);
    }
  }, [optimizedSrc]);

  if (!optimizedSrc || erroredSrc === optimizedSrc) {
    return (
      <div className={cn('relative size-full overflow-hidden', className)}>
        <PersonAvatarIllustration gender={gender} />
      </div>
    );
  }

  const isLoaded = isLocalOrData || loadedSrc === optimizedSrc;

  return (
    <div className={cn('relative size-full overflow-hidden bg-stone-200', className)}>
      {!isLoaded && <Skeleton className="absolute inset-0 size-full rounded-none" />}
      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        loading={priority || isLocalOrData ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoadedSrc(optimizedSrc)}
        onError={() => setErroredSrc(optimizedSrc)}
        className={cn(
          'size-full object-cover object-top transition-opacity duration-200',
          isLoaded ? 'opacity-100' : 'opacity-0',
          imgClassName
        )}
      />
    </div>
  );
}
