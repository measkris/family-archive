'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PersonAvatarIllustrationProps {
  gender?: 'male' | 'female' | 'unknown';
  className?: string;
}

/**
 * Refined Ancestry-style side-profile cameo portrait illustrations
 * for family members without an uploaded photograph.
 */
export function PersonAvatarIllustration({
  gender = 'unknown',
  className,
}: PersonAvatarIllustrationProps) {
  if (gender === 'female') {
    return (
      <div
        className={cn(
          'relative size-full overflow-hidden flex items-end justify-center select-none',
          className
        )}
        style={{
          background:
            'radial-gradient(circle at 46% 36%, #f7e7df 0%, #ebd0c3 62%, #dfb9a8 100%)',
        }}
      >
        <svg
          viewBox="0 0 160 160"
          className="size-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Subtle vintage cameo inner halo */}
          <circle cx="80" cy="72" r="58" fill="#ffffff" fillOpacity="0.18" />

          {/* Seamless Sculpted Head + Graceful Neck (single continuous silhouette) */}
          <path
            d="M64 38
               C55 43 52 52 52 60
               C52 63 50 66 47 70
               C46 72 47 74 50 74
               C51 74 52 75 51 77
               C50 79 51 80 53 81
               C52 82 52 84 54 85
               C54 89 58 93 65 93
               C68 93 70 94 70 97
               C70 103 68 109 64 114
               L98 114
               C93 108 90 101 91 93
               C91 88 94 83 97 77
               C100 72 101 66 101 59
               C101 43 89 32 74 34
               C70 35 67 36 64 38 Z"
            fill="#b6634b"
          />

          {/* Smooth Dress / Shoulders flowing cleanly over collarbone */}
          <path
            d="M22 160
               C26 130 43 116 65 111
               C73 118 89 118 97 111
               C119 116 136 130 140 160 Z"
            fill="#a7563f"
          />

          {/* Subtle Bodice / Kebaya Collar Accent */}
          <path
            d="M65 111 C71 124 78 131 81 135 C84 131 91 124 97 111 C90 118 72 118 65 111 Z"
            fill="#8d432f"
          />
          <path
            d="M73 115 L81 127 L89 115"
            stroke="#f5e3d9"
            strokeOpacity="0.48"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sculpted Swept Hair overlapping nape seamlessly */}
          <path
            d="M55 51
               C56 38 67 28 82 29
               C96 30 106 41 106 55
               C106 67 101 77 92 84
               C87 87 81 86 78 83
               C82 78 85 71 84 64
               C81 66 77 65 76 61
               C75 56 78 52 81 51
               C74 46 64 47 55 51 Z"
            fill="#934732"
          />

          {/* Classic Victorian / Indisch Hair Bun (Konde) */}
          <ellipse
            cx="110"
            cy="60"
            rx="11.5"
            ry="13.5"
            transform="rotate(-12 110 60)"
            fill="#8a402c"
          />

          {/* Delicate Hairpin Accent */}
          <path
            d="M101 48 L116 55"
            stroke="#f5e1d5"
            strokeOpacity="0.65"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="117" cy="55.5" r="2" fill="#f5e1d5" fillOpacity="0.8" />
        </svg>
      </div>
    );
  }

  if (gender === 'male') {
    return (
      <div
        className={cn(
          'relative size-full overflow-hidden flex items-end justify-center select-none',
          className
        )}
        style={{
          background:
            'radial-gradient(circle at 52% 36%, #e4eff7 0%, #c8dceb 62%, #b0cce0 100%)',
        }}
      >
        <svg
          viewBox="0 0 160 160"
          className="size-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Subtle cameo inner halo */}
          <circle cx="80" cy="72" r="58" fill="#ffffff" fillOpacity="0.2" />

          {/* Seamless Sculpted Gentleman Head + Neck (single continuous silhouette) */}
          <path
            d="M95 38
               C103 43 106 51 106 59
               C106 62 109 66 112 70
               C113 72 111 74 108 74
               C107 75 107 77 108 78
               C108 80 107 81 105 82
               C106 84 106 86 104 87
               C103 91 98 94 91 94
               C89 94 89 97 91 102
               C93 106 95 110 98 113
               L62 113
               C66 107 69 99 68 91
               C67 86 64 81 61 76
               C58 70 56 64 56 57
               C57 41 70 30 85 32
               C89 33 92 35 95 38 Z"
            fill="#477a9e"
          />

          {/* Broad Tailored Coat Shoulders */}
          <path
            d="M16 160
               C20 128 38 114 63 108
               C73 115 89 115 99 108
               C123 114 141 128 145 160 Z"
            fill="#3b6b8c"
          />

          {/* Suit Lapels & Heritage Shirt Collar */}
          <path
            d="M65 107 L81 137 L97 107 L92 104 L81 123 L70 104 Z"
            fill="#2b526d"
          />
          <path
            d="M71 106 L81 122 L91 106 Z"
            fill="#e6f1f8"
            fillOpacity="0.65"
          />

          {/* Cravat / Tie silhouette */}
          <path
            d="M79 118 L83 118 L84 135 L81 140 L78 135 Z"
            fill="#23445b"
          />

          {/* Neatly Parted & Combed Gentleman's Hair */}
          <path
            d="M104 49
               C102 36 92 27 77 28
               C62 29 52 40 52 55
               C52 67 57 77 66 83
               C69 84 72 83 74 80
               C71 75 69 68 70 62
               C73 64 76 63 77 59
               C78 55 76 52 73 51
               C79 44 92 43 104 49 Z"
            fill="#2c536f"
          />
        </svg>
      </div>
    );
  }

  // Neutral / Unknown gender heritage cameo
  return (
    <div
      className={cn(
        'relative size-full overflow-hidden flex items-end justify-center select-none',
        className
      )}
      style={{
        background:
          'radial-gradient(circle at 50% 36%, #eef1ec 0%, #dce2da 65%, #cad3c7 100%)',
      }}
    >
      <svg
        viewBox="0 0 160 160"
        className="size-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="80" cy="72" r="58" fill="#ffffff" fillOpacity="0.22" />
        <path
          d="M22 160 C26 128 45 113 80 113 C115 113 134 128 138 160 Z"
          fill="#637368"
        />
        <path
          d="M68 88 L92 88 L96 115 L64 115 Z"
          fill="#718276"
        />
        <ellipse cx="80" cy="64" rx="24" ry="28" fill="#718276" />
        <path
          d="M56 61 C56 43 66 33 80 33 C94 33 104 43 104 61 C97 50 63 50 56 61 Z"
          fill="#58675d"
        />
      </svg>
    </div>
  );
}
