
export interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  avatarUrl: string;
}

export interface University {
  id: string;
  name: string;
  logo: string;
  standards: {
    font: string;
    size: string;
    spacing: string;
    citationStyle: string;
  };
}

export interface Document {
  id: string;
  title: string;
  universityId: string;
  content: string;
  lastModified: Date;
  status: 'Draft' | 'Review' | 'Completed';
  progress: number;
}

export interface ValidationIssue {
  id: string;
  category: 'fact' | 'integrity' | 'quality';
  severity: 'high' | 'medium' | 'low';
  text: string;
  issue: string;
  recommendation: string;
}

export interface ValidationReport {
  factScore: number;
  integrityScore: number;
  qualityScore: number;
  issues: ValidationIssue[];
  summary: string;
}

export interface AnalyticsReport {
  peakPerformance: string;
  academicTone: string;
  goalProjection: string;
}

export interface ResearchLink {
  title: string;
  uri: string;
}

export interface WebResearchResponse {
  answer: string;
  sources: ResearchLink[];
}

export interface Reference {
  id: string;
  raw: string;
  author: string;
  year: string;
  title: string;
  source: string;
  formatted: string;
}

export interface LibraryItem extends Reference {
  type: 'journal' | 'book' | 'website' | 'report' | 'other';
  tags: string[];
  pdfUrl?: string;
  notes?: string;
  readStatus: 'unread' | 'reading' | 'read';
  folderId?: string;
  isFavorite: boolean;
  addedDate: Date;
  fullText?: string;
  similarity?: number;
}

export interface LibraryFolder {
  id: string;
  name: string;
  count: number;
}

export interface UniversityUpdate {
  id: string;
  universityId: string;
  universityName: string;
  date: Date;
  title: string;
  description: string;
  type: 'formatting' | 'citation' | 'deadline' | 'policy';
  sourceUrl?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'deadline' | 'meeting' | 'milestone';
  description?: string;
  completed: boolean;
  time?: string;
  location?: string;
}

export interface Journal {
  name: string;
  publisher: string;
  impactFactor: string;
  matchScore: number;
  matchReason: string;
  scope: string;
  acceptanceRate?: string;
  openAccess: boolean;
  website?: string;
}

// Added missing Annotation interface to fix compilation error in dbService
export interface Annotation {
  id: string;
  paperId: string;
  userId: string;
  type: string;
  content: string;
  color: string;
  position: any;
  createdAt: Date;
  status: string;
}

export enum View {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  DOCUMENTS = 'DOCUMENTS',
  TEMPLATES = 'TEMPLATES',
  MARKETPLACE = 'MARKETPLACE',
  SETTINGS = 'SETTINGS',
  RESEARCH = 'RESEARCH',
  WEB_RESEARCH = 'WEB_RESEARCH',
  VISUALIZATION = 'VISUALIZATION',
  TOOLKIT = 'TOOLKIT',
  ANALYTICS = 'ANALYTICS',
  JOURNAL_MATCHER = 'JOURNAL_MATCHER',
  SYNTHESIS = 'SYNTHESIS',
  HELP = 'HELP',
  PRICING = 'PRICING'
}
