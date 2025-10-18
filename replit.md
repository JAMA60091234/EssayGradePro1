# EssayGrade AI - Intelligent Essay Evaluation Assistant

## Overview
EssayGrade AI is a comprehensive AI-powered essay evaluation platform that provides students with detailed feedback, rubric-based scoring, and personalized improvement suggestions. The application uses Google's Gemini AI for intelligent essay analysis and integrates with Google Drive for convenient file management.

## Project Structure

### Frontend (`client/src/`)
- **Pages**:
  - `dashboard.tsx` - Main dashboard with stats, recent submissions, and quick actions
  - `submit.tsx` - Essay and rubric submission form with file upload and Google Drive integration
  - `history.tsx` - Essay history with search, filtering, and progress charts
  - `results.tsx` - Detailed evaluation results with scores, feedback, and essay view
  - `settings.tsx` - Application settings and theme management
  - `not-found.tsx` - 404 error page

- **Components**:
  - `app-sidebar.tsx` - Navigation sidebar with menu items
  - `theme-provider.tsx` - Theme context provider for dark/light mode
  - `theme-toggle.tsx` - Theme switcher component
  - `ui/*` - Shadcn UI components (Button, Card, Input, etc.)

### Backend (`server/`)
- `routes.ts` - API endpoints for essay evaluation
- `storage.ts` - In-memory storage interface for essays, rubrics, and evaluations
- `gemini.ts` - Gemini AI integration for essay grading (to be created)
- `google-drive.ts` - Google Drive API integration (to be created)

### Shared (`shared/`)
- `schema.ts` - TypeScript types and Zod schemas for essays, rubrics, and evaluations

## Features Implemented (Frontend)

### ✅ Phase 1: Schema & Frontend (Completed)
1. **Data Models**: Complete TypeScript interfaces for essays, rubrics, evaluations
2. **Dashboard Page**: 
   - Welcome header with student greeting
   - Stats cards showing total essays, average score, improvement trend
   - Recent submissions grid with score badges
   - Quick action buttons
   - Empty state for new users
3. **Submit Essay Page**:
   - Two-column layout for essay and rubric upload
   - File upload with drag-and-drop support
   - Google Drive import buttons (UI ready)
   - Step indicators (1. Upload Essay, 2. Upload Rubric, 3. Submit)
   - Form validation with React Hook Form and Zod
   - Preview of uploaded content
4. **History Page**:
   - Progress chart showing score trends over time
   - Search functionality for essays
   - Grid layout of past submissions with scores
   - Empty state with CTA
5. **Results Page**:
   - Circular progress indicator for overall score
   - Tabbed interface (Detailed Scores | Feedback | Essay View)
   - Category breakdown with progress bars
   - Strengths, weaknesses, and suggestions sections
   - Full essay and rubric view
6. **Settings Page**:
   - Theme selector (Light/Dark/System)
   - Google Drive connection status
   - Application information
7. **Navigation**:
   - Sidebar with Dashboard, Submit Essay, History, Settings
   - Header with sidebar toggle and theme switcher
   - Responsive layout

### Design System
- **Colors**: Educational blue primary (220 90% 50%), success green, warning amber
- **Typography**: Inter for UI, Merriweather for content, JetBrains Mono for code
- **Spacing**: Consistent padding (4, 6, 8 units) throughout
- **Components**: Shadcn UI with custom theming
- **Dark Mode**: Full support with automatic theme switching

## API Endpoints (To Be Implemented)

### Essays
- `POST /api/evaluations/submit` - Submit essay and rubric for evaluation
- `GET /api/evaluations/recent` - Get recent evaluations
- `GET /api/evaluations` - Get all evaluations
- `GET /api/evaluations/:id` - Get specific evaluation with details

## External Integrations

### Google Drive
- Connection ID: `conn_google-drive_01K7W0WVC8R80F2TTZ15PD25EJ`
- Used for: Importing essays and rubrics from user's Drive
- Permissions: Read access to documents

### Gemini AI
- API Key: Required (GEMINI_API_KEY environment variable)
- Model: gemini-2.5-pro for essay evaluation
- Used for: Analyzing essays against rubrics and generating feedback

## Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, Wouter, TanStack Query
- **Backend**: Express.js, Node.js
- **AI**: Google Gemini 2.5 Pro
- **Storage**: In-memory (MemStorage) - easily upgradable to PostgreSQL
- **File Management**: Google Drive API

## Recent Changes
- 2025-01-18: Complete frontend implementation with all pages and components
- 2025-01-18: Schema definition for essays, rubrics, and evaluations
- 2025-01-18: Google Drive connector authorized
- 2025-01-18: Project initialization

## User Preferences
- Clean, professional educational interface
- Supportive, encouraging feedback tone
- Google Drive integration for easy file access
- AI-powered essay evaluation with detailed feedback

## Next Steps
1. Implement Gemini AI service for essay grading
2. Build API endpoints for essay submission and evaluation
3. Integrate Google Drive file picker
4. Connect frontend to backend APIs
5. Add loading states and error handling
6. Test complete user journey
