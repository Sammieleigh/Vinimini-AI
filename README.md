# VINIMINI AI

AI CEO Operating System for Coupang Seller

VINIMINI AI starts with Coupang sellers. The first product surface is Fashion Researcher: an AI system that recommends the best women's fashion products to enter this week on Coupang.

## Roadmap

### v1

- Fashion Researcher: AI product planning room for Coupang sellers with TOP10 opportunity cards, product URLs, competitor analysis, review complaint TOP5, VINIMINI A/B/C thumbnail proposals, and planning actions for thumbnails, detail pages, copy, size charts, new images, and return reduction
- CEO Dashboard

### v2

- AI Chairman
- Good Morning Dahea
- AI Morning Brief
- Creative Director
- Market Analyst
- Ads Manager
- Copywriter
- AI COO
- Auto Improvement Engine

## Development Rules

This project uses GitHub as the required source of truth.

Before implementing a new feature, run a PM meeting:

1. Propose the feature direction.
2. Explain the pros and cons.
3. Get CEO approval.
4. Start implementation only after approval.

UI development must be preview-driven:

1. PM meeting
2. 10-minute development block
3. Run the development server
4. Share the preview URL
5. Ask the CEO to review the current screen
6. Revise based on feedback
7. Continue the next development block after approval

When a screen or UI changes, always run `npm run dev`, share the preview URL, and say: "현재 화면을 확인하세요."

Before starting development:

1. Pull the latest changes from GitHub.

Every feature must follow this full flow:

1. Meeting
2. Design
3. Implementation
4. Test
5. Commit
6. Push
7. README update

Never finish work with changes saved only on the local PC.

Before ending development, always complete:

1. Build
2. Test or the closest available verification
3. Commit
4. Push
5. README update when the feature changes project behavior, roadmap, setup, or rules

Do not end a work session with uncommitted or unpushed changes.

## PM Direction

Fashion Researcher is not a simple product list. It is an AI product planning room for Coupang sellers.

Development sequence:

1. Build the AI product planning room UI and data structure MVP.
2. Complete the TOP10 card and detail panel flow with mock data.
3. Connect real Coupang search result data after the product structure is stable.

Real Coupang integration remains part of the final product goal, but the product structure comes first.

## Getting Started

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000.
