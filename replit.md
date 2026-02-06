# ScholarSync - Academic Writing Platform

## Overview
ScholarSync is an AI-powered platform for academic thesis writing and research synthesis. Built with React, TypeScript, Vite, and Tailwind CSS.

## Project Architecture
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3 with typography plugin
- **Rich Text Editor**: TipTap
- **AI Integration**: Google Gemini API (requires GEMINI_API_KEY env var)
- **Data Services**: Supabase (optional), in-browser localStorage fallback

## Project Structure
```
/                     - Root config files (vite, tailwind, tsconfig, etc.)
/components/          - React UI components
/lib/                 - Utility libraries (brand, constants, prisma, supabase)
/services/            - Service layer (Gemini AI, citations, DB, Semantic Scholar)
/types.ts             - TypeScript type definitions
/index.html           - Entry HTML
/index.tsx            - React app entry point
/App.tsx              - Main App component with routing
```

## Running the App
- Dev server: `npm run dev` (runs Vite on port 5000)
- Build: `npm run build` (outputs to `dist/`)

## Environment Variables
- `GEMINI_API_KEY` - Google Gemini API key for AI features
- `VITE_SUPABASE_URL` - Supabase project URL (optional)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (optional)

## Recent Changes
- 2026-02-06: Initial Replit setup - removed Cloudflare Wrangler dependency, configured Vite for Replit (port 5000, allow all hosts), removed CDN import map in favor of npm packages
