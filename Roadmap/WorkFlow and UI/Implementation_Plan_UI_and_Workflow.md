# Implementation Plan: UI/UX Modernization & Workflow Enhancements

## 🎯 Executive Goal & Proposal Alignment

The objective is to overhaul the **SkillMatch AI Mobile Client (React Native / Expo)** to transform the functional prototype into a state-of-the-art, visually stunning, dark-glassmorphism mobile application that directly delivers on the 5 core objectives defined in the **SkillMatch AI Proposal & Technical Roadmap**:

1. **Objective 1 (Intelligent Ingestion & Human-in-the-Loop)**: Seamless drag-and-drop / picker resume upload (PDF/DOCX) with real-time parsing progress indicators, followed by categorized, interactive skill chips (Languages, Frameworks, Databases) for candidate verification.
2. **Objective 2 (Dual-Sourced Opportunity Discovery)**: Merged recommendation feed with clear source attribution (`via app` vs `via JSearch`), job type pills (`Internship`, `OJT`), and search/filter controls.
3. **Objective 3 (Explainable AI Match Breakdown)**: Circular gradient match score gauges (e.g. `88%` in emerald, `71%` in amber) with explicit $\checkmark$ matched skills and amber missing skills alerts.
4. **Objective 4 (Visual Application Tracking)**: 5-step connected recruitment progression timeline (`Sub` $\rightarrow$ `Rev` $\rightarrow$ `Short` $\rightarrow$ `Interv` $\rightarrow$ `Accept`) with active node pulses and timestamps.
5. **Objective 5 (Streamlined Employer Experience)**: High-density recruiter dashboard with AI-ranked candidate applicant cards, candidate dossier preview, and 1-click status progression with automated student notifications.

---

## 🎨 Design System & Aesthetic Standard

We will establish a unified **Design Token & Theme System** matching the HTML mockups in `Roadmap/WorkFlow and UI/`:

- **Canvas Background**: `#090D16` (Deep Obsidian / Midnight Slate)
- **Surface Cards**: `#111827` (Card Charcoal) with `#1F2937` borders and subtle elevation
- **Primary Brand / Accent**: `#6366F1` (Electric Indigo) & `#4338CA` (Dashed Borders)
- **Success / Match High**: `#10B981` (Emerald) & `#052E22` (Glow Background)
- **Warning / Match Moderate**: `#F59E0B` (Amber) & `#3A2A05` (Glow Background)
- **Danger / Terminal**: `#EF4444` (Rose)
- **Typography Tokens**: High-contrast, clean sans-serif typography with dedicated display scales for titles (`18px-24px`, bold), body text (`13px-14px`), and metadata labels (`10.5px-12px`).

---

## 📋 Screen-by-Screen UI/UX Overhaul Specifications

### 1. Resume Ingestion & Parsing (`ResumeUploadScreen.tsx`)
- **Visual Spec (matching `resume_upload_screen_mockup.html`)**:
  - Dotted/dashed purple dropzone (`#4338CA`) with cloud-upload icon.
  - Selected file metadata card (`filename.pdf`, size `248 KB · selected`).
  - Active scanning state with animated linear progress bar (`bar` / `fill`) and multi-stage status text (*"Extracting skills, education, experience..."*).
  - Clean error states for invalid file types or files exceeding 5MB.

### 2. Skills Verification & Review (`ResumeReviewScreen.tsx`)
- **Visual Spec (matching `resume_review_screen_mockup.html`)**:
  - Categorized skill chip sections: `LANGUAGES`, `FRAMEWORKS`, `DATABASES`, `TOOLS`.
  - Dismissible rounded pill chips (`#1F2937` background, `#312E81` border, `#E0E7FF` text) with '×' delete icon.
  - Inline skill search & add bar with search icon to add custom skills easily.
  - Prominent full-width action button: *"Save & activate profile"*.

### 3. Opportunities & Hybrid Recommendation Feed (`RecommendationFeedScreen.tsx`)
- **Visual Spec (matching `recommendation_feed_screen_mockup.html`)**:
  - Header with title *"Opportunities"*, subtitle *"Internal postings + external listings"*, and filter icon.
  - Glassmorphic opportunity cards containing:
    - Circular match badge (`40x40px`, e.g. `88%` with `#10B981` border/text or `71%` with `#F59E0B` border/text).
    - Job Title (`#F9FAFB`, `14px`, medium weight), Company & Location (`#9CA3AF`, `12px`).
    - Pill tags (`Internship`, `OJT`, `via app`, `via JSearch`).
    - Green $\checkmark$ matched skills (`#10B981`) and amber missing skills (`#F59E0B`).
  - Pull-to-refresh and shimmer skeleton loading placeholders.

### 4. Application Tracker Screen (`ApplicationTrackerScreen.tsx`)
- **Visual Spec (matching `application_tracker_screen_mockup.html`)**:
  - Title *"Your applications"* with active count.
  - Connected 5-step horizontal recruitment stepper:
    - Node 1: `Sub` (Submitted)
    - Node 2: `Rev` (Under Review)
    - Node 3: `Short` (Shortlisted)
    - Node 4: `Interv` (Interview Scheduled)
    - Node 5: `Accept` (Accepted / Offer Extended)
  - Completed steps rendered in emerald (`#10B981`) with $\checkmark$, current active step in indigo (`#6366F1`) with step number, and upcoming steps in muted gray (`#1F2937`).
  - Connecting line segments (`seg`) that fill with color as progress advances.
  - Last updated relative timestamp (*"updated 2 days ago"*).

### 5. Employer Postings & Applicants (`EmployerPostingsScreen.tsx` & `EmployerApplicantsScreen.tsx`)
- **Visual Spec**:
  - Clean card lists of active company vacancies with badge displaying applicant count.
  - Modal with streamlined form to publish vacancies with instant taxonomy skill tags.
  - AI-Ranked applicant review screen sorted descending by match affinity.
  - Candidate cards showing match score badge, matched/missing skill chips, candidate notes, and 1-click status progression toolbar (`Shortlist`, `Interview`, `Accept`, `Reject`).
  - In-app notification feedback whenever recruiter updates candidate status.

### 6. Authentication & Onboarding (`LoginScreen.tsx` & `RegisterScreen.tsx`)
- **Visual Spec**:
  - Branded header with logo and tagline.
  - Segmented role selector tabs (`Student` vs `Employer`) with visual selection feedback.
  - Polished text inputs with floating label effects, focus states, and secure password toggles.

---

## 🛠️ Proposed Changes & File Architecture

### Component & Theme Layer (New Reusable UI System)

#### [NEW] [colors.ts](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/theme/colors.ts)
- Centralized palette tokens: `background`, `surface`, `border`, `primary`, `success`, `warning`, `danger`, `textPrimary`, `textMuted`.

#### [NEW] [typography.ts](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/theme/typography.ts)
- Font scales, line heights, font weights for headings, subheadings, labels, and chip text.

#### [NEW] [ScoreBadge.tsx](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/components/common/ScoreBadge.tsx)
- Reusable circular score badge with dynamic green/amber/slate colors matching the mockup (`40x40px`, border + background tint).

#### [NEW] [StatusStepper.tsx](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/components/common/StatusStepper.tsx)
- 5-step horizontal progression line with nodes, segment connectors, and step labels (`Sub`, `Rev`, `Short`, `Interv`, `Accept`).

#### [NEW] [SkillChip.tsx](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/components/common/SkillChip.tsx)
- Dismissible and display-only skill chips with optional category colors and delete icons.

---

### Screen Layer (UI & Interaction Overhaul)

#### [MODIFY] [ResumeUploadScreen.tsx](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/screens/resume/ResumeUploadScreen.tsx)
- Implement dashed dropzone, selected file card, animated linear parsing progress bar, and modern active resume overview.

#### [MODIFY] [ResumeReviewScreen.tsx](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/screens/resume/ResumeReviewScreen.tsx)
- Implement categorized skill sections (`LANGUAGES`, `FRAMEWORKS`, `DATABASES`, `TOOLS`), dismissible chips, inline add-skill search input, and full-width save action.

#### [MODIFY] [RecommendationFeedScreen.tsx](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/screens/jobs/RecommendationFeedScreen.tsx)
- Implement mockup card layout with circular `ScoreBadge`, source and job type tags, color-coded matched vs missing skills, and filter toolbar.

#### [MODIFY] [ApplicationTrackerScreen.tsx](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/screens/applications/ApplicationTrackerScreen.tsx)
- Implement `StatusStepper` on each application card with relative timestamps and status change alerts.

#### [MODIFY] [EmployerPostingsScreen.tsx](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/screens/employer/EmployerPostingsScreen.tsx)
- Modernize job vacancy list, applicant count badges, and clean multi-step job creation modal.

#### [MODIFY] [EmployerApplicantsScreen.tsx](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/screens/employer/EmployerApplicantsScreen.tsx)
- Modernize AI-ranked candidate list, score badges, skill breakdowns, and 1-click status advancement buttons.

#### [MODIFY] [LoginScreen.tsx](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/screens/auth/LoginScreen.tsx) & [RegisterScreen.tsx](file:///c:/Users/ajcj1/OneDrive/Desktop/hunting/Ai-hunt/mobile/src/screens/auth/RegisterScreen.tsx)
- Modernize typography, input borders, role segmented buttons, and action buttons with consistent theme tokens.

---

## 🧪 Verification Plan

### Automated Type & Build Checks
```powershell
# 1. Verify TypeScript type safety in mobile app (0 errors)
cd mobile
$nodePath = "$env:APPDATA\fnm\node-versions\v24.20.0\installation"
$env:Path = "$nodePath;$env:Path"
npx tsc --noEmit

# 2. Verify all backend unit and integration tests (32 of 32 passing)
cd ../backend
.venv\Scripts\python -m pytest tests -v
```

### Manual & Visual Verification
1. **Resume Upload**: Upload a test PDF $\rightarrow$ verify the animated progress bar $\rightarrow$ verify seamless transition to `ResumeReviewScreen`.
2. **Skill Editing**: Remove a skill chip $\rightarrow$ add a new skill via search bar $\rightarrow$ verify profile activation.
3. **Recommendation Feed**: Check score badge colors (green $\ge 80\%$, amber $< 80\%$), verify green matched skills $\checkmark$ and amber missing skills.
4. **Application Stepper**: Apply to a job $\rightarrow$ check `ApplicationTrackerScreen` to verify the 5-step stepper highlights step 1 (`Sub`).
5. **Employer Review**: Log in as employer $\rightarrow$ view ranked applicants $\rightarrow$ advance candidate to `Interview Scheduled` $\rightarrow$ verify student stepper updates to step 4 (`Interv`).
