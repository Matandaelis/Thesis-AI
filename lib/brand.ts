
import { GraduationCap, Library, ShieldCheck, Sparkles } from 'lucide-react';
import React from 'react';

export type BrandId = 'scholar-sync' | 'scholar-pro';

export interface BrandConfig {
  id: BrandId;
  name: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  logo: React.ElementType;
  description: string;
}

export const BRANDS: Record<BrandId, BrandConfig> = {
  'scholar-sync': {
    id: 'scholar-sync',
    name: 'ScholarSync',
    tagline: 'Research Redefined.',
    primaryColor: 'blue',
    accentColor: 'sky',
    logo: GraduationCap,
    description: 'The advanced AI companion for academic thesis writing and research validation.'
  },
  'scholar-pro': {
    id: 'scholar-pro',
    name: 'ScholarPro',
    tagline: 'Scientific Writing, Perfected.',
    primaryColor: 'sky',
    accentColor: 'blue',
    logo: Library,
    description: 'An professional environment for researchers to synthesize journals and draft manuscripts.'
  }
};

// Current active brand - renamed from thesis-ai to scholar-sync
export const ACTIVE_BRAND = BRANDS['scholar-sync'];
