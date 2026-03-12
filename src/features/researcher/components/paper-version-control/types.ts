import type {
  Paper,
  PaperVersion as DomainPaperVersion,
} from '@/src/shared/types/domain';

export type PaperVersion = Pick<
  DomainPaperVersion,
  'id' | 'versionNumber' | 'paperHash' | 'fileStorageKey' | 'createdAt'
>;

export type PaperWithVersions = Pick<Paper, 'id' | 'title'> & {
  versions: PaperVersion[];
};
