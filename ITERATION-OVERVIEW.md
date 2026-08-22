# EchoBody — 36-Hour Challenge Iteration Overview

**Project Name:** EchoBody  
**Tagline:** An interactive teaching platform to help educators design and deliver high-quality puberty and consent education courses  
**URL:** https://azaleaesme1111.github.io/EchoBody/  
**Repository:** https://github.com/azaleaesme1111/EchoBody

---

## 1. Pre-Event Foundation (Before the 36-Hour Challenge)

The pre-event codebase was a skeleton prototype with placeholder pages and mock authentication:

### What Existed Before
| Module | Pre-Event State |
|---|---|
| **Course Design** | Placeholder page — listed features but no functionality |
| **Role Play** | Placeholder page — listed scenarios but no game logic |
| **Mini Games** | Placeholder page — no quiz or interaction |
| **Anonymous Box** | Placeholder page — no Q&A functionality |
| **FAQ** | Placeholder page — no content yet |

### Pre-Event Tech
- React 19 + TypeScript + Vite + Tailwind CSS + React Router
- Mock auth (localStorage-based, no real backend)
- Chinese UI text throughout
- No Supabase, no AI integration, no PWA, no deployment

---

## 2. 36-Hour Event Additions

### 2.1 Supabase Backend Configuration

**Database Schema** (`database-init.sql`, `supabase-assignments-setup.sql`):
- `profiles` table — user profiles linked to Supabase Auth, auto-created on signup
- `anonymous_questions` table — student questions with teacher replies, RLS policies
- `assignments` table — teacher-created lessons with 6-character join codes
- `assignment_submissions` table — student progress tracking (reading, quiz, Q&A steps), supports anonymous (unauthenticated) submissions

**Supabase Client** (`src/utils/supabase.ts`):
- Initialized with project URL and anon key via environment variables
- Auth state subscription for real-time session management
- RLS policies configured for all tables (public read, authenticated write, teacher-only assignment creation)

**Environment Variables** (`.env`):
```
VITE_SUPABASE_URL=https://ibbyuaabgtlemgfortyt.supabase.co
VITE_SUPABASE_ANON_KEY=[project anon key]
```

**Supabase Edge Functions** (4 functions deployed):
| Function | Purpose | AI Model |
|---|---|---|
| `ai-lesson` | Generate/refine lesson plans + PPT slides | Google Gemini (Flash) |
| `ai-dialogue` | Generate context-aware NPC responses | Google Gemini |
| `ai-parse-intent` | NLU intent classification (safety gate) | Google Gemini |
| `ai-suggest-replies` | Generate 2 AI suggestion replies | Google Gemini |

---

### 2.2 Authentication System (Real Backend Integration)

**What changed**: Replaced mock localStorage auth with real Supabase Auth.

- **`AuthProvider.tsx`** — Full Supabase auth context with `signInWithPassword`, `signUp`, session persistence, profile fetching
- **`LoginPage.tsx`** — Email/password login with role selector (teacher/student), guest mode option, Supabase error mapping
- **`RegisterPage.tsx`** — Name/email/password registration with role selection, profile auto-creation via DB trigger
- **`AuthModal.tsx`** — Reusable login/register modal (accessible from header) with tab switching

---

### 2.3 Course Design — AI-Powered Lesson Generator

**What changed**: Replaced placeholder with a full AI lesson design tool.

**New Features**:
- **AI Lesson Plan Generator** — Inputs: topic, grade/age, duration, gender focus (Co-ed/Girls-only/Boys-only), plus optional advanced settings (school setting, class size, teaching style)
- **Gender-adaptive content** — Content fundamentally changes based on gender focus (girls-only covers menstrual health/body image; boys-only covers emotional literacy/toxic masculinity)
- **AI Refine Chat** — Conversational loop: "Make the activity shorter", "Use simpler language", etc.
- **PPT Slide Generator** — Converts lesson plan into 8-12 structured slides
  - 12 layout types: hero, three_cards, scenario, compare, before_after, big_number, question, process, scale, reflection, takeaways, visual_explanation
  - Auto-inferred grade level → typography (Fredoka/Comic Neue for elementary, Inter for middle/high school)
- **Slide Viewer** (`SlideViewer.tsx`) — Full-screen presentation with keyboard navigation, theme picker (3 color palettes: Warm Cream / Soft Sage / Ocean Breeze)
- **PPTX Export** via `pptxgenjs` (real `.pptx` download)
- **PDF Export** via browser print with `@media print` styles

---

### 2.4 Role Play — Full FSM Game Engine (Built from Scratch)

**What changed**: Entire module built from placeholder to a complete interactive game.

**New Files**:
- `src/services/roleplay/fsEngine.ts` — FSM state machine engine
- `src/services/roleplay/llmService.ts` — AI intent parsing + dialogue generation
- `src/types/roleplay.ts` — TypeScript types for game state
- `src/constants/roleplayScenarios.ts` — 4 complete game scenarios with node definitions

**Game Architecture**:
- **FSM Engine** — Tracks `currentNodeId`, `round`, `assertiveness` (0-100), `risk` (0-100)
- **Dynamic Value Formulas**:
  - `A_{t+1} = Clamp(A_t + ΔA × k_pressure, 0, 100)`
  - `R_{t+1} = Clamp(R_t + ΔR × (1 - A_{t+1}/100), 0, 100)`
  - Pressure coefficient by difficulty: easy 0.7, medium 1.0, hard 1.4
- **Win/Lose Conditions**: Victory if assertiveness ≥ 80; Defeat if risk ≥ 90 or rounds exceed 10
- **Two-Layer Safety Isolation**:
  - Layer 1: NLU parser classifies input (REFUSE_FIRM/REFUSE_WEAK/DEFLECT/COMPLY/UNKNOWN)
  - Layer 2: FSM gate — if intent is UNKNOWN or safety boundary not maintained, FSM does NOT transition; triggers safety reply instead
- **Offline Fallback**: `parseIntentOffline()` and `generateNpcResponseOffline()` use keyword rules when AI is unavailable
- **AI NPC Dialogue**: Edge function generates contextual NPC responses based on parsed intent
- **AI Suggestions**: 2 context-aware reply suggestions generated per turn

**4 Game Scenarios**:
| Scenario | Difficulty | Nodes | Target |
|---|---|---|---|
| Boundaries with Someone You Know | Easy | 7 | Set clear boundary with uncle |
| Online Social Safety | Medium | 6 | Refuse inappropriate photo requests |
| Consent | Medium | 6 | Communicate discomfort with physical intimacy |
| Harassment in Public | Hard | 7 | Seek help during public harassment |

---

### 2.5 Anonymous Box — Interactive Q&A System

**What changed**: Replaced placeholder with functional Q&A.

- Students submit anonymous questions (text area + submit)
- Public/private toggle for each question
- Teachers can reply directly; reply shows with teacher name
- Filter tabs: All / Pending / Answered
- "Make public" toggle to convert teacher-only to class discussion

---

### 2.6 FAQ Module

**What changed**: Replaced placeholder with 6 complete Q&A entries.

- Questions: "Where do I come from?", "What is liking?", "What is Consent?", "What if someone makes me uncomfortable?", "What if someone asks for photos?", "My body is changing"
- Age filtering (Elementary / Middle School / High School)
- Search functionality
- Each answer includes: content, teaching tips, suggested activity
- Expandable accordion UI with copy/export buttons

---

### 2.7 Mini Games — Consent Judgment Quiz

**What changed**: Replaced placeholder with a 4-question interactive quiz.

- Scenario-based multiple choice questions about consent
- Instant feedback with explanations for each answer
- Score tracking and completion screen
- Attempt retry functionality

---

### 2.8 Teacher Dashboard & Student Check-in System

**What changed**: Complete new feature built during the event.

- **`TeacherDashboard.tsx`** — Teachers view their assignments, student completion stats, CSV export, anonymous question summary
- **`CheckinPage.tsx`** — Student check-in via 6-character join code
  - Step 1: Read the AI-generated lesson plan
  - Step 2: Take a 5-question scenario quiz (different from Mini Games)
  - Step 3: Submit an anonymous question (or skip)
  - Supports anonymous (unauthenticated) students via name entry
  - Real-time progress tracking with Supabase persistence
  - LocalStorage resume for returning students

---

### 2.9 Visual Identity & UI Polish

- **`Logo.tsx`** — Custom SVG logo (3 wave lines, violet color, 3 size variants)
- All UI text translated from Chinese to English
- Responsive mobile navigation (bottom tab bar)
- Sticky header with blur backdrop
- Gradient hero section on home page
- Teacher dashboard stats on home page

---

### 2.10 Deployment & Infrastructure

- **GitHub Pages deployment** configured with `/EchoBody/` base path
- **PWA support** — `manifest.json`, service worker (`sw.js`), offline-capable
- **Dependencies added**: `@supabase/supabase-js`, `lucide-react`, `pptxgenjs`, `i18next`
- **ESLint config** for TypeScript/React
- **PostCSS + Tailwind** configuration
- **Environment configuration** for Supabase credentials

---

## 3. Pre-Event vs. Post-Event Comparison

| Feature | Pre-Event | Post-Event |
|---|---|---|
| **Course Design** | Placeholder (feature list only) | AI lesson generator + refine chat + 12-layout PPT generator + PPTX/PDF export |
| **Role Play** | Placeholder (feature list only) | Full FSM game engine + 4 scenarios + AI NPC + 2-layer safety guardrails |
| **Mini Games** | Placeholder | 4-question consent quiz with instant feedback |
| **Anonymous Box** | Placeholder | Interactive Q&A with submit/reply/filter |
| **FAQ** | Placeholder | 6 age-filtered Q&A entries with activities |
| **Auth** | Mock localStorage | Real Supabase Auth with profile table |
| **Teacher Dashboard** | None | Assignment management + student progress tracking + CSV export |
| **Student Check-in** | None | Join-code based 3-step lesson + quiz + Q&A flow |
| **AI Backend** | None | 4 Supabase Edge Functions (Gemini-powered) |
| **PPT Export** | None | Real PPTX via pptxgenjs with grade-adaptive themes |
| **PWA** | None | Service worker + manifest |
| **Localization** | Chinese | Fully translated to English |
| **Deployment** | None | GitHub Pages with base path |

---

## 4. Technical Architecture

```
Frontend (Vite + React 19 + TypeScript)
├── Pages: HomePage, CourseDesign, RolePlay, MiniGames, AnonymousBox, FAQ, LoginPage, RegisterPage, TeacherDashboard, CheckinPage
├── Components: Layout, AuthModal, Logo, SlideViewer, StylePickerModal
├── Services: roleplay/fsEngine.ts, roleplay/llmService.ts
├── Providers: AuthProvider (Supabase), ThemeProvider
├── Constants: modules.ts, roleplayScenarios.ts
├── Utils: supabase.ts
└── Router: React Router v7 with /EchoBody/ base path

Backend (Supabase Edge Functions — Deno)
├── ai-lesson: Generate/refine lesson plans + PPT slides → Google Gemini
├── ai-dialogue: NPC dialogue generation → Google Gemini
├── ai-parse-intent: NLU safety gate → Google Gemini
└── ai-suggest-replies: 2 AI suggestion options → Google Gemini

Database (Supabase PostgreSQL + RLS)
├── profiles: user_id, name, role
├── anonymous_questions: content, is_public, answered, reply
├── assignments: join_code, teacher_id, title, lesson_content
└── assignment_submissions: student_name, step progress, quiz score
```

---

## 5. Team Responsibilities

| Member | Responsibilities |
|---|---|
| **Frontend Development** | All React pages, components, routing, state management, responsive design |
| **Supabase Configuration** | Database schema, RLS policies, auth setup, environment variables |
| **AI Backend Development** | 4 Edge Functions (Deno/TypeScript), Gemini API integration, prompt engineering |
| **Game Engine Design** | FSM architecture, safety isolation layers, scenario design, offline fallbacks |
| **Content & Curriculum** | FAQ content, quiz questions, scenario dialogues, game node definitions |
| **UI/UX Design** | Logo, color system, typography, slide themes, responsive layouts |
| **Deployment & DevOps** | GitHub Pages setup, PWA configuration, base path handling, build pipeline |

---

## 6. Future Plans

- **Content Expansion**: More role-play scenarios, quiz questions, FAQ entries across age groups
- **Real-time Collaboration**: Live teacher-student interaction during check-in sessions
- **Advanced Analytics**: Student performance dashboards, learning progression tracking
- **Multi-language Support**: Full i18n implementation for non-English speaking regions
- **Video Integration**: Embedded demo videos within lesson plans
- **Offline PWA**: Full offline support with cached scenarios and lessons
- **Admin Panel**: Content management, user moderation, system configuration
