'use client';

import React from 'react';
import { Calendar, Camera, MapPin, Ship, Sparkles } from 'lucide-react';
import type { ArchivalSourceRecord, FamilyMemberRecord } from '@/lib/data/lang-genealogy';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PhotoArchiveTimelineProps {
  members: FamilyMemberRecord[];
  archivalRecords: ArchivalSourceRecord[];
  onSelectMember: (member: FamilyMemberRecord) => void;
}

const HISTORICAL_PLATES = [
  {
    id: 'plate-manado',
    title: 'Manado Bay & Mount Klabat (19th Century)',
    subtitle: 'Founding Homeland · Residentie Menado, N.O.I.',
    caption:
      'Historic view of the Minahasan harbor where Jacob Lang (ca. 1805–1845) and Maria Tampemawa raised the first two generations of the family.',
    image: '/images/heritage/manado-harbor.jpg',
    era: 'ca. 1840s',
  },
  {
    id: 'plate-sibajak',
    title: 'M.S. Sibajak — Launch & Indies Liner Heritage',
    subtitle: 'Rotterdam ↔ Batavia ↔ Surabaya Passenger Route',
    caption:
      'Featured in BrouwerTree’s Lang–Weintre chronicle; iconic Rotterdamsche Lloyd ocean liner carrying Indisch families between Java and the Netherlands (1927–1959).',
    image: '/images/heritage/ms-sibajak.jpg',
    era: '1927 – 1949',
  },
  {
    id: 'plate-tondano',
    title: 'Lake Tondano & Minahasa Highlands',
    subtitle: 'Home of Captain Joseph Lang (II-b) & Family',
    caption:
      'Highland town in Minahasa where Sea Captain Joseph Lang lived until 1894 and where Maurits Joachim, Johan Marcus, and Philip Benjamin Lang were born.',
    image: '/images/heritage/lake-tondano.jpg',
    era: '1868 – 1936',
  },
  {
    id: 'plate-minahasa',
    title: 'Minahasan Cultural Heritage (Kabasaran)',
    subtitle: 'Maternal Ancestral Lineage · North Sulawesi',
    caption:
      'Honoring the indigenous Minahasan clans woven into the Lang tree: Tampemawa, Waworuntu, Mamahit, Warokka, Palendeng, Mogot, Ransun, and Mononutu.',
    image: '/images/heritage/minahasa.jpg',
    era: '1810 – Present',
  },
  {
    id: 'plate-groningen',
    title: 'Groningen Historic Canals (Hoge der A)',
    subtitle: 'Ancestral Origin of Jan Wolters Kuitert (II-d)',
    caption:
      'Northern Dutch city where Jan Wolters Kuitert was born in 1821 to silversmith Cornelius Kuitert before departing for Menado in 1857.',
    image: '/images/heritage/groningen.jpg',
    era: '1821 – 1857',
  },
];

export function PhotoArchiveTimeline({
  members,
  archivalRecords,
  onSelectMember,
}: PhotoArchiveTimelineProps) {
  const portraits = members.filter((m) => Boolean(m.photoUrl));
  const spousePortraits = members.flatMap((m) =>
    m.spouses
      .filter((s) => Boolean(s.photoUrl))
      .map((s) => ({
        id: s.id,
        name: s.name,
        photoUrl: s.photoUrl!,
        subtitle: `Spouse of ${m.fullName} (${m.code})`,
        heritage: s.heritage || m.region,
        dates: [s.birthDate, s.deathDate].filter(Boolean).join(' – '),
        linkedMember: m,
      }))
  );

  return (
    <div className="space-y-8">
      {/* Archival Portraits Gallery */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="font-heritage text-3xl font-bold text-foreground flex items-center gap-2">
              <Camera className="size-6 text-amber-700" />
              Family Portrait Cabinet
            </h2>
            <p className="text-sm text-muted-foreground">
              Curated archival portraits representing the founding generations of Jacob Lang & Maria
              Tampemawa. Click any portrait to open their full dossier or upload new family photos.
            </p>
          </div>
          <Badge variant="gold">
            {portraits.length + spousePortraits.length} Portraits in Collection
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {portraits.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMember(m)}
              className="group text-left rounded-xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="aspect-square w-full overflow-hidden bg-stone-100 relative">
                <img
                  src={m.photoUrl}
                  alt={m.fullName}
                  className="size-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 rounded bg-slate-950/75 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-200">
                  {m.code}
                </span>
              </div>
              <div className="p-3">
                <div className="font-heritage text-base font-bold leading-tight text-foreground truncate group-hover:text-[#0b4a68]">
                  {m.fullName}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                  {m.birthYear || '?'}
                  {m.deathYear ? ` – ${m.deathYear}` : ''}
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {m.birthPlace || m.region}
                </div>
              </div>
            </button>
          ))}

          {spousePortraits.map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => onSelectMember(sp.linkedMember)}
              className="group text-left rounded-xl border border-amber-700/30 bg-card overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="aspect-square w-full overflow-hidden bg-stone-100 relative">
                <img
                  src={sp.photoUrl}
                  alt={sp.name}
                  className="size-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 rounded bg-amber-900/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-100">
                  Spouse
                </span>
              </div>
              <div className="p-3">
                <div className="font-heritage text-base font-bold leading-tight text-foreground truncate group-hover:text-[#0b4a68]">
                  {sp.name}
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {sp.subtitle}
                </div>
                <div className="text-[10px] text-amber-800 truncate mt-0.5">{sp.heritage}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Historical Places & Ships Plates */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heritage text-3xl font-bold text-foreground flex items-center gap-2">
            <Ship className="size-6 text-[#0b4a68]" />
            Historical Places & Maritime Plates
          </h2>
          <p className="text-sm text-muted-foreground">
            Archival scenes spanning Menado, Minahasa, Lake Tondano, Groningen, and the Java–Holland
            shipping lanes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HISTORICAL_PLATES.map((plate) => (
            <Card key={plate.id} className="overflow-hidden gap-0">
              <div className="aspect-[16/10] w-full overflow-hidden bg-stone-200 relative">
                <img
                  src={plate.image}
                  alt={plate.title}
                  className="size-full object-cover"
                />
                <Badge
                  variant="default"
                  className="absolute bottom-2.5 right-2.5 bg-slate-950/80 text-amber-200 font-mono text-[10px]"
                >
                  {plate.era}
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="font-heritage text-xl">{plate.title}</CardTitle>
                <CardDescription className="text-xs font-medium text-[#0b4a68]">
                  {plate.subtitle}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                {plate.caption}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Chronological Historical Timeline */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heritage text-3xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="size-6 text-amber-700" />
            Chronicle Timeline (1723 – 1962)
          </h2>
          <p className="text-sm text-muted-foreground">
            Key historical milestones documented in BrouwerTree’s Lang–Tampemawa archive.
          </p>
        </div>

        <div className="relative pl-6 border-l-2 border-amber-700/35 space-y-4">
          {archivalRecords.map((rec) => {
            const linked = rec.memberId
              ? members.find((m) => m.id === rec.memberId)
              : undefined;
            return (
              <div
                key={rec.id}
                className="relative rounded-xl border border-border bg-card p-4 shadow-xs"
              >
                <span className="absolute -left-[33px] top-5 size-3.5 rounded-full bg-[#0b4a68] ring-4 ring-[#f9f6f0]" />
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#0b4a68]">
                      {rec.dateLabel}
                    </span>
                    <Badge variant="gold" className="text-[10px]">
                      {rec.category}
                    </Badge>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {rec.location}
                  </span>
                </div>
                <h3 className="font-heritage text-lg font-bold text-foreground">{rec.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.summary}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-border/60 text-[11px]">
                  <span className="text-muted-foreground italic">{rec.sourceCitation}</span>
                  {linked && (
                    <button
                      type="button"
                      onClick={() => onSelectMember(linked)}
                      className="inline-flex items-center gap-1 font-medium text-[#0b4a68] hover:underline cursor-pointer"
                    >
                      <Sparkles className="size-3 text-amber-600" /> View {linked.fullName} (
                      {linked.code})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
