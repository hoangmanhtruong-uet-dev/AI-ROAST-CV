# Project: AI Roast CV

## Architecture
AI Roast CV is a privacy-first web application built with **Next.js (App Router, TypeScript, Tailwind CSS)** and **Google Gemini Flash (`@google/genai`)** designed for Vietnamese final-year students and freshers.

```
                           ┌──────────────────────────────────────────────┐
                           │            Client (Next.js / React)          │
                           │  - Landing & Feature Chooser (R1)            │
                           │  - CV Upload / OCR Edit / Roast UI (R2)      │
                           │  - Stress Interview & Timer Engine (R3)      │
                           │  - 1-Click Wipe Data & State (R4)            │
                           │  - Client-Side HTML5 Canvas Share Card (R4)  │
                           └──────────────────────┬───────────────────────┘
                                                  │ Clean JSON (zero retention)
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │          Next.js Route Handlers (API)        │
                           │  - POST /api/fakedoor (Email lead capture)   │
                           │  - POST /api/extract (OCR / Multimodal)      │
                           │  - POST /api/roast (Spicy / Constructive)    │
                           │  - POST /api/interview/question (Scenarios)  │
                           │  - POST /api/interview/evaluate (4 Rubrics)  │
                           │  - Zero-PII Server Logging Middleware        │
                           └──────────────────────┬───────────────────────┘
                                                  │ Sanitized Prompt & Delimiters
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │     Google Gemini Flash (@google/genai)      │
                           │  - Structured JSON Outputs with Zod Schemas  │
                           │  - Strict Placeholder [...] Enforcement      │
                           │  - Prompt Injection Containment (<tags>)     │
                           └──────────────────────────────────────────────┘
```

### Key Architectural Tenets
1. **Zero Retention & Absolute Privacy**: No CV content, interview answers, or candidate PII is ever written to a database or server log file.
2. **Client-Side Canvas Share Card**: Card generation and PII redaction occur 100% in the browser using HTML5 Canvas API, avoiding server-side native dependencies and eliminating data transmission risks.
3. **Robust AI Guardrails**: Strict XML delimiter isolation (`<candidate_cv>`, `<candidate_answer>`), mandatory placeholder notation (`[...]`) forbidding fabricated metrics, and structured schema verification.
4. **Dual Track Execution**: Parallel Implementation Track and independent requirement-driven E2E Testing Track.

---

## Feature Inventory

Every discovered feature is explicitly assigned to a milestone below:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Responsive Vietnamese Web Shell & Brand UI | Responsive header, footer, dark/light modern typography, and brand layout | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Hero Section with AI Limitation Disclaimer | Clear value proposition and explicit disclaimer: practice only, does not guarantee job or ATS pass | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Privacy Commitment Banner | Prominent guarantee of zero server storage and safe local processing | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Dual Feature Chooser | Interactive toggle/cards to choose between Roast CV and Phỏng vấn áp lực | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Fake Door Test Modal (29,000 VND) | Demand measurement modal capturing interested student emails for the Pro tier | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Fake Door Route Handler (`/api/fakedoor`) | Validates email format and stores lead without exposing sensitive info | M1 | ORIGINAL_REQUEST §R1 |
| 7 | Multi-Format CV Input | Supports PDF, PNG, JPG (<= 5MB, 1 page limit) and direct plain text paste | M2 | ORIGINAL_REQUEST §R2 |
| 8 | File Size & MIME Magic-Byte Validation | Enforces <= 5MB, checks MIME type and magic bytes on client and server | M2 | ORIGINAL_REQUEST §R2, §Security |
| 9 | Multimodal OCR Extraction | Uses Gemini Flash (`@google/genai`) to parse text from uploaded images/PDFs | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Editable OCR Preview Screen | Dedicated screen allowing users to review and edit extracted text before sending to AI | M2 | ORIGINAL_REQUEST §R2 |
| 11 | Dual Tone Selector | Allows toggling between "Cà khịa / Sát thủ" (Spicy) and "Chuyên gia tận tâm" (Constructive) | M2 | ORIGINAL_REQUEST §R2 |
| 12 | Prompt Injection Defense | XML delimiter containment (`<candidate_cv>`) preventing instructions override | M2 | ORIGINAL_REQUEST §Security |
| 13 | Anti-Hallucination Placeholder Enforcement | Guarantees AI suggestions use placeholders `[...]` (e.g. `[số liệu cụ thể]`) and never fabricate achievements | M2 | ORIGINAL_REQUEST §R2 |
| 14 | Structured Roast API (`POST /api/roast`) | Returns structured JSON (score, summary, weaknesses with quotes/severity/fixes, ATS tips) validated by Zod | M2 | ORIGINAL_REQUEST §R2 |
| 15 | ATS Keyword & Structural Review | Provides actionable advice on formatting, section headers, and ATS scanability | M2 | ORIGINAL_REQUEST §R2 |
| 16 | Role Chooser (IT vs Marketing) | Allows user to select between "IT / Software Engineer" and "Marketing / Business" tracks | M3 | ORIGINAL_REQUEST §R3 |
| 17 | 3-Question Situation Pressure Flow | Delivers 3 consecutive high-stakes situational dilemma questions | M3 | ORIGINAL_REQUEST §R3 |
| 18 | Per-Question Countdown Timer (60s-90s) | Visual timer with warning indicators and automatic submit upon reaching 0s | M3 | ORIGINAL_REQUEST §R3 |
| 19 | Emergency Session Controls (Skip & Quit) | "Bỏ qua" (Skip current question) and "Dừng phỏng vấn" (Quit session immediately) controls | M3 | ORIGINAL_REQUEST §R3 |
| 20 | 4-Criteria Rubric Scoring (`/api/interview/evaluate`) | Evaluates answer on STAR structure, specificity/evidence, question relevance, and consequence mindset | M3 | ORIGINAL_REQUEST §R3 |
| 21 | Session Summary & Probing Questions | Final report card with strengths, improvements, follow-up deep-dive questions, and pressure disclaimer | M3 | ORIGINAL_REQUEST §R3 |
| 22 | Zero Server-Side Logging of PII | Custom server logger omitting raw CV and answer contents from server logs | M4 | ORIGINAL_REQUEST §R4, §Security |
| 23 | 1-Click Wipe Data | Instant purge button clearing LocalStorage, SessionStorage, and component state | M4 | ORIGINAL_REQUEST §R4 |
| 24 | Automatic PII Anonymization Engine | Redaction engine masking Vietnamese phone numbers, emails, names, and links | M4 | ORIGINAL_REQUEST §R4 |
| 25 | HTML5 Canvas Share Card Generator | Client-side visual card generator with score badge, highlight quote, and critique | M4 | ORIGINAL_REQUEST §R4 |
| 26 | Share Card Preview & PNG Download | Modal allowing card inspection and one-click PNG download with strictly no auto-posting | M4 | ORIGINAL_REQUEST §R4 |
| 27 | Full E2E Test Suite Pass (Tiers 1-4) & Tier 5 Adversarial Coverage Hardening | Validates 100% pass of E2E test suite and hardens edge-case coverage | M5 | ORIGINAL_REQUEST §Acceptance Criteria |
| 28 | VietQR Dynamic Payment Generation | Generates order, transfer description, and bank QR code | M6 | Extension §Payment |
| 29 | SePay Webhook Auto-Confirmation | Receives and validates SePay transactions, auto-verifying payment in 3-5s | M6 | Extension §Payment |
| 30 | License Key Issuance & Activation | Issues `PRO-XXXX-YYYY` license keys and allows restoring Pro status | M6 | Extension §Payment |
| 31 | VietQR Checkout Modal & Sandbox Simulator | Interactive checkout UI with QR, copy info, live polling, and dev simulator | M6 | Extension §Payment |
| 32 | Pro Entitlement State & Badges | Unlocks unlimited Roast pages, deep ATS audit, and Pro badges in app | M6 | Extension §Payment |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | E2E Testing Track | Independent E2E test suite creation (Tiers 1-4, test runner, mock fixtures, TEST_READY.md) | none | IN_PROGRESS |
| M1 | Foundation & Brand UI (R1) | Next.js scaffold, Tailwind, Hero, Disclaimer, Feature Chooser, Fake Door Modal & API, Vitest harness | none | DONE |
| M2 | Roast CV Engine (R2 + R5) | File upload (PDF/PNG/JPG <= 5MB), OCR extract, Editable preview, Dual tone, Prompt defense, Roast API | M1 | DONE |
| M3 | Stress Interview Engine (R3) | Role selection, 3-question situation engine, 60s-90s timer, Skip/Stop, Rubric evaluation API, Summary report | M1 | DONE |
| M4 | Privacy, Wipe Data & Share Card (R4) | Zero-PII logging, 1-click Wipe Data, PII regex masking, HTML5 Canvas Share Card preview & PNG download | M2, M3 | DONE |
| M5 | Final Milestone: E2E Verification & Hardening | Phase 1: Pass 100% test suite (356/356 tests). Phase 2: Adversarial Coverage Hardening | M0, M4 | DONE |
| M6 | VietQR / SePay Payment & Pro Engine | Order creation, VietQR rendering, SePay webhook, License Key store, Checkout Modal & Pro unlock | M1, M2, M3, M4 | IN_PROGRESS |

---

## Interface Contracts

### 1. Fake Door API (`POST /api/fakedoor`)
- **Request**:
  ```typescript
  export interface FakeDoorRequest {
    email: string;
    tier: 'pro_29k';
    featureInterest?: 'deep_interview' | 'ats_rewrite' | 'general';
  }
  ```
- **Response**:
  ```typescript
  export interface FakeDoorResponse {
    success: boolean;
    message: string;
  }
  ```

### 2. File Extract API (`POST /api/extract`)
- **Request**: `FormData` with field `file` (PDF, PNG, JPG <= 5MB) or JSON `{ text: string }`.
- **Response**:
  ```typescript
  export interface ExtractApiResponse {
    success: boolean;
    extractedText?: string;
    pageCount?: number;
    error?: string;
  }
  ```

### 3. Roast CV API (`POST /api/roast`)
- **Request**:
  ```typescript
  export interface RoastApiRequest {
    cvText: string;
    tone: 'spicy' | 'constructive';
    targetRole?: string;
  }
  ```
- **Response**:
  ```typescript
  export interface WeaknessItem {
    quote: string;
    issue: string;
    severity: 'Cao' | 'Trung bình' | 'Thấp';
    rejectionReason: string;
    fixGuideline: string; // Must contain [...] placeholder, no fabricated facts
  }

  export interface AtsRecommendation {
    category: 'Cấu trúc' | 'Từ khóa' | 'Định dạng' | 'Độ dài';
    recommendation: string;
    impact: 'Quan trọng' | 'Nên làm';
  }

  export interface RoastApiResponse {
    success: boolean;
    data?: {
      overallScore: number; // 0 - 100
      tone: 'spicy' | 'constructive';
      summaryVerdict: string;
      topStrengths: string[];
      weaknesses: WeaknessItem[];
      atsRecommendations: AtsRecommendation[];
      disclaimer: string;
    };
    error?: string;
  }
  ```

### 4. Stress Interview Question API (`POST /api/interview/question`)
- **Request**:
  ```typescript
  export interface InterviewQuestionRequest {
    role: 'it' | 'marketing';
    questionIndex: 1 | 2 | 3;
  }
  ```
- **Response**:
  ```typescript
  export interface InterviewQuestionResponse {
    success: boolean;
    data?: {
      questionId: string;
      role: 'it' | 'marketing';
      questionIndex: 1 | 2 | 3;
      title: string;
      scenario: string;
      pressureContext: string;
      timeLimitSeconds: number; // 60 - 90
    };
    error?: string;
  }
  ```

### 5. Stress Interview Evaluate API (`POST /api/interview/evaluate`)
- **Request**:
  ```typescript
  export interface InterviewEvaluateRequest {
    role: 'it' | 'marketing';
    questionId: string;
    questionIndex: 1 | 2 | 3;
    questionScenario: string;
    candidateAnswer: string;
    timeSpentSeconds: number;
  }
  ```
- **Response**:
  ```typescript
  export interface RubricCriterionScore {
    name: 'Cấu trúc STAR & Mạch lạc' | 'Tính cụ thể & Dẫn chứng' | 'Mức độ liên quan & Đúng trọng tâm' | 'Nhận thức hệ quả & Tư duy xử lý';
    score: number; // 1 to 10
    feedback: string;
  }

  export interface InterviewEvaluateResponse {
    success: boolean;
    data?: {
      questionIndex: 1 | 2 | 3;
      rubricScores: RubricCriterionScore[];
      averageScore: number;
      strengths: string[];
      improvements: string[];
      followUpQuestion: string;
      simulatedPressureVerdict: string;
    };
    error?: string;
  }
  ```

### 6. Client-Side Share Card Contract & PII Redactor
- **Input**:
  ```typescript
  export interface ShareCardPayload {
    type: 'roast' | 'interview';
    title: string;
    score: number;
    quoteOrHighlight: string;
    summary: string;
    rawPiiText?: string; // Text to be automatically masked
  }
  ```
- **PII Masking Rules**:
  - Phone: `(0|\+84)(3|5|7|8|9)[0-9]{8}` -> replaced with `09****[last4]`
  - Email: `[name]@[domain]` -> replaced with `n***[initial]@domain`
  - URL: portfolio links -> replaced with `[Link ẩn danh]`
- **Output**: Rendered HTML5 Canvas element -> `toBlob('image/png')` -> downloadable PNG.

---

## Code Layout

```text
AI ROAST CV/
├── .env.example                       # Sample environment variables
├── .env.local                         # Local environment variables (GEMINI_API_KEY)
├── package.json                       # Next.js, TypeScript, Tailwind, @google/genai, Zod, Lucide
├── tsconfig.json                      # Strict TypeScript configuration
├── tailwind.config.ts                 # Tailwind styling rules
├── postcss.config.mjs                 # PostCSS setup
├── vitest.config.ts                   # Vitest unit/integration configuration
├── playwright.config.ts               # Playwright E2E configuration
├── app/
│   ├── layout.tsx                     # Root layout with Vietnamese font and meta tags
│   ├── page.tsx                       # Landing page (Hero, Disclaimer, Feature Chooser, Fake Door CTA)
│   ├── globals.css                    # Tailwind CSS globals
│   ├── roast/
│   │   └── page.tsx                   # Roast CV interactive experience (Upload, OCR Preview, Results)
│   ├── interview/
│   │   └── page.tsx                   # Stress Interview experience (Role picker, Timer, Questions, Report)
│   └── api/
│       ├── fakedoor/route.ts          # POST /api/fakedoor
│       ├── extract/route.ts           # POST /api/extract (OCR multimodal)
│       ├── roast/route.ts             # POST /api/roast (Gemini Flash analysis)
│       └── interview/
│           ├── question/route.ts      # POST /api/interview/question
│           └── evaluate/route.ts      # POST /api/interview/evaluate
├── components/
│   ├── ui/                            # Buttons, Dialogs, Cards, Badges, Toasts
│   ├── landing/                       # HeroSection, PrivacyBanner, FeatureChooser, FakeDoorModal
│   ├── roast/                         # FileUploader, OcrPreviewModal, ToneSelector, RoastReport
│   ├── interview/                     # RoleChooser, QuestionCard, TimerCountdown, RubricCard, ReportCard
│   ├── privacy/                       # WipeDataButton, PrivacyNotice
│   └── share/                         # CanvasShareCard, SharePreviewModal
├── lib/
│   ├── gemini/                        # @google/genai client initialization & prompt templates
│   ├── schemas/                       # Zod schemas for API validation & AI output parsing
│   ├── utils/                         # PII redactor regex, file validator, formatters
│   ├── logger/                        # Zero-PII safe server logging utility
│   └── storage/                       # Client-side session & wipe data helper
└── tests/
    ├── setup.ts                       # Vitest test setup and env mocking
    ├── unit/                          # Unit tests for schemas, PII masking, file validation
    ├── integration/                   # Integration tests for route handlers and zero-PII logging
    └── e2e/                           # Playwright E2E test suite (Tiers 1 to 4)
```
