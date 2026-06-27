# VINIMINI AI

AI CEO Operating System for Coupang Seller

VINIMINI AI starts with Coupang sellers. The first product surface is Fashion Researcher: an AI system that recommends the best women's fashion products to enter this week on Coupang.

Sprint 7.0 product direction: VINIMINI focuses only on Coupang women's fashion. Other shopping malls are out of scope. The product should work as an automatic CEO briefing system, not a manual search tool.

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

## Coupang Data Integration

Sprint 5.0 introduced the first Coupang search data integration structure. Sprint 5.1 adds the official OpenAPI-first adapter.

Current implementation:

- `/api/coupang/search?keyword=...` server route
- Official Coupang OpenAPI adapter when `COUPANG_ACCESS_KEY` and `COUPANG_SECRET_KEY` are configured
- Coupang search HTML fetch and parsing service
- Data shape for product name, price, review count, rating, thumbnail, product URL, seller/brand placeholder, category, rocket signal, ad signal, and AI scoring fields
- Opportunity Center search form connected to the API route
- Safe fallback to existing women's fashion mock data when Coupang blocks the request

Important note:

Coupang currently returns `403` to direct server-side HTML search requests in this environment. The product now has the integration structure, parser, scoring fields, and UI connection, but reliable production data ingestion should use an approved Coupang data source such as an official API credential flow or another permitted data provider.

Environment variables for the official adapter:

- `COUPANG_ACCESS_KEY`
- `COUPANG_SECRET_KEY`
- `COUPANG_VENDOR_ID` optional
- `COUPANG_OPEN_API_PRODUCTS_PATH` optional override, defaulting to the seller products endpoint path

Official OpenAPI product data is treated as the source of truth when available. VINIMINI calculates the planning fields that Coupang does not provide directly, including Opportunity Score, Entry Difficulty, Competition Level, Estimated Margin, Review Strength, and Recommendation.

## VINIMINI Data Engine

VINIMINI generates a daily automatic briefing before the CEO searches anything.

Target daily outputs:

- Today's rising women's fashion keyword TOP10
- Today's recommended Coupang entry product TOP10
- Products with rising competition risk
- This week's first product to launch

Data source responsibilities:

- Coupang Partners API: product name, price, image, product URL, brand, and category candidates
- Naver DataLab: search demand, seasonality, and growth rate
- Naver Search Ads keyword tool: monthly search volume, competition, and related keywords
- Google Trends: trend direction and rising keyword signals
- VINIMINI AI Score Engine: Opportunity Score, entry difficulty, estimated margin, Strong Buy, search growth, market competition, review barrier, detail page improvement potential, thumbnail improvement potential, ad efficiency, and new seller success probability

Current Sprint 7.0 implementation:

- `src/lib/viniminiDataEngine.ts` defines the daily Coupang women's fashion briefing structure.
- `/api/vinimini/daily-briefing` returns the generated daily briefing.
- The route reuses cached results for the same Korean date unless `forceRefresh=true`.
- The current engine uses `DEMO DATA` until live Coupang/Naver/Google sources are connected.
- Dashboard changes stay minimal; the priority is the reusable data engine shape.

The UI must always distinguish:

- `LIVE DATA`: verified live external data
- `PARTIAL DATA`: some sources connected and some estimated or pending
- `DEMO DATA`: mock data for product flow validation

API usage rules:

- Use cache for repeated keyword/date requests.
- Default cache TTL is 24 hours.
- Use `forceRefresh=true` only for intentional refresh.
- Do not call Coupang, Naver, Google, or OpenAI APIs on every page refresh.
- Keep Coupang data collection and OpenAI analysis separate.

## OpenAI Analysis Engine

OpenAI API is not treated as a Coupang data collector. It must not invent Coupang product names, thumbnails, review counts, ratings, or live market data.

OpenAI validation rule:

- OpenAI can analyze, summarize, score, and recommend actions from data VINIMINI already collected.
- OpenAI cannot be the source of truth for live Coupang product data by itself.
- When live Coupang data is unavailable, the UI must clearly show `DEMO DATA / NO LIVE COUPANG DATA`.
- OpenAI API keys must be read only from `.env.local`; `.env*` is ignored by Git and must not be pushed.
- Development default is no OpenAI call. Set `ENABLE_OPENAI_TEST=true` only when intentionally testing.
- The server checks cache before OpenAI calls. Same keyword plus same Korean date reuses cached results for 24 hours by default.
- `forceRefresh=true` is the only way to bypass cache.
- OpenAI call count and last call time are logged by the server route.

Environment variables for OpenAI testing:

- `OPENAI_API_KEY`
- `ENABLE_OPENAI_TEST=true`
- `OPENAI_MODEL` optional, defaults to `gpt-4.1-mini`
- `OPENAI_CACHE_TTL_MS` optional, defaults to 24 hours

## Project Structure

VINIMINI AI is developed as a multi-page product, not a single large page.

Core routes:

1. `/` - CEO Dashboard
   - Good morning message
   - Today's most important goal
   - AI morning brief
   - Today's CEO tasks
   - AI executive briefing
   - AI alerts
   - Meeting start button

2. `/opportunities` - Opportunity Center
   - Today's opportunity product TOP10
   - High margin TOP10
   - Low competition TOP10
   - Product search
   - Product cards

3. `/planning/[id]` - AI Product Planning Room
   - AI executive 30-second summary
   - Competitor analysis
   - AI review complaint TOP5
   - VINIMINI A/B/C proposal
   - Action plan
   - Expected result
   - Risk analysis
   - CEO recommendation
   - Meeting history
   - AI learning note

Implementation rules:

- Do not put the whole product into one `page.tsx`.
- Keep pages small and route-focused.
- Keep Dashboard, Opportunity Center, and Planning Room responsibilities clearly separated.
- Planning Room must work like a meeting room, not a long scrolling report. Use concise tabs for summary, competitors, reviews, AI proposal, action, result, risk, meeting history, and learning.
- Opportunity Center should feel like an AI recommendation list, not a gallery. Show recommendation score, entry difficulty, expected profitability, Why Now, and Strong Buy first.
- Opportunity Center is dedicated to women's fashion on Coupang. Its core categories are today's opportunities, low competition, high margin, fast growth, and review improvement.
- Sprint 6.0 changes the Opportunity Center default from user-led keyword search to AI-led daily discovery. VINIMINI should first show today's women's fashion opportunity TOP10, while manual keyword search remains a secondary tool.
- CEO Dashboard should show the most important daily work, key risk, AI executive consensus, revenue target, ad budget, expected sales volume, and weekly focus product before deep details.
- Sprint 4.3 focuses on screen polish before real data integration: clearer AI executive briefings, easier opportunity scanning, and a planning room summary that leads with the CEO decision and next action.
- Keep shared types in `src/lib/types.ts`.
- Keep mock product and dashboard data in `src/lib/data.ts`.
- Reuse components under `src/components/dashboard`, `src/components/opportunities`, `src/components/planning`, and `src/components/ui`.
- Damaged backup files are used only as product structure references, never restored directly.

## VINIMINI Design System

VINIMINI AI is a Korean-first AI CEO Operating System for Coupang sellers. The user-facing UI language is Korean by default, while code variables and internal types remain English.

The product should feel like a premium AI management dashboard that a CEO wants to open every morning.

Design references:

- Apple minimalism
- Chanel-level restraint and luxury mood
- Stripe and Linear SaaS completeness
- Notion and Arc Browser clarity

Design principles:

1. Luxury Minimalism: remove unnecessary elements, keep generous spacing, use large typography, and avoid decorative noise.
2. Decision First: every screen must help the CEO decide within 30 seconds.
3. Premium SaaS: prioritize trust, focus, and operational clarity over visual excitement.
4. Luxury Fashion: preserve a calm, editorial, fashion-aware atmosphere.

Color philosophy:

- Warm Ivory
- Soft Black
- Warm Gray
- Muted Beige
- Charcoal
- White

Avoid strong red, strong blue, loud gradients, excessive shadows, colorful dashboards, and cheap startup visuals.

Card design should feel like a board report, executive meeting note, or investment memo. Motion should be limited to subtle hover, fade, and slide behavior.

Brand identity rule:

Every CEO Dashboard session should open with a consistent VINIMINI tone, such as:

> 좋은 아침입니다, 다혜 CEO님.
> AI 경영진이 밤사이 상품기획 회의를 완료했습니다.

This repeated opening experience is part of the product brand, not just UI copy.

## Getting Started

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000.
