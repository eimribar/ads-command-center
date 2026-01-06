# YESS.AI Ads Command Center
## Google Ads API Tool Design Document

**Company:** YESS.AI
**Date:** December 30, 2024
**Version:** 1.0

---

## 1. Executive Summary

YESS.AI is developing an internal advertising management tool called "YESS.AI Ads Command Center" to unify campaign management and reporting across multiple advertising platforms including Google Ads, Meta Ads, and Reddit Ads.

The tool is designed for **internal use only** by the YESS.AI marketing team to improve operational efficiency and optimize advertising spend.

---

## 2. Tool Purpose

### Primary Objectives:
1. **Unified Reporting** - Aggregate performance metrics from Google Ads alongside other platforms into a single dashboard
2. **Conversion Tracking** - Send offline conversion events to Google Ads for accurate ROAS measurement
3. **Campaign Monitoring** - View campaign status, budgets, and performance metrics
4. **Budget Optimization** - Analyze cross-platform efficiency to recommend budget reallocation

### Business Need:
As a B2B SaaS business, we advertise across multiple platforms. Managing separate dashboards is time-consuming. This tool consolidates data to enable faster, data-driven decisions.

---

## 3. Technical Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  YESS.AI Ads Command Center                 │
│                    (Node.js CLI Application)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Google Ads  │  │  Meta Ads   │  │ Reddit Ads  │         │
│  │   Adapter   │  │   Adapter   │  │   Adapter   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │Google Ads│    │ Meta     │    │ Reddit   │
    │   API    │    │   API    │    │   API    │
    └──────────┘    └──────────┘    └──────────┘
```

### 3.2 Technology Stack
- **Runtime:** Node.js 18+
- **Authentication:** OAuth 2.0 with refresh tokens
- **API Version:** Google Ads API v18
- **Data Storage:** No persistent storage (stateless queries)

---

## 4. Google Ads API Usage

### 4.1 API Operations Required

| Operation | Purpose | Frequency |
|-----------|---------|-----------|
| `SearchStream` | Query campaign/ad group performance | On-demand (manual) |
| `UploadClickConversions` | Send offline purchase conversions | Per transaction |
| `ListAccessibleCustomers` | Verify account access | On startup |

### 4.2 Data Retrieved

We will query the following resources:
- `campaign` - Campaign names, status, budgets
- `ad_group` - Ad group performance metrics
- `metrics` - Impressions, clicks, conversions, cost

### 4.3 Sample Query

```sql
SELECT
  campaign.id,
  campaign.name,
  campaign.status,
  metrics.impressions,
  metrics.clicks,
  metrics.conversions,
  metrics.cost_micros
FROM campaign
WHERE segments.date DURING LAST_7_DAYS
```

---

## 5. Authentication & Security

### 5.1 OAuth 2.0 Flow
- Uses standard OAuth 2.0 authorization code flow
- Refresh tokens stored securely in environment variables
- Access tokens refreshed automatically before expiration

### 5.2 Credential Storage
- All credentials stored in `.env` file (not committed to version control)
- Server runs locally on developer machine only
- No web-facing components

### 5.3 Access Control
- Single-user tool (marketing team lead)
- No multi-tenancy
- No customer data sharing

---

## 6. Compliance

### 6.1 Data Handling
- No customer PII stored
- Conversion events use hashed email addresses (SHA-256)
- Data queried on-demand, not cached

### 6.2 Rate Limiting
- Queries executed manually by user
- Estimated usage: <100 API calls per day
- Built-in rate limit handling with exponential backoff

### 6.3 Terms Compliance
- Tool is for internal use only
- No reselling of API access
- No automation without user initiation

---

## 7. User Interface

The tool is a command-line interface (CLI):

```
╔═══════════════════════════════════════════════════════════════════╗
║                    YESS.AI ADS COMMAND CENTER                     ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   Commands:                                                       ║
║   • ads report --period last_7d    View performance report        ║
║   • ads campaigns                  List all campaigns             ║
║   • ads convert Purchase           Send conversion event          ║
║   • ads optimize                   Get budget recommendations     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 8. Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Meta Ads integration | Complete |
| 2 | Reddit Ads integration | Complete |
| 3 | Google Ads integration | In Progress |
| 4 | Cross-platform optimization | Planned |

---

## 9. Contact Information

**Developer:** Eimri Bar
**Email:** eimrib@yess.ai
**Company:** YESS.AI
**Website:** https://www.yess.ai

---

*This document describes an internal tool for YESS.AI's marketing operations. The tool is not offered as a service to external parties.*
