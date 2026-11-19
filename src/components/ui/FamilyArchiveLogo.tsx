'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface FamilyArchiveLogoProps {
  className?: string;
}

/**
 * Vector remake of the Family Archive intertwined two-figure ribbon emblem
 * (royal-to-sky blue left figure embracing emerald-to-lime green right figure).
 */
export function FamilyArchiveLogo({ className }: FamilyArchiveLogoProps) {
  const uid = useId().replace(/:/g, '');
  const headLeft = `fa-hl-${uid}`;
  const headRight = `fa-hr-${uid}`;
  const backLoop = `fa-bl-${uid}`;
  const frontSash = `fa-fs-${uid}`;
  const leftFold = `fa-lf-${uid}`;
  const stemShadow = `fa-ss-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="none"
      className={cn('size-9 shrink-0', className)}
      aria-label="Family Archive Logo"
    >
      <defs>
        <radialGradient id={headLeft} cx="35%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#3BD0FF" />
          <stop offset="52%" stopColor="#2E86D8" />
          <stop offset="100%" stopColor="#3551A3" />
        </radialGradient>

        <radialGradient id={headRight} cx="35%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#64CE8A" />
          <stop offset="55%" stopColor="#279B90" />
          <stop offset="100%" stopColor="#116E8A" />
        </radialGradient>

        <linearGradient id={backLoop} x1="88%" y1="34%" x2="24%" y2="94%">
          <stop offset="0%" stopColor="#9BD365" />
          <stop offset="28%" stopColor="#53B786" />
          <stop offset="62%" stopColor="#1C8C96" />
          <stop offset="86%" stopColor="#0E6D9A" />
          <stop offset="100%" stopColor="#234896" />
        </linearGradient>

        <linearGradient id={frontSash} x1="16%" y1="54%" x2="96%" y2="66%">
          <stop offset="0%" stopColor="#314FA3" />
          <stop offset="32%" stopColor="#376BC4" />
          <stop offset="64%" stopColor="#29B2EE" />
          <stop offset="100%" stopColor="#45D0FC" />
        </linearGradient>

        <linearGradient id={leftFold} x1="18%" y1="62%" x2="55%" y2="78%">
          <stop offset="0%" stopColor="#253E8C" stopOpacity="0.88" />
          <stop offset="65%" stopColor="#2C65B8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#29B2EE" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={stemShadow} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#0A3A4A" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0A3A4A" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Left Figure Head */}
      <circle cx="43.5" cy="29.5" r="14.5" fill={`url(#${headLeft})`} />

      {/* Right Figure Head */}
      <circle cx="81.5" cy="24" r="12" fill={`url(#${headRight})`} />

      {/* Back Intertwined U-Curve + Right Green Arch */}
      <path
        d="M27 83
           C31 100 44 111 60 111
           C76 111 87 99 88 81
           L88 60
           C88 53 91 49 95 49
           C99 49 102 53 102 60
           L102 68
           C106 64 108 59 108 53
           C108 42 100 35 90 35
           C79 35 72 44 72 58
           L72 80
           C72 91 66 98 58 98
           C48 98 41 90 39 77 Z"
        fill={`url(#${backLoop})`}
      />

      {/* Shadow cast onto right stem */}
      <path d="M72 79 L88 79 L87 88 L72 86 Z" fill={`url(#${stemShadow})`} />

      {/* Front Sweeping Blue Ribbon Sash */}
      <path
        d="M27 85
           C20 75 19 61 25 52
           C31 43 44 41 58 49
           C70 56 80 62 91 61
           C100 60 105 55 106 47
           C109 53 110 61 107 69
           C102 80 88 85 73 82
           C60 79 49 69 39 68
           C32 67 28 73 27 85 Z"
        fill={`url(#${frontSash})`}
      />

      {/* Dimensional Fold Shadow along left blue curve */}
      <path
        d="M27 85
           C23 76 24 65 31 60
           C38 55 48 58 58 64
           C55 68 59 71 66 74
           C54 71 45 68 38 68
           C31 68 28 74 27 85 Z"
        fill={`url(#${leftFold})`}
      />

      {/* Luminous Cyan Specular Highlight */}
      <path
        d="M64 60
           C74 65 86 67 96 63
           C102 61 105 57 106 52
           C107 58 106 65 101 70
           C94 77 82 78 69 73
           C62 70 60 64 64 60 Z"
        fill="#6CE2FF"
        fillOpacity="0.32"
      />
    </svg>
  );
}
