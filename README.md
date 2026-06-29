# VINIMINI AI

AI CEO Operating System for Coupang Seller

VINIMINI AI starts with Coupang sellers. The first product surface is Fashion Researcher: an AI system that recommends the best women's fashion products to enter this week on Coupang.

Sprint 7.0 product direction: VINIMINI focuses only on Coupang women's fashion. Other shopping malls are out of scope. The product should work as an automatic CEO briefing system, not a manual search tool.

## Development Constitution

### Mission

VINIMINI AI is not a chatbot, dashboard, or search tool. VINIMINI AI is a CEO Operating System. Its purpose is to help CEOs become better CEOs.

### Core Experience

The CEO should never feel like they are using software. The CEO should feel like they are entering VINIMINI AI Headquarters every morning. VINIMINI AI builds experiences, not dashboards.

Every morning follows this order:

1. Good Morning, CEO.
2. AI Executive Team completed overnight strategy meetings.
3. CEO Secretary AI Executive Summary.
4. Today's Biggest Opportunity.
5. Today's Biggest Risk.
6. Today's First Action.
7. Department Reports.
8. Opportunity Center.

The CEO receives reports. The CEO does not search.

### CEO First

Everything revolves around the CEO: every AI, department, dashboard, recommendation, and update. The CEO is always the center.

The system adapts to the CEO. The CEO never adapts to the system.

### AI Company

VINIMINI AI is an AI Company. Departments include CEO Secretary AI, Market Director AI, Marketing Director AI, Creative Director AI, Pricing Director AI, Data Director AI, Customer Insight AI, and Learning AI.

Each department works independently. Departments collaborate before reporting. CEO Secretary AI creates the final Executive Summary.

### AI Culture

Every AI must respect the CEO, act before being asked, analyze before reporting, support every recommendation with evidence, cooperate with other AI departments, help the CEO become better every day, celebrate the CEO's strengths, give constructive improvement suggestions, never compete with the CEO, and never try to shine brighter than the CEO.

The purpose of AI is to help the CEO shine. The best AI is not the smartest AI. The best AI helps the CEO become the best version of themselves.

### CEO Intelligence Engine

VINIMINI AI continuously learns the CEO's goals, priorities, strengths, decision patterns, and management style. The CEO Intelligence Profile should update continuously so every new briefing becomes more personalized.

### AI Auto Discovery

Never ask the user what to search. Every day the AI should explore the market automatically, discover opportunities, rank opportunities, and generate Today's TOP10. Search-first UX is prohibited. Discovery-first UX is required.

### Data Architecture

Separate data collection from AI reasoning. Data sources include Naver DataLab, OpenAI Analysis, Coupang Wing API, Google Trends, and future connectors. Each source must have a visible source badge such as LIVE DATA, OPENAI ANALYSIS, SOURCE LIMITED, COUPANG API, or NAVER DATALAB.

### OpenAI Role

OpenAI is not the data source. OpenAI is the AI Executive Team and executive reasoning engine. It supports market analysis, opportunity discovery, executive summaries, director reports, CEO briefings, opportunity scoring, and AI Executive Meetings.

OpenAI should actively analyze available public information together with connected data sources. If evidence is insufficient, VINIMINI must explicitly report "More data required." Never invent facts.

### OpenAI Cost Optimization

Reduce API costs. Never repeatedly analyze identical inputs. Reuse cached analysis when the date, keyword set, task, source data, and prompt version are unchanged. Re-analyze only when new data arrives, the date changes, or the user requests "Analyze Again."

Keep OpenAI analysis caches separate from raw data source caches.

### AI Discovery

Every night, Market Director explores, Marketing Director evaluates, Pricing Director estimates, Creative Director reviews, Customer Insight AI reviews, Learning AI compares, CEO Secretary AI summarizes, and the Morning Briefing is created.

### AI Auto Discovery v1

AI Auto Discovery v1 turns the Opportunity Center from a search-first screen into a Headquarters briefing.

Nightly meeting flow:

1. 00:00 Market Director AI creates the women's fashion candidate universe.
2. 00:10 Trend AI checks search growth through Naver DataLab.
3. 00:20 OpenAI Market Analysis evaluates candidates in one batch to reduce cost.
4. 00:30 Marketing Director AI estimates ad and competition potential.
5. 00:40 Creative Director AI evaluates thumbnail and detail-page improvement potential.
6. 00:50 Pricing Director AI estimates margin potential and entry difficulty.
7. 01:00 CEO Secretary AI writes the Executive Summary, Today's Biggest Opportunity, Today's Biggest Risk, Today's First Action, and TOP10.

Implementation:

- `/api/vinimini/auto-discovery` generates a daily `discoveryRunId`.
- Candidate generation uses a date-based seed so the keyword pool changes every day.
- Recent recommendation history reduces repetition across the last 7 days.
- Naver DataLab is used as source data, not cached AI reasoning.
- OpenAI analysis cache keys include date, task type, keyword set hash, source data hash, model name, and prompt version.
- The UI displays cache state, Today's OpenAI Calls, Cache Hit Rate, Estimated Cost Saved, and the Midnight Strategy Room meeting timeline.
- Opportunity Center TOP10 cards now show CEO decision fields: Opportunity Score, Entry Difficulty, Estimated Margin, Search Growth, Competition, Why Now, Recommended Action, Source Badges, and Confidence.

### Planning Room v1

Planning Room v1 turns `/planning/[id]` into an AI product planning meeting room instead of a long report.

Tab order:

1. Executive Summary
2. AI Discussion
3. Competitor Analysis
4. Review Complaint TOP5
5. Thumbnail Proposal
6. Detail Page Proposal
7. Pricing
8. Risk
9. Expected Result
10. CEO Recommendation
11. AI Learning Note
12. Meeting History

Implementation:

- Each tab is an independent component under `src/components/planning`.
- The Planning Room header reinforces CEO Headquarters, CEO Secretary AI, and source status.
- OpenAI is treated as the Executive Analysis Engine, not a product data source.
- OpenAI may summarize, score, prioritize, debate, and prepare CEO recommendations from connected evidence.
- OpenAI must not invent Coupang product facts, reviews, prices, rankings, or sales volume.
- If evidence is insufficient, the UI shows `SOURCE LIMITED` or asks for additional verified data.
- Executive analysis must use batch analysis, 24-hour cache reuse, and `forceRefresh=true` only for intentional re-analysis.

### UX Principles

Never build dashboards. Build Headquarters. Never build widgets. Build Departments. Never build reports. Build Executive Briefings. Never build software. Build an AI Company.

The user should feel "I just entered my AI Headquarters," not "I opened an AI tool."

### Git Workflow

Every completed feature must follow: test, `npm run lint`, `npm run build`, Preview verification, `git status`, commit, push, and README update. Never leave completed work only on the local computer. Every completed feature must be stored on GitHub.

### Product Success

Do not optimize for clicks, screen time, or addiction. Optimize for better decisions, better CEOs, better companies, less loneliness, more confidence, and personal growth.

VINIMINI AI does not replace the CEO. VINIMINI AI helps the CEO become a better CEO. If the CEO grows today, VINIMINI AI succeeded.

### Final Principle

We are not building pages. We are building an AI Company that helps the CEO become the best version of themselves.

## Core Philosophy

VINIMINI AI is not a chatbot.

VINIMINI AI is Headquarters for the CEO. It is a CEO Operating System whose purpose is not to answer questions, but to help the CEO become a better CEO every day.

The CEO should never feel like they are using software. The CEO should feel like they are entering their AI Headquarters every morning. Every screen must reinforce this experience.

Core product rules:

1. Everything revolves around the CEO.
2. Every AI, dashboard, report, recommendation, and update exists to support the CEO.
3. VINIMINI AI is an AI Company, not a tool collection.
4. Each AI belongs to a department with clear expertise.
5. AI departments collaborate before reporting to the CEO.
6. AI should feel like trusted executives, not a search engine.
7. VINIMINI should think first, analyze first, prepare first, and brief first.
8. The system adapts to the CEO. The CEO never adapts to the system.

AI departments may include:

- CEO Secretary AI
- Market Department
- Marketing Department
- Pricing Department
- Creative Studio
- Customer Insight Department
- Inventory Department
- Learning Department

Every AI follows this company culture:

1. Respect the CEO.
2. Act before being asked.
3. Support every recommendation with evidence.
4. Cooperate with other AI departments.
5. Help the CEO become better every day.
6. Celebrate the CEO's strengths.
7. Give constructive feedback when improvement is possible.
8. Never compete with the CEO.
9. Always prioritize the CEO's long-term success.
10. Help the CEO shine.

## CEO Intelligence Engine

VINIMINI AI must continuously learn:

- CEO goals
- CEO priorities
- CEO decision patterns
- CEO strengths
- CEO preferred management style

The CEO Intelligence Profile should update automatically. Every new briefing should become more personalized. VINIMINI adapts to the CEO so the CEO never has to adapt to the system.

## Morning Workflow

Every morning:

1. AI departments analyze data overnight.
2. AI departments discuss findings.
3. CEO Secretary AI summarizes the executive consensus.
4. The CEO receives the Executive Briefing.
5. The CEO makes decisions.
6. AI learns from those decisions.

This repeats continuously.

Never start with search-first UX such as "What would you like to search?" Start with the headquarters experience:

- "Good Morning, CEO."
- "Your executive team has completed overnight strategy meetings."
- "Today's top opportunities are ready."

## Success Metric

Do not optimize for screen time. Do not optimize for addictive behavior.

Optimize for:

- Did the CEO become better?
- Did the CEO become more confident?
- Did the CEO make better decisions?
- Did the CEO feel less alone?
- Did the CEO grow today?

If yes, VINIMINI AI succeeded.

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

Every completed work unit must end in this order:

1. Test the changes.
2. Check errors and fix them.
3. Check `git status` or the closest available GitHub state.
4. Write a meaningful feature-level commit message.
5. Commit and push to GitHub.
6. Summarize what changed in the work unit.

Commit messages should be clear and feature-scoped, for example:

- Add VINIMINI AI core philosophy
- Add CEO Headquarters briefing layout
- Connect Naver DataLab trend API
- Improve AI executive briefing UX

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
- The current engine clearly marks sources as `SOURCE LIMITED` or `API NOT CONNECTED` until live Coupang/Naver/Google sources are connected.
- Headquarters experience changes stay CEO-first; the priority is the reusable data engine shape.

Sprint 7.1 adapter structure:

- `src/lib/dataAdapters/coupangPartnersAdapter.ts`: Coupang Partners product candidate adapter for product name, price, image, product URL, category, and brand when available.
- `src/lib/dataAdapters/naverDataLabAdapter.ts`: Naver DataLab trend adapter for search trend, seasonality, and growth rate.
- `src/lib/dataAdapters/naverSearchAdAdapter.ts`: Naver SearchAd keyword adapter for monthly search volume, competition, and related keywords.
- `src/lib/dataAdapters/googleTrendsAdapter.ts`: Google Trends is currently `DISABLED` because an official server API is not confirmed.
- `/api/vinimini/daily-briefing` checks the 24-hour cache before calling adapters.
- Adapter keys are read only from `.env.local`. `.env.local` must never be pushed.
- `.env.example` lists only the required external data adapter variables.
- OpenAI remains disconnected in this sprint. It will be connected later only as an analysis engine, not as a data collector.

The UI must always distinguish:

- `LIVE DATA`: verified live external data
- `PARTIAL DATA`: some sources connected and some estimated or pending
- `SOURCE LIMITED`: generated or incomplete briefing context that requires stronger source evidence
- `API NOT CONNECTED`: the official external API is not configured or authenticated

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
- When live Coupang data is unavailable, the UI must clearly show `COUPANG API NOT CONNECTED` or `SOURCE LIMITED`.
- OpenAI API keys must be read only from `.env.local`; `.env*` is ignored by Git and must not be pushed.
- OpenAI calls run only when `OPENAI_API_KEY` is configured.
- The server checks cache before OpenAI calls. Same keyword plus same Korean date reuses cached results for `OPENAI_CACHE_TTL_HOURS` hours by default.
- `forceRefresh=true` is the only way to bypass cache.
- OpenAI call count and last call time are logged by the server route.

Environment variables for OpenAI testing:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` optional, defaults to `gpt-4.1-mini`
- `OPENAI_DAILY_LIMIT` optional, defaults to 10 calls per server session
- `OPENAI_CACHE_TTL_HOURS` optional, defaults to 24 hours

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
