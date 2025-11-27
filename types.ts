
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

export interface AISuggestion {
  id: string;
  type: 'grammar' | 'style' | 'citation' | 'clarity';
  originalText: string;
  suggestion: string;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ResearchLink {
  title: string;
  uri: string;
}

export interface ResearchResponse {
  content: string;
  links: ResearchLink[];
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

export interface ChartData {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'area' | 'pie';
  data: any[];
  xKey: string;
  dataKeys: string[];
  description: string;
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

export enum View {
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  DOCUMENTS = 'DOCUMENTS',
  TEMPLATES = 'TEMPLATES',
  MARKETPLACE = 'MARKETPLACE',
  SETTINGS = 'SETTINGS',
  RESEARCH = 'RESEARCH',
  CALENDAR = 'CALENDAR',
  ANALYTICS = 'ANALYTICS',
  COMMUNITY = 'COMMUNITY',
  TOOLKIT = 'TOOLKIT'
}