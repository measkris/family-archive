'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ChevronDown, Dna, Leaf } from 'lucide-react';
import type { FamilyMemberRecord, SpouseRecord } from '@/lib/data/lang-genealogy';
import { OptimizedPortrait } from '@/components/ui/OptimizedPortrait';
import { cn } from '@/lib/utils';

export interface AncestryNodeData extends Record<string, unknown> {
  member: FamilyMemberRecord;
  direction: 'TB' | 'LR';
  isMemberSelected: boolean;
  selectedSpouseId: string | null;
  isHighlighted: boolean;
  isDimmed: boolean;
  isCollapsed: boolean;
  childrenCount: number;
  relationshipLabel: string;
  onSelectMember: (member: FamilyMemberRecord) => void;
  onSelectSpouse: (spouse: SpouseRecord, partner: FamilyMemberRecord) => void;
  onOpenMemberProfile: (member: FamilyMemberRecord) => void;
  onOpenSpouseProfile: (spouse: SpouseRecord, partner: FamilyMemberRecord) => void;
  onToggleCollapse: (memberId: string) => void;
}

function formatYearRange(
  birthYear?: number,
  deathYear?: number,
  birthDate?: string,
  deathDate?: string
) {
  const b = birthYear ? String(birthYear) : birthDate?.match(/\d{4}/)?.[0] || '';
  const d = deathYear ? String(deathYear) : deathDate?.match(/\d{4}/)?.[0] || '';
  if (b && d) return `${b}–${d}`;
  if (b) return `${b}–`;
  return 'Dates unk.';
}

function PersonTile({
  name,
  years,
  photoUrl,
  gender,
  isSelected,
  isDirectLine,
  hasHints,
  code,
  onClick,
  onDoubleClick,
}: {
  name: string;
  years: string;
  photoUrl?: string;
  gender: 'male' | 'female' | 'unknown';
  isSelected: boolean;
  isDirectLine: boolean;
  hasHints: boolean;
  code?: string;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onClick(e as unknown as React.MouseEvent);
        }
      }}
      className={cn(
        'relative w-[116px] rounded-[5px] transition-all duration-150 cursor-pointer select-none shadow-[0_3px_10px_rgba(0,0,0,0.38)]',
        isSelected
          ? 'bg-[#2c2e30] text-white ring-2 ring-white scale-[1.03]'
          : 'bg-[#f8f8f7] text-[#222426] hover:bg-white hover:shadow-[0_6px_16px_rgba(0,0,0,0.48)]',
        isDirectLine && !isSelected && 'ring-2 ring-[#8bc34a]'
      )}
    >
      {/* Top-right Ancestry Hint Leaf & Heritage DNA badges */}
      <div className="absolute -top-2.5 -right-1.5 z-10 flex items-center gap-0.5">
        {isDirectLine && (
          <span
            title="Direct Lineage / Heritage Match"
            className="flex size-5 items-center justify-center rounded-full bg-[#3f759a] text-white shadow ring-1 ring-white/80"
          >
            <Dna className="size-3" />
          </span>
        )}
        {hasHints && (
          <span
            title="Archival Sources & Live Hints Available"
            className="flex size-5 items-center justify-center rounded-full bg-[#73a922] text-white shadow ring-1 ring-white/80"
          >
            <Leaf className="size-3 fill-white/90" />
          </span>
        )}
      </div>

      {/* Subtle code tag */}
      {code && (
        <span
          className={cn(
            'absolute top-1.5 left-1.5 z-10 rounded px-1 py-0.2 font-mono text-[9px] font-semibold leading-tight',
            isSelected ? 'bg-black/60 text-amber-300' : 'bg-black/55 text-white'
          )}
        >
          {code}
        </span>
      )}

      {/* Square Portrait Frame */}
      <div className="p-1.5 pb-1">
        <div className="aspect-square w-full overflow-hidden rounded-[3px] bg-stone-200 border border-black/10">
          <OptimizedPortrait src={photoUrl} alt={name} gender={gender} width={240} />
        </div>
      </div>

      {/* Centered Name & Years */}
      <div className="px-1.5 pb-2 pt-0.5 text-center">
        <div
          className={cn(
            'text-[11.5px] font-bold leading-[1.2] line-clamp-2 min-h-[28px] flex items-center justify-center',
            isSelected ? 'text-white' : 'text-[#222426]'
          )}
        >
          {name}
        </div>
        <div
          className={cn(
            'text-[10px] font-mono mt-0.5 tracking-tight',
            isSelected ? 'text-stone-300' : 'text-stone-500'
          )}
        >
          {years}
        </div>
      </div>
    </div>
  );
}

export const AncestryCoupleNode = memo(function AncestryCoupleNode({ data }: NodeProps) {
  const nodeData = data as AncestryNodeData;
  const {
    member,
    direction,
    isMemberSelected,
    selectedSpouseId,
    isHighlighted,
    isDimmed,
    isCollapsed,
    childrenCount,
    onSelectMember,
    onSelectSpouse,
    onOpenMemberProfile,
    onOpenSpouseProfile,
    onToggleCollapse,
  } = nodeData;

  const primarySpouse: SpouseRecord | undefined = member.spouses[0];
  const spouseGender: 'male' | 'female' | 'unknown' =
    member.gender === 'male' ? 'female' : member.gender === 'female' ? 'male' : 'unknown';

  const targetPos = direction === 'TB' ? Position.Top : Position.Left;
  const sourcePos = direction === 'TB' ? Position.Bottom : Position.Right;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center transition-opacity duration-200',
        isDimmed && 'opacity-25'
      )}
    >
      <Handle
        type="target"
        position={targetPos}
        className="!size-2 !bg-[#b0b4b8] !border !border-[#3e4042]"
      />

      {/* Single or Side-by-Side Couple Card Pair */}
      <div className="flex items-start">
        <PersonTile
          name={member.fullName}
          years={formatYearRange(
            member.birthYear,
            member.deathYear,
            member.birthDate,
            member.deathDate
          )}
          photoUrl={member.photoUrl}
          gender={member.gender}
          isSelected={isMemberSelected}
          isDirectLine={isHighlighted || member.generation <= 2}
          hasHints={member.sources.length > 0}
          code={member.code}
          onClick={(e) => {
            e.stopPropagation();
            onSelectMember(member);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onOpenMemberProfile(member);
          }}
        />

        {primarySpouse && (
          <>
            {/* Horizontal Marriage Connector Bar */}
            <div className="flex flex-col items-center justify-center self-center w-5 shrink-0">
              <div className="h-[2px] w-full bg-[#b4b8bc]" />
              {member.spouses.length > 1 && (
                <span
                  title={`${member.spouses.length} marriages recorded`}
                  className="mt-1 rounded-full bg-[#2e3032] border border-white/25 px-1 text-[9px] font-mono text-stone-200"
                >
                  +{member.spouses.length - 1}
                </span>
              )}
            </div>

            <PersonTile
              name={primarySpouse.name}
              years={formatYearRange(
                undefined,
                undefined,
                primarySpouse.birthDate,
                primarySpouse.deathDate
              )}
              photoUrl={primarySpouse.photoUrl}
              gender={spouseGender}
              isSelected={selectedSpouseId === primarySpouse.id}
              isDirectLine={isHighlighted && member.generation === 1}
              hasHints={Boolean(primarySpouse.heritage)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSpouse(primarySpouse, member);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onOpenSpouseProfile(primarySpouse, member);
              }}
            />
          </>
        )}
      </div>

      {/* Expand/Collapse Children Chevron Badge */}
      {childrenCount > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(member.id);
          }}
          title={
            isCollapsed
              ? `Expand ${childrenCount} children of ${member.firstName}`
              : `Collapse ${member.firstName}'s children`
          }
          className={cn(
            'mt-1.5 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer shadow-sm',
            isCollapsed
              ? 'bg-[#73a922] text-white border-[#8bc34a] hover:bg-[#66971d]'
              : 'bg-[#36383a] text-stone-200 border-white/20 hover:bg-[#2a2c2e]'
          )}
        >
          <ChevronDown
            className={cn(
              'size-3 shrink-0 transition-transform duration-200 ease-in-out',
              !isCollapsed && 'rotate-180'
            )}
          />
          <span>
            {member.firstName}&apos;s children{isCollapsed ? ` (${childrenCount})` : ''}
          </span>
        </button>
      )}

      <Handle
        type="source"
        position={sourcePos}
        className="!size-2 !bg-[#b0b4b8] !border !border-[#3e4042]"
      />
    </div>
  );
});
