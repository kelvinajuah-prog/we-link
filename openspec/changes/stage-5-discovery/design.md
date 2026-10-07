## Context

Existing code:

| Surface | Current | Gap |
|---------|---------|-----|
| `WeLink.activeProfessionals()` | Fetches approved pros from Supabase | ✓ |
| `WeLink.matchForGuest()` | Scores pros by guest specialization/skills | Exists but underused in UI |
| `dashboard.js` guest "pros" section | `publicProProfiles()` + comm buttons | Comm buttons should be hidden in Stage 5 |
| `professionals.html` | Lists `activeProfessionals()` | Basic cards — add photo, achievements |
| `index.html` | Marketing page | May use samples — wire live approved pros |
| `store.js` SAMPLES | Fallback in `matchForGuest` | Keep for empty state demo only on marketing |

Stage 3 adds profile fields; Stage 4 ensures only approved pros are public.

## Goals / Non-Goals

**Goals:**
- Unified discovery UX on guest dashboard, pro dashboard, and public pages
- Client-side search + specialization filter
- Skill-based match section for guests ("Recommended for you")
- Pro browse without comm CTA
- Approved-only everywhere

**Non-Goals:**
- Communication request button (Stage 6)
- Postgres full-text search
- Editorial redesign of public pages
- Map/geo search

## Decisions

### 1. Directory data source

**Decision:** All discovery views call `WeLink.activeProfessionals()` or cached `load().professionals.filter(status === 'approved')`. Never mix SAMPLES into authenticated dashboard views.

Public homepage MAY show up to 6 approved pros; if zero, show empty CTA to register as pro.

### 2. Guest dashboard layout

```
[ Search input ] [ Specialization filter dropdown ]

## Recommended for you
(matchForGuest results — up to 6 cards)

## All professionals
(filtered grid, profileCard + detail expand)
```

Hide `commRequestBtn()` in Stage 5 — replace with nothing or `<span class="muted">Communication coming soon</span>`.

### 3. Pro dashboard browse

Reuse same grid component; omit comm button entirely when `session.role === 'professional'`.

### 4. Public pages

**professionals.html:** Grid with avatar, name, skill badge, location, bio truncate, achievements line.

**index.html:** Featured section queries `activeProfessionals().slice(0, 6)` — replace static/sample cards if present.

### 5. Search and filter

Client-side on loaded array:
- Search: name, skill, location, bio (case-insensitive includes)
- Filter: skill dropdown from `WeLink.SKILLS` constant

Share filter logic in `js/discovery.js` (new small module) or `dashboard.js` helpers.

### 6. Block pro-to-pro comm at store

Add guard in future `requestCommunication` — for Stage 5, ensure no UI exposes it; optional stub:

```js
function canRequestCommunication(fromRole, toRole) {
  if (fromRole === 'professional' && toRole === 'professional') return false;
  return true; // Stage 6 implements full rules
}
```

## Risks / Trade-offs

- **[Risk] Empty directory before any approvals** → Empty states with copy; homepage CTA
- **[Trade-off] Client-side filter** → Fine for MVP scale in Cameroon market
- **[Trade-off] Hide comm vs "coming soon"** → Use subtle muted label to set expectation

## Migration Plan

1. Add discovery helpers (search/filter/match sections)
2. Update guest and pro dashboard directory sections
3. Remove/hide comm buttons in discovery views
4. Update `professionals.html` and `index.html` featured section
5. Manual test: guest login → see matches; pro login → browse without comm; public page → approved only

## Open Questions

- None blocking.
