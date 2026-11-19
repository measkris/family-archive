import React from 'react';
import { DarkSkeleton, Skeleton } from '@/components/ui/skeleton';

/**
 * Full-page Ancestry-style loading skeleton rendered immediately via Next.js
 * Suspense & loading.tsx while Firestore streams initial family archive data.
 */
export function WorkspaceSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f9f6f0] animate-fade-in">
      {/* Brand Navbar Skeleton */}
      <header className="border-b border-stone-200/90 bg-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-md hidden sm:block" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </header>

      {/* Active Family Section Skeleton */}
      <section className="border-b border-stone-300/80 bg-[#f2f5f4]">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-4 w-56 rounded-full" />
              </div>
              <Skeleton className="h-7 w-80 sm:w-[400px]" />
            </div>
            <Skeleton className="h-7 w-64 rounded-full" />
          </div>

          {/* Key Ancestors Ribbon Skeleton */}
          <div className="pt-2.5 border-t border-stone-300/70 flex items-center gap-2 overflow-hidden">
            <Skeleton className="h-4 w-24 shrink-0" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-36 rounded-full shrink-0" />
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Skeleton */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Tabs Strip Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/70 p-1">
            <Skeleton className="h-8 w-40 rounded-md" />
            <Skeleton className="h-8 w-44 rounded-md" />
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-8 w-44 rounded-md" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Ancestry Charcoal Tree Canvas + Right Inspector Skeleton */}
        <div className="flex h-[78vh] min-h-[620px] w-full rounded-xl border border-stone-700/40 bg-[#494b4d] overflow-hidden shadow-xl">
          {/* Canvas area */}
          <div className="relative flex-1 flex flex-col">
            {/* Top floating bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#2f3133]/90 border-b border-white/10">
              <div className="flex items-center gap-2">
                <DarkSkeleton className="h-6 w-36" />
                <DarkSkeleton className="h-7 w-36" />
                <DarkSkeleton className="h-7 w-28" />
              </div>
              <div className="flex items-center gap-2">
                <DarkSkeleton className="h-7 w-28 rounded-full" />
                <DarkSkeleton className="h-7 w-24 rounded-full" />
              </div>
            </div>

            {/* Left tool rail */}
            <div className="absolute top-14 left-3 flex flex-col gap-1.5 rounded-lg bg-[#2e3032]/90 border border-white/15 p-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <DarkSkeleton key={i} className="size-8 rounded-md" />
              ))}
            </div>

            {/* Centered hierarchical portrait card placeholders */}
            <div className="flex-1 flex flex-col items-center justify-center gap-10 px-8">
              {/* Gen I Couple */}
              <div className="flex items-center gap-4">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="w-[116px] rounded-[5px] bg-[#f8f8f7]/95 p-1.5 shadow-lg space-y-2"
                  >
                    <Skeleton className="aspect-square w-full rounded-[3px]" />
                    <Skeleton className="h-3 w-4/5 mx-auto" />
                    <Skeleton className="h-2.5 w-1/2 mx-auto" />
                  </div>
                ))}
              </div>

              {/* Connector line */}
              <div className="h-8 w-px bg-white/25 -my-6" />

              {/* Gen II Row */}
              <div className="flex flex-wrap items-center justify-center gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[116px] rounded-[5px] bg-[#f8f8f7]/90 p-1.5 shadow-lg space-y-2"
                  >
                    <Skeleton className="aspect-square w-full rounded-[3px]" />
                    <Skeleton className="h-3 w-4/5 mx-auto" />
                    <Skeleton className="h-2.5 w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
