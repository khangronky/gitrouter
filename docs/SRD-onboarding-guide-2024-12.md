# Software Requirements Document (SRD)
# Beginner User Manual Guide - Onboarding Wizard

**Document Version:** 1.0  
**Date:** December 2024  
**Author:** Engineering Team  
**Status:** Proposed  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [User Stories](#4-user-stories)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [User Flow & Wireframes](#7-user-flow--wireframes)
8. [Technical Architecture](#8-technical-architecture)
9. [Database Changes](#9-database-changes)
10. [API Specifications](#10-api-specifications)
11. [Component Structure](#11-component-structure)
12. [Integration Points](#12-integration-points)
13. [Success Metrics](#13-success-metrics)
14. [Implementation Phases](#14-implementation-phases)
15. [Risk Assessment](#15-risk-assessment)
16. [Future Enhancements](#16-future-enhancements)
17. [Appendix](#17-appendix)

---

## 1. Executive Summary

### 1.1 Overview

The **Beginner User Manual Guide** is an interactive onboarding wizard that guides first-time users through the essential setup steps of GitRouter. This feature aims to reduce time-to-value, increase user activation rates, and improve overall user experience by providing a structured, step-by-step introduction to the platform.

### 1.2 Key Features

- **Multi-step wizard dialog** triggered on first login
- **Progressive disclosure** of platform capabilities
- **Integrated setup** for GitHub, Slack, and Jira connections
- **Quick rule creation** to demonstrate core functionality
- **Team invitation** workflow
- **Optional post-onboarding tour** with UI highlights

### 1.3 Target Users

- New users who have just registered for GitRouter
- Users who have not completed the initial setup process
- Existing users who want to restart the onboarding guide

---

## 2. Problem Statement

### 2.1 Current State

Currently, when a new user registers and logs into GitRouter for the first time:

1. They are immediately redirected to the Dashboard
2. The Dashboard shows empty/zero states with no guidance
3. Users must discover integration settings on their own
4. No structured path to connect GitHub (required for core functionality)
5. High cognitive load to understand what steps are needed
6. No explanation of GitRouter's value proposition

### 2.2 Impact

| Issue | Impact |
|-------|--------|
| No guided setup | Users don't connect GitHub → can't use core features |
| Empty dashboard | Poor first impression, confusion about next steps |
| Hidden integrations | Users miss Slack/Jira capabilities |
| No rule creation guidance | Users don't understand routing concept |
| No team setup | Solo usage limits collaboration value |

### 2.3 User Feedback (Hypothetical)

> "I signed up but didn't know what to do next. The dashboard was empty."

> "It took me 20 minutes to figure out I needed to install the GitHub app."

> "I didn't realize I could connect Slack until a week later."

---

## 3. Goals & Objectives

### 3.1 Primary Goals

| Goal | Description | Metric |
|------|-------------|--------|
| **Reduce Time-to-Value** | Users should connect GitHub within 5 minutes of first login | < 5 min median time to GitHub connection |
| **Increase Activation Rate** | More users complete essential setup steps | > 70% GitHub connection rate |
| **Improve User Understanding** | Users understand GitRouter's core value | > 80% completion of welcome step |
| **Enable Full Platform Usage** | Users discover all integration options | > 40% connect at least 2 integrations |

### 3.2 Secondary Goals

- Reduce support tickets related to initial setup
- Increase team invitation rates
- Improve user retention (Day 7, Day 30)
- Create positive first impression of the platform

### 3.3 Non-Goals

- Replacing comprehensive documentation
- Forcing users to complete all steps
- Blocking access to the main application
- Training users on advanced features

---

## 4. User Stories

### 4.1 Core User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-001 | New user | See a welcome guide on first login | I understand what GitRouter does | P0 |
| US-002 | New user | Connect GitHub through the guide | I can start routing PRs immediately | P0 |
| US-003 | New user | Skip the guide if I prefer | I'm not blocked from exploring | P0 |
| US-004 | New user | Resume the guide where I left off | I don't lose progress if interrupted | P1 |
| US-005 | New user | Connect Slack during onboarding | I receive PR notifications | P1 |
| US-006 | New user | Connect Jira during onboarding | My PRs link to tickets | P1 |
| US-007 | New user | Create my first routing rule | I understand the core concept | P1 |
| US-008 | New user | Invite team members | We can collaborate on reviews | P2 |
| US-009 | New user | Take a quick tour after setup | I know where things are in the UI | P2 |
| US-010 | Existing user | Restart the onboarding guide | I can review setup steps | P2 |

### 4.2 Edge Case Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-011 | User returning from OAuth | Return to the guide automatically | My flow isn't interrupted | P0 |
| US-012 | Mobile user | Complete onboarding on my phone | I'm not excluded by device | P2 |
| US-013 | User who skipped | See a reminder to complete setup | I don't forget important steps | P2 |

---

## 5. Functional Requirements

### 5.1 Trigger Conditions

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-001 | First login detection | System detects user's first successful login |
| FR-002 | Onboarding flag check | Check `onboarding_completed` flag in user record |
| FR-003 | Auto-display dialog | Show onboarding dialog if flag is `false` |
| FR-004 | Organization context | Ensure user has an organization before starting |

### 5.2 Onboarding Dialog

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-010 | Modal dialog | Full-screen modal with backdrop overlay |
| FR-011 | Step navigation | Next/Back buttons for step navigation |
| FR-012 | Progress indicator | Visual indicator showing current step and total steps |
| FR-013 | Skip option | "Skip Setup" button available on all steps |
| FR-014 | Close behavior | Closing dialog = skipping (with confirmation) |
| FR-015 | Keyboard navigation | Support Escape key and arrow keys |

### 5.3 Step 1: Welcome & Introduction

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-020 | Personalized greeting | Display user's name in welcome message |
| FR-021 | Value proposition | Show 3 key benefits of GitRouter |
| FR-022 | Visual element | Display illustration or animation |
| FR-023 | Setup overview | List what will be covered in onboarding |

### 5.4 Step 2: GitHub Connection (Required)

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-030 | Explanation | Describe why GitHub connection is needed |
| FR-031 | Connect button | "Connect GitHub" button triggers OAuth flow |
| FR-032 | OAuth redirect | Redirect to GitHub App installation |
| FR-033 | Callback handling | Return to onboarding after OAuth completion |
| FR-034 | Status display | Show connected/pending status |
| FR-035 | Repository list | Display connected repositories after success |
| FR-036 | Skip warning | Show warning if skipping without GitHub |

### 5.5 Step 3: Slack Connection (Optional)

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-040 | Explanation | Describe Slack notification benefits |
| FR-041 | Connect button | "Connect Slack" button triggers OAuth flow |
| FR-042 | Callback handling | Return to onboarding after OAuth completion |
| FR-043 | Channel selection | Allow selecting default notification channel |
| FR-044 | Preview | Show example notification preview |
| FR-045 | Skip option | Allow skipping without warning |

### 5.6 Step 4: Jira Connection (Optional)

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-050 | Explanation | Describe Jira integration benefits |
| FR-051 | Connect button | "Connect Jira" button triggers OAuth flow |
| FR-052 | Callback handling | Return to onboarding after OAuth completion |
| FR-053 | Project selection | Allow selecting default Jira project |
| FR-054 | Status mapping | Allow configuring PR merge → Jira status |
| FR-055 | Skip option | Allow skipping without warning |

### 5.7 Step 5: Create First Rule

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-060 | Explanation | Describe what routing rules do |
| FR-061 | Template options | Provide pre-built rule templates |
| FR-062 | Simple form | Name, file pattern, reviewer selection |
| FR-063 | Reviewer list | Show available reviewers from synced data |
| FR-064 | Create action | Create rule on submission |
| FR-065 | Skip option | "Explore Rules Builder Later" option |

### 5.8 Step 6: Invite Team Members

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-070 | Explanation | Describe benefits of team collaboration |
| FR-071 | Email input | Multi-email input field |
| FR-072 | Role selection | Admin/Member role dropdown |
| FR-073 | Send invites | Send invitation emails |
| FR-074 | Bulk invite | Support pasting multiple emails |
| FR-075 | Skip option | Allow skipping without warning |

### 5.9 Step 7: Completion

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-080 | Celebration | Success animation/confetti |
| FR-081 | Summary | List of completed setup items |
| FR-082 | Next steps | Suggested actions based on setup |
| FR-083 | Tour option | "Take Quick Tour" button |
| FR-084 | Dashboard link | "Go to Dashboard" button |
| FR-085 | Help resources | Links to documentation |

### 5.10 Post-Onboarding Tour (Optional)

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-090 | Spotlight overlay | Highlight UI elements with dimmed background |
| FR-091 | Tour steps | 4-5 key areas (Dashboard, Rules, Settings, etc.) |
| FR-092 | Navigation | Next/Skip/Exit controls |
| FR-093 | Completion | Mark tour as completed |

### 5.11 Progress Persistence

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-100 | Save progress | Save current step after each navigation |
| FR-101 | Resume capability | Load saved step on dialog open |
| FR-102 | Integration status | Track which integrations were connected |
| FR-103 | Completion flag | Set `onboarding_completed` when finished |

### 5.12 Accessibility

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-110 | Focus management | Trap focus within dialog |
| FR-111 | Screen reader | ARIA labels for all interactive elements |
| FR-112 | Keyboard nav | Full keyboard navigation support |
| FR-113 | Color contrast | WCAG AA compliant contrast ratios |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | Dialog load time | < 500ms |
| NFR-002 | Step transition | < 200ms animation |
| NFR-003 | OAuth redirect | < 2s to external provider |
| NFR-004 | Progress save | < 100ms (optimistic) |

### 6.2 Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-010 | Availability | 99.9% uptime |
| NFR-011 | Error recovery | Graceful handling of OAuth failures |
| NFR-012 | Data persistence | No progress loss on browser refresh |

### 6.3 Usability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-020 | Completion time | < 10 minutes for full setup |
| NFR-021 | Mobile support | Fully functional on mobile devices |
| NFR-022 | Browser support | Chrome, Firefox, Safari, Edge (latest 2 versions) |

### 6.4 Security

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-030 | OAuth security | Use state parameter for CSRF protection |
| NFR-031 | Token handling | Never expose tokens in frontend |
| NFR-032 | Permission check | Verify user owns organization |

---

## 7. User Flow & Wireframes

### 7.1 High-Level User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW DIAGRAM                               │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────────┐
    │ Register │────▶│  Login   │────▶│ Check Flag:  │────▶│ onboarding   │
    │ Account  │     │          │     │ onboarding   │     │ _completed?  │
    └──────────┘     └──────────┘     │ _completed   │     └──────┬───────┘
                                      └──────────────┘            │
                                                        ┌─────────┴─────────┐
                                                        │                   │
                                                        ▼                   ▼
                                                   ┌─────────┐        ┌─────────┐
                                                   │  FALSE  │        │  TRUE   │
                                                   │  Show   │        │  Skip   │
                                                   │  Guide  │        │  Guide  │
                                                   └────┬────┘        └────┬────┘
                                                        │                  │
                                                        ▼                  │
                                              ┌─────────────────┐          │
                                              │   ONBOARDING    │          │
                                              │     DIALOG      │          │
                                              │   (7 Steps)     │          │
                                              └────────┬────────┘          │
                                                       │                   │
                                                       ▼                   │
                                              ┌─────────────────┐          │
                                              │  Set Flag:      │          │
                                              │  completed=true │          │
                                              └────────┬────────┘          │
                                                       │                   │
                                                       ▼                   ▼
                                              ┌─────────────────────────────┐
                                              │         DASHBOARD           │
                                              └─────────────────────────────┘
```

### 7.2 Onboarding Steps Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ONBOARDING STEPS FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
  │ Step 1  │──▶│ Step 2  │──▶│ Step 3  │──▶│ Step 4  │──▶│ Step 5  │──▶│ Step 6  │──▶│ Step 7  │
  │ Welcome │   │ GitHub  │   │ Slack   │   │ Jira    │   │ Rules   │   │ Team    │   │Complete │
  │         │   │(Required)│   │(Optional)│   │(Optional)│   │(Optional)│   │(Optional)│   │         │
  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
       │             │             │             │             │             │             │
       │             │             │             │             │             │             │
       ▼             ▼             ▼             ▼             ▼             ▼             ▼
  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
  │ Intro   │   │ OAuth   │   │ OAuth   │   │ OAuth   │   │ Create  │   │ Send    │   │ Tour or │
  │ Content │   │ + Repos │   │ + Chan. │   │ + Proj. │   │ Rule    │   │ Invites │   │Dashboard│
  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘

  ─────────────────────────────────────────────────────────────────────────────────────────────▶
                                     [Skip Setup] available at any step
```

### 7.3 OAuth Callback Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OAUTH CALLBACK FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   Click      │     │  Redirect    │     │   User       │     │  Callback    │
  │  "Connect"   │────▶│  to OAuth    │────▶│  Authorizes  │────▶│  /api/xxx/   │
  │   Button     │     │  Provider    │     │   Access     │     │  oauth/cb    │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                        │
                                                                        ▼
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   Update     │     │   Show       │     │  Redirect to │     │   Process    │
  │   Dialog     │◀────│   Success    │◀────│  /dashboard  │◀────│   Tokens &   │
  │   State      │     │   Toast      │     │  ?onboarding │     │   Store      │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### 7.4 Dialog Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DIALOG WIREFRAME                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░┌───────────────────────────────────────────────────────────────┐░░░░░░ │
│ ░░░░│                                                         [×]   │░░░░░░ │
│ ░░░░│                                                               │░░░░░░ │
│ ░░░░│  ┌─────────────────────────────────────────────────────────┐  │░░░░░░ │
│ ░░░░│  │                                                         │  │░░░░░░ │
│ ░░░░│  │              🚀 [Illustration Area]                     │  │░░░░░░ │
│ ░░░░│  │                                                         │  │░░░░░░ │
│ ░░░░│  └─────────────────────────────────────────────────────────┘  │░░░░░░ │
│ ░░░░│                                                               │░░░░░░ │
│ ░░░░│                  Welcome to GitRouter!                        │░░░░░░ │
│ ░░░░│                                                               │░░░░░░ │
│ ░░░░│    Automate your code review workflow with intelligent        │░░░░░░ │
│ ░░░░│    PR routing. Let's get you set up in just a few minutes.    │░░░░░░ │
│ ░░░░│                                                               │░░░░░░ │
│ ░░░░│    ✓ Connect your tools (GitHub, Slack, Jira)                 │░░░░░░ │
│ ░░░░│    ✓ Create your first routing rule                           │░░░░░░ │
│ ░░░░│    ✓ Invite your team                                         │░░░░░░ │
│ ░░░░│                                                               │░░░░░░ │
│ ░░░░│  ┌─────────────────────────────────────────────────────────┐  │░░░░░░ │
│ ░░░░│  │  ● ─ ○ ─ ○ ─ ○ ─ ○ ─ ○ ─ ○    Step 1 of 7              │  │░░░░░░ │
│ ░░░░│  └─────────────────────────────────────────────────────────┘  │░░░░░░ │
│ ░░░░│                                                               │░░░░░░ │
│ ░░░░│  ┌─────────────────┐              ┌─────────────────────┐     │░░░░░░ │
│ ░░░░│  │   Skip Setup    │              │   Get Started →     │     │░░░░░░ │
│ ░░░░│  └─────────────────┘              └─────────────────────┘     │░░░░░░ │
│ ░░░░│                                                               │░░░░░░ │
│ ░░░░└───────────────────────────────────────────────────────────────┘░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────────────────────────┘

Legend: ░ = Backdrop overlay (dimmed)
```

---

## 8. Technical Architecture

### 8.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────────┐
                              │   MainLayout        │
                              │   (layout.tsx)      │
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │ OnboardingProvider  │
                              │  (Context + State)  │
                              └──────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
         ┌──────────▼──────────┐  ┌──────▼──────┐  ┌─────────▼─────────┐
         │  OnboardingDialog   │  │  Dashboard  │  │  Other Pages      │
         │  (Modal Container)  │  │   Page      │  │                   │
         └──────────┬──────────┘  └─────────────┘  └───────────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼────┐    ┌─────▼─────┐    ┌────▼─────┐
│Progress│    │ StepRouter│    │ Actions  │
│  Bar   │    │           │    │ (Btns)   │
└────────┘    └─────┬─────┘    └──────────┘
                    │
    ┌───────┬───────┼───────┬───────┬───────┬───────┐
    ▼       ▼       ▼       ▼       ▼       ▼       ▼
┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐
│Welcome││GitHub ││ Slack ││ Jira  ││ Rules ││ Team  ││Complete│
│ Step  ││ Step  ││ Step  ││ Step  ││ Step  ││ Step  ││ Step  │
└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘
```

### 8.2 State Management

```typescript
// Onboarding State Shape
interface OnboardingState {
  // Dialog state
  isOpen: boolean;
  currentStep: number;
  totalSteps: number;
  
  // Progress tracking
  completedSteps: number[];
  skippedSteps: number[];
  
  // Integration status
  integrations: {
    github: 'pending' | 'connected' | 'skipped';
    slack: 'pending' | 'connected' | 'skipped';
    jira: 'pending' | 'connected' | 'skipped';
  };
  
  // User data
  userId: string;
  organizationId: string;
  
  // Actions
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}
```

### 8.3 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │   Supabase  │◀───▶│  API Routes │◀───▶│ React Query │◀───▶│ Components  │
  │  Database   │     │  /api/...   │     │   Cache     │     │             │
  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
        │                   │                   │                   │
        │                   │                   │                   │
        ▼                   ▼                   ▼                   ▼
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │   users     │     │ GET/PATCH   │     │ useQuery    │     │ Onboarding  │
  │   table     │     │ /api/users/ │     │ useMutation │     │ Dialog      │
  │             │     │ onboarding  │     │             │     │             │
  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 9. Database Changes

### 9.1 Schema Modifications

#### Users Table Additions

```sql
-- Add onboarding fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_skipped_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_current_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';
```

#### Onboarding Data JSONB Structure

```json
{
  "started_at": "2024-12-23T10:00:00Z",
  "steps_completed": [1, 2, 3],
  "steps_skipped": [4, 5],
  "integrations_connected": ["github", "slack"],
  "first_rule_created": true,
  "team_invites_sent": 3,
  "tour_completed": false
}
```

### 9.2 Migration File

```sql
-- Migration: 20241223000001_add_onboarding_fields.sql

-- Add onboarding tracking fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_skipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_current_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';

-- Create index for quick lookup of users needing onboarding
CREATE INDEX IF NOT EXISTS idx_users_onboarding_incomplete 
  ON users (id) 
  WHERE onboarding_completed = false;

-- Comment for documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Whether user has completed or skipped onboarding';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN users.onboarding_skipped_at IS 'Timestamp when onboarding was skipped';
COMMENT ON COLUMN users.onboarding_current_step IS 'Current step in onboarding flow (0-7)';
COMMENT ON COLUMN users.onboarding_data IS 'JSON object with detailed onboarding progress';
```

### 9.3 TypeScript Type Updates

```typescript
// Update to src/types/supabase.ts
users: {
  Row: {
    // ... existing fields ...
    onboarding_completed: boolean;
    onboarding_completed_at: string | null;
    onboarding_skipped_at: string | null;
    onboarding_current_step: number;
    onboarding_data: Json;
  };
  // ... Insert and Update types ...
}
```

---

## 10. API Specifications

### 10.1 Get Onboarding Status

```
GET /api/users/onboarding
```

**Response:**
```json
{
  "success": true,
  "data": {
    "onboarding_completed": false,
    "onboarding_current_step": 2,
    "onboarding_data": {
      "started_at": "2024-12-23T10:00:00Z",
      "steps_completed": [1],
      "integrations_connected": ["github"]
    },
    "integrations": {
      "github": { "connected": true, "account": "user/org-name" },
      "slack": { "connected": false },
      "jira": { "connected": false }
    }
  }
}
```

### 10.2 Update Onboarding Progress

```
PATCH /api/users/onboarding
```

**Request Body:**
```json
{
  "current_step": 3,
  "step_completed": 2,
  "step_skipped": false,
  "data": {
    "integrations_connected": ["github", "slack"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "onboarding_current_step": 3,
    "onboarding_data": { ... }
  }
}
```

### 10.3 Complete Onboarding

```
POST /api/users/onboarding/complete
```

**Request Body:**
```json
{
  "skipped": false,
  "tour_requested": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "onboarding_completed": true,
    "onboarding_completed_at": "2024-12-23T10:15:00Z"
  }
}
```

### 10.4 Reset Onboarding (Admin/Debug)

```
POST /api/users/onboarding/reset
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding reset successfully"
}
```

---

## 11. Component Structure

### 11.1 File Structure

```
src/
├── components/
│   └── onboarding/
│       ├── index.ts                          # Barrel exports
│       ├── onboarding-dialog.tsx             # Main dialog container
│       ├── onboarding-progress.tsx           # Progress indicator
│       ├── onboarding-actions.tsx            # Navigation buttons
│       │
│       ├── steps/
│       │   ├── index.ts                      # Step exports
│       │   ├── welcome-step.tsx              # Step 1
│       │   ├── github-step.tsx               # Step 2
│       │   ├── slack-step.tsx                # Step 3
│       │   ├── jira-step.tsx                 # Step 4
│       │   ├── rules-step.tsx                # Step 5
│       │   ├── team-step.tsx                 # Step 6
│       │   └── completion-step.tsx           # Step 7
│       │
│       └── tour/
│           ├── spotlight-tour.tsx            # Tour overlay
│           └── tour-tooltip.tsx              # Tour step tooltip
│
├── hooks/
│   └── use-onboarding.ts                     # Onboarding hook
│
├── lib/
│   ├── api/
│   │   └── onboarding.ts                     # API functions
│   └── schema/
│       └── onboarding.ts                     # Zod schemas
│
├── providers/
│   └── onboarding-provider.tsx               # Context provider
│
└── stores/
    └── onboarding-store.ts                   # Zustand store (optional)
```

### 11.2 Component Specifications

| Component | Props | Description |
|-----------|-------|-------------|
| `OnboardingDialog` | `userId`, `orgId` | Main modal container |
| `OnboardingProgress` | `current`, `total`, `completed[]` | Step indicator |
| `OnboardingActions` | `onNext`, `onBack`, `onSkip`, `loading` | Navigation buttons |
| `WelcomeStep` | `userName`, `onNext` | Introduction content |
| `GitHubStep` | `orgId`, `isConnected`, `onConnect` | GitHub integration |
| `SlackStep` | `orgId`, `isConnected`, `onConnect` | Slack integration |
| `JiraStep` | `orgId`, `isConnected`, `onConnect` | Jira integration |
| `RulesStep` | `orgId`, `reviewers[]`, `onCreate` | Rule creation |
| `TeamStep` | `orgId`, `onInvite` | Team invitations |
| `CompletionStep` | `summary`, `onTour`, `onDashboard` | Success screen |

---

## 12. Integration Points

### 12.1 Existing Integration Reuse

| Integration | Existing Component | Reuse Strategy |
|-------------|-------------------|----------------|
| GitHub | `GitHubIntegrationCard` | Extract connection logic into hook |
| Slack | `SlackIntegrationCard` | Extract OAuth flow into hook |
| Jira | `JiraIntegrationCard` | Extract OAuth flow into hook |
| Rules | `CreateRuleDialog` | Simplify for onboarding context |

### 12.2 OAuth Callback Handling

The existing OAuth callback routes need modification to support returning to onboarding:

```typescript
// Modify callback routes to check for onboarding state
// /api/github/install/callback/route.ts
// /api/slack/oauth/callback/route.ts
// /api/jira/oauth/callback/route.ts

// Add query parameter to redirect URL
const redirectUrl = new URL('/dashboard', request.url);
if (isOnboarding) {
  redirectUrl.searchParams.set('onboarding', 'true');
  redirectUrl.searchParams.set('step', nextStep.toString());
}
```

### 12.3 Layout Integration

```typescript
// src/app/(main)/layout.tsx
// Add OnboardingProvider and Dialog

export default async function MainLayout({ children }) {
  return (
    <OnboardingProvider>
      <SidebarProvider>
        <AppSidebar />
        <main>{children}</main>
        <OnboardingDialog /> {/* Add this */}
      </SidebarProvider>
    </OnboardingProvider>
  );
}
```

---

## 13. Success Metrics

### 13.1 Primary Metrics

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| **Onboarding Start Rate** | % of new users who see onboarding | 100% | Auto-triggered |
| **Onboarding Completion Rate** | % who complete all steps | > 60% | Database flag |
| **GitHub Connection Rate** | % who connect GitHub | > 70% | Integration table |
| **Time to GitHub** | Time from login to GitHub connected | < 5 min | Timestamp diff |
| **Skip Rate** | % who skip entire onboarding | < 20% | Database flag |

### 13.2 Secondary Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| **Multi-Integration Rate** | % connecting 2+ integrations | > 40% |
| **First Rule Created** | % who create a rule in onboarding | > 30% |
| **Team Invitation Rate** | % who invite teammates | > 20% |
| **Tour Completion Rate** | % who complete optional tour | > 50% |
| **Step Drop-off Rate** | % dropping at each step | Identify bottlenecks |

### 13.3 Quality Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| **Error Rate** | % of onboarding sessions with errors | < 1% |
| **Support Tickets** | Setup-related tickets per week | -50% reduction |
| **NPS Score** | User satisfaction with onboarding | > 8/10 |

---