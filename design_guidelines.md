# AI Essay Evaluation Assistant - Design Guidelines

## Design Approach
**Selected Approach**: Design System (Material Design) with educational platform influences
**Justification**: Utility-focused productivity tool requiring clarity, consistency, and information hierarchy for students and educators
**Reference Platforms**: Google Classroom (clean educational UI), Notion (content organization), Canvas LMS (academic professionalism)

## Core Design Principles
1. **Clarity First**: Information hierarchy that makes scores, feedback, and progress immediately comprehensible
2. **Supportive Atmosphere**: Warm, encouraging visual language that reduces student anxiety
3. **Efficient Workflows**: Streamlined upload, review, and comparison processes
4. **Trust & Credibility**: Professional presentation befitting an academic tool

## Color Palette

**Light Mode**:
- Primary: 220 90% 50% (Educational blue - trustworthy, professional)
- Primary Hover: 220 90% 45%
- Background: 0 0% 98% (Soft white)
- Surface: 0 0% 100%
- Surface Secondary: 220 20% 97%
- Text Primary: 220 15% 20%
- Text Secondary: 220 10% 45%
- Success: 142 70% 45% (For positive feedback)
- Warning: 38 90% 55% (For improvement areas)
- Border: 220 15% 88%

**Dark Mode**:
- Primary: 220 85% 60%
- Primary Hover: 220 85% 55%
- Background: 220 15% 10%
- Surface: 220 12% 14%
- Surface Secondary: 220 12% 18%
- Text Primary: 220 10% 95%
- Text Secondary: 220 8% 70%
- Success: 142 60% 50%
- Warning: 38 80% 60%
- Border: 220 10% 25%

## Typography

**Font Families**:
- Primary (Interface): 'Inter', system-ui, sans-serif
- Secondary (Content/Essays): 'Merriweather', Georgia, serif
- Code (Rubric Details): 'JetBrains Mono', monospace

**Scale**:
- Hero Headline: text-5xl font-bold (Dashboard welcome)
- Page Title: text-3xl font-bold
- Section Heading: text-2xl font-semibold
- Card Title: text-xl font-semibold
- Body: text-base (essay content, feedback)
- Caption: text-sm (metadata, timestamps)
- Small: text-xs (labels, helper text)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component Padding: p-4, p-6, p-8
- Section Spacing: space-y-6, space-y-8
- Container Max-Width: max-w-7xl (dashboard), max-w-4xl (essay view), max-w-2xl (forms)

**Grid System**:
- Dashboard: 3-column grid on desktop (lg:grid-cols-3), single column mobile
- Essay List: 2-column on tablet (md:grid-cols-2), masonry-style cards
- Progress Charts: Responsive flex layouts

## Component Library

### Navigation
- **Top Header**: Fixed position with logo, user profile, Google Drive sync status
- **Sidebar Navigation** (Desktop): Vertical menu with icons - Dashboard, Submit Essay, History, Settings
- **Mobile Navigation**: Bottom tab bar or hamburger menu
- Background: Surface color with subtle border-b

### Upload Components
- **File Drop Zone**: Large dashed border area (border-2 border-dashed) with icon, centered text
- Active state: Primary color border on drag-over
- **Google Drive Picker Button**: Primary button with Drive icon, opens native picker modal
- **Essay Text Input**: Full-height textarea with monospace font option toggle

### Data Display
- **Score Cards**: Elevated cards (shadow-md) displaying category name, score/max, progress bar
- Use success color for high scores (>85%), warning for needs improvement (<70%)
- **Rubric Display**: Expandable accordion showing criteria with checkmarks/points
- **Feedback Panel**: White/dark surface card with serif font for readability, organized by strengths/weaknesses/suggestions sections

### Progress Tracking
- **Timeline View**: Vertical timeline showing essay submissions with dates, scores
- **Comparison Chart**: Side-by-side score breakdown using simple bar charts
- **Trend Graph**: Line chart showing score progression over time (Chart.js with Material colors)

### Forms
- **Input Fields**: Rounded corners (rounded-lg), subtle border, focused ring in primary color
- Dark mode: Maintain visible borders and backgrounds on all inputs
- **Buttons**: 
  - Primary: Solid primary color, white text, rounded-lg, px-6 py-3
  - Secondary: Outline variant with primary border
  - Danger: Red for delete actions
- **File Upload Cards**: Display filename, size, remove button in compact card format

### Overlays
- **Loading States**: Skeleton screens with subtle shimmer animation for essay analysis
- **Modals**: Centered overlay with backdrop blur, max-w-2xl, rounded-xl
- **Toast Notifications**: Top-right position, slide-in animation, auto-dismiss (success/error states)

## Animations
Use sparingly for functional feedback only:
- Button hover: Subtle scale (hover:scale-105) 
- Card hover: Shadow elevation change (hover:shadow-lg)
- Page transitions: Fade-in (opacity animation, 200ms)
- Loading spinner: Rotate animation for essay processing indicator
- NO scroll-based animations or decorative effects

## Images

**Dashboard Hero** (if included):
- Supportive illustration or abstract educational graphic (books, lightbulb, upward graph)
- Position: Top of dashboard, max-h-64, gradient overlay for text readability
- Style: Minimal, encouraging, not distracting

**Empty States**:
- Simple line illustrations for "No essays yet," "Upload your first essay"
- Centered, muted colors, accompanied by actionable CTA button

**Progress Icons**:
- Achievement badges for milestones (SVG icons from Heroicons)
- Trophy/star icons for improvement streaks

## Accessibility & Dark Mode
- All form inputs maintain visible backgrounds and borders in dark mode
- Focus indicators on all interactive elements (ring-2 ring-primary)
- Sufficient color contrast ratios (WCAG AA minimum)
- Screen reader labels for all icons and interactive elements
- Keyboard navigation support throughout

## Key Screens Layout

**Dashboard**: 
- Welcome header with student name, current streak
- Quick stats cards (3-column grid): Total Essays, Average Score, Improvement Trend
- Recent submissions list with score badges
- Quick upload CTA button (primary, prominent)

**Submit Essay Page**:
- Two-column layout: Left - Essay upload/paste, Right - Rubric upload
- Clear step indicators (1. Upload Essay, 2. Upload Rubric, 3. Submit)
- Preview panels showing uploaded content before submission

**Results Page**:
- Top section: Overall score with circular progress indicator
- Tabbed interface: Detailed Scores | Feedback | Essay View
- Download feedback button (top-right)

**History Page**:
- Filterable list of past submissions (date range, subject)
- Each item shows: Title, date, score, expand for details
- Comparison mode toggle to select 2+ essays for side-by-side view

This design creates a professional, supportive educational environment that prioritizes clarity and efficiency while reducing student anxiety around grading and feedback.