import type {
  ArchivalSourceRecord,
  FamilyMemberRecord,
  FamilyTreeGroupRecord,
  HeritageOriginSeed,
} from '@/lib/data/lang-genealogy';

export interface NationalizeCountry {
  country_id: string;
  probability: number;
}

export interface HeritageOriginRecord extends HeritageOriginSeed {
  nationalizeCountries?: NationalizeCountry[];
  wikipediaSummary?: string;
  wikipediaUrl?: string;
  wikipediaThumbnail?: string;
  openArchivesCount?: number;
  lastEnrichedAt?: string;
}

export interface DatabaseStatus {
  provider: 'firebase-firestore' | 'turso-libsql' | 'sqlite-local';
  label: string;
  description: string;
  location: string;
  isCloud: boolean;
  memberCount: number;
  archiveCount: number;
  heritageCount: number;
}

export interface DatabaseAdapter {
  readonly provider: DatabaseStatus['provider'];
  readonly label: string;
  readonly description: string;
  readonly location: string;
  readonly isCloud: boolean;

  ensureSeeded(): Promise<void>;
  getAllMembers(): Promise<FamilyMemberRecord[]>;
  getMemberById(id: string): Promise<FamilyMemberRecord | null>;
  upsertMember(member: FamilyMemberRecord): Promise<FamilyMemberRecord>;
  deleteMember(id: string): Promise<boolean>;
  getFamilyTrees(): Promise<FamilyTreeGroupRecord[]>;
  upsertFamilyTree(tree: FamilyTreeGroupRecord): Promise<FamilyTreeGroupRecord>;
  getArchivalRecords(): Promise<ArchivalSourceRecord[]>;
  getHeritageOrigins(): Promise<HeritageOriginRecord[]>;
  updateHeritageOrigin(origin: HeritageOriginRecord): Promise<void>;
}
