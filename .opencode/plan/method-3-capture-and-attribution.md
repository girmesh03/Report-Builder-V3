# Method 3 — Capture, Attribution & Branch Filtering (PROVISIONAL)

> **Status: BRAINSTORM-ONLY.** Created for user review. It is NOT part of the
> project specification and is completely discardable. If approved, it will be
> folded into spec §6.10/§6.11 later. Standalone document — no source-file
> references.
>
> **REFINEMENT LOG — THIS IS A WORKING DRAFT.** The content below will be
> **refined again later** when we reach §6.10/§6.11 of the book during the
> implementation. Decisions written here are provisional and subject to change
> at that point. Revisit and re-check every section before folding into the
> spec.
>
> Change history (user review rounds):
> 1. Transcription status uses the shared vocabulary (`reported` /
>    `in_progress` / `completed`) instead of `reviewed`.
> 2. The "ብራንች ሁሉ" (all) tab is **removed** — every clip belongs to exactly
>    one branch; the user finishes all activities, issues and comments of a
>    branch within that branch's clips.
> 3. Metadata gains `branch` exactly as printed in the report header
>    (`branch: x` or `branch: x / y / z ...`).
> 4. Activities support `in_progress` in addition to `completed` (default
>    `completed`); issues use `completed` instead of `done`.

## 1. Purpose

1. Keep the §6 canonical Amharic report format unchanged (8 labels, Type-1 /
   Type-2, verbatim samples).
2. Deterministically know, for every content item, which branch it belongs
   to — even when the narration never mentions branch names.
3. Allow filtering activities/issues/comments per branch with parameters
   (branch, group, status, date range).

**Non-goals:** no LLM in the filtering loop; no change to the report printout
format.

## 2. Capture model

### 2.1 Metadata form (wizard steps 1–3)

```json
{
  "date": "09-11-18",
  "branch": "ጎላጉል / ብስራተ ገብርኤል",
  "supervisor": { "name": "ቤዛ አያሌው" },
  "visits": [
    { "visitId": 1, "branch": "ጎላጉል", "clockIn": "01:05", "clockOut": "02:20" },
    { "visitId": 2, "branch": "ብስራተ ገብርኤል", "clockIn": "03:30", "clockOut": "12:00" }
  ],
  "dayClockIn": "01:05",
  "dayClockOut": "12:00",
  "type": "Type-2"
}
```

Derivation rules:

- `type = visits.length >= 2 ? "Type-2" : "Type-1"`.
- `branch` = the header line as printed: Type-1 → the single branch name;
  Type-2 → visit branch names joined with ` / ` (e.g. `ጎላጉል / ብስራተ ገብርኤል`).
  It is stored as a value, not recomposed at print time.

This JSON is the only source for the report header lines (ቀን, ብራንች, ስም,
ሰዓት section with per-visit lines, ከስራ የወጣሁበት ሰዓት). Fallback order when a
field is missing: form → transcription → blank/"not specified" (§8 rule 6).

### 2.2 Recording (wizard step 4) — binding tabs

UI shows **one tab per visit** — no global tab. The supervisor finishes
**everything** for a branch (activities, issues, comments) inside that
branch's clips. A clip is **bound** when recorded. Type-1 days show a single
visit → no tab needed (binding is implicit, rule 3).

```json
[
  { "clipId": "c1", "binding": "visit-1", "mime": "audio/webm", "durationSec": 45 },
  { "clipId": "c2", "binding": "visit-2", "mime": "audio/webm", "durationSec": 90 }
]
```

`binding` ∈ { `"visit-<id>"` } (per-visit only — no `"all"` value). One or
more clips per visit; content may be spoken in any order (activities, issues,
comments mixed), and a forgotten point is fixed by recording a new clip on the
same branch's tab.

### 2.3 Transcription (wizard step 5)

STT (Addis AI) on each clip → `clip.transcript` (body only; no metadata
extraction is attempted). The user may review and correct the transcript before generation. The
transcription lifecycle uses the shared status vocabulary (`reported` →
`in_progress` → `completed`); only `completed` transcripts go to generation.

```json
{ "clipId": "c1", "binding": "visit-1", "transcript": "…", "txStatus": "completed" }
```

## 3. Attribution rules (priority order — deterministic, no guessing)

| # | Basis | Rule |
| - | ------ | ---- |
| 1 | `spoken` | Narration names a branch — that wins, even against a conflicting binding. |
| 2 | `binding` | The clip's bound visit (from the visit tab selected while recording). |
| 3 | `single-branch-default` | Type-1 day: every item belongs to the day's only branch. |
| 4 | `user-assigned` | Anything left appears in the review "Unassigned" panel; the supervisor assigns with one tap. |

There is **no silent fallback** and **no global/all concept**: a spoken phrase
like "በሁለቱም ብራንቾች…" inside a branch-bound clip belongs to that bound
branch only. Items that still cannot be attributed become `unassignedItems`,
and the accept action is blocked until resolved (gate, §4).

## 4. Generation contract

- **LLM input:** metadata JSON (form) + transcripts with their bindings
  (transcription status `completed` = verified).
- **LLM output (produced at the same time):**
  1. `reportText` — the §6 printout: header lines verbatim from form values;
     body prose balancing the group structure. §6.35 corpus. In
     **multi-branch** reports the LLM may prefix items with their branch
     (`በጎላጉል ብራንች፡ …`) like the samples; single-branch body stays as
     natural narration.
  2. `branchDigest` — the JSON in §5.
  3. Ambiguous items go to `unassignedItems` (never silently guessed).
- **Accept gate:** `accept` is blocked while `unassignedItems` is non-empty.
- **Sync:** any later correction (Mode 1/2/3) regenerates the digest before the
  next accept; the digest always matches the current report text.

## 5. Branch digest schema (schemaVersion 1)

```json
{
  "schemaVersion": 1,
  "report": {
    "type": "Type-2",
    "visits": [
      { "visitId": 1, "branch": "ጎላጉል",        "clockIn": "01:05", "clockOut": "02:20" },
      { "visitId": 2, "branch": "ብስራተ ገብርኤል", "clockIn": "03:30", "clockOut": "12:00" }
    ]
  },
  "branches": [
    {
      "branch": "ጎላጉል",
      "activities": [
        { "itemId": "a1", "text": "…", "status": "completed", "sourceClipId": "c1", "attributionBasis": "binding" }
      ],
      "issues": [
        { "itemId": "i1", "text": "…", "status": "reported", "sourceClipId": "c1", "attributionBasis": "binding" }
      ],
      "comment": { "text": null, "rating": null }
    },
    {
      "branch": "ብስራተ ገብርኤል",
      "activities": [],
      "issues": [
        { "itemId": "i2", "text": "…", "status": "in_progress", "sourceClipId": "c2", "attributionBasis": "binding" }
      ],
      "comment": { "text": "…", "rating": 5 }
    }
  ],
  "unassignedItems": []
}
```

Rules:

- **Status vocabulary (one shared set):**
  `reported` → `in_progress` → `completed`
  - activities → `completed` (default) or `in_progress` — user may change;
  - issues → `reported` (default), LLM upgrades to `in_progress` (e.g.
    "ነገ መጥቶ ያስተካክላል") or `completed` (e.g. "መጥቶ አስተካክሎታል");
  - comments → no status; optional `rating` 0–5, `null` allowed;
  - transcription (`clip.txStatus`) → `reported` (raw STT) → `in_progress`
    (being corrected) → `completed` (verified, ready for generation).
- Status is editable during review (activities and issues alike); edits update
  the digest before accept.
- `attributionBasis` records which rule (1–4) assigned the item — auditable.

## 6. Filtering contract (direct DB query — no LLM in the loop)

```
GET /api/v1/reports/:id/content?branch=ጎላጉል&group=issues&status=in_progress
GET /api/v1/analytics/items?dateFrom=01-09-18&dateTo=09-11-18&branch=ብስራተ ገብርኤል&group=activities
```

Parameters: `branch`, `group` (activities | issues | comments), `status`
(reported | in_progress | completed), `dateFrom`, `dateTo`, `q`
(text search), pagination `page`/`limit`.

Response envelope:

```json
{
  "success": true,
  "message": "",
  "data": { "docs": [], "page": 1, "limit": 10 }
}
```

## 7. Case 1 — single branch (Type-1, narration silent about the branch)

**Form (metadata):**

```json
{
  "date": "22-10-18",
  "branch": "መድኃኒዓለም",
  "supervisor": { "name": "ቤዛ አያሌው" },
  "visits": [ { "visitId": 1, "branch": "መድኃኒዓለም", "clockIn": "01:55", "clockOut": "09:30" } ],
  "dayClockIn": "01:55",
  "dayClockOut": "09:30",
  "type": "Type-1"
}
```

**Recording:** one clip (single visit → no tab needed). Narration covers
activities, the carpet issue, and the day's impression; it never says
"መድኃኒዓለም".

**Report text (generated; single-branch tone, natural prose):**

```text
ቀን: 22-10-18
ብራንች: መድኃኒዓለም
ስም: ቤዛ አያሌው
ስራ የገባሁበት ሰዓት: 01:55

የተሰሩ ስራዎች:
በቼክሊስቱ መሰረት የሚከናወኑ መደበኛ የአሰራር ሂደቶችን አረጋግጫለሁ።
ኤፍሬም በህመም እረፍት ላይ ስለነበር የእሱን የሥራ ቦታ ሸፍኜያለሁ።

መፍትሄ የሚፈሉ ጉዳዮች:
በዋናው መግቢያ በር ላይ የሚቀመጠው ምንጣፍ (ካርፔት) እንዲገዛልን እጠይቃለሁ።

አጠቃላይ አስተያየት:
በአጠቃላይ የሥራ እንቅስቃሴው ጥሩ ነበር።

ከስራ የወጣሁበት ሰዓት: 09:30
```

**Digest (attribution = rule 3 for every item):**

```json
{
  "schemaVersion": 1,
  "report": {
    "type": "Type-1",
    "visits": [ { "visitId": 1, "branch": "መድኃኒዓለም", "clockIn": "01:55", "clockOut": "09:30" } ]
  },
  "branches": [
    {
      "branch": "መድኃኒዓለም",
      "activities": [
        { "itemId": "a1", "text": "በቼክሊስቱ መሰረት የሚከናወኑ መደበኛ የአሰራር ሂደቶችን አረጋግጫለሁ።", "status": "completed", "sourceClipId": "c1", "attributionBasis": "single-branch-default" },
        { "itemId": "a2", "text": "ኤፍሬም በህመም እረፍት ላይ ስለነበር የእሱን የሥራ ቦታ ሸፍኜያለሁ።", "status": "completed", "sourceClipId": "c1", "attributionBasis": "single-branch-default" }
      ],
      "issues": [
        { "itemId": "i1", "text": "በዋናው መግቢያ በር ላይ የሚቀመጠው ምንጣፍ (ካርፔት) እንዲገዛልን እጠይቃለሁ።", "status": "reported", "sourceClipId": "c1", "attributionBasis": "single-branch-default" }
      ],
      "comment": { "text": "በአጠቃላይ የሥራ እንቅስቃሴው ጥሩ ነበር።", "rating": null }
    }
  ],
  "unassignedItems": []
}
```

**Gate:** `unassignedItems = []` → accept allowed.

**Filter demo:** `?branch=መድኃኒዓለም&group=issues&status=reported` → 1 doc (i1).

## 8. Case 2 — two branches (Type-2, narration silent about the branches)

**Form (metadata):** as in §2.1 (ጎላጉል 01:05–02:20, ብስራተ ገብርኤል 03:30–12:00).

**Recording:** c1 → tab visit-1 (ጎላጉል observations: sink drain fixed, invalid
sockets, closing opinion for ጎላጉል), c2 → tab visit-2 (ብስራተ observations:
insect killer installed, deep fryer contactor, hand-wash basin, closing opinion
for ብስራተ ገብርኤል). No global tab — each branch speaks its own.

**Transcripts (STT output, status vocabulary applied):**

```json
[
  { "clipId": "c1", "binding": "visit-1",
    "transcript": "የእቃ ማጠቢያ ሲንክ ድሬኔጅ እንዲስተካከል ማትያስ መጥቶ አስተካክሎታል። ልክ ያልሆኑ ሶኬቶች እና ማብሪያ ማጥፊያዎች አሉ። ስራው ጥሩ ነው።",
    "txStatus": "completed" },
  { "clipId": "c2", "binding": "visit-2",
    "transcript": "ኢንሴክት ኪለር ተሰቅሏል። የዲፕ ፍራየር ኮንታክተር ችግር ነበረበት፤ ማትያስ ነገ መጥቶ እንደሚያስተካክለው አረጋግጦልኛል። በእግር ተረግጦ የሚሰራው የእጅ መታጠቢያ የውሃና የሳሙና ብክነት አለ። የብስራተ ገብርኤል ስራም ጥሩ ነው።",
    "txStatus": "completed" }
]
```

**Report text (generated; multi-branch → body enriched with branch prefixes):**

```text
ቀን: 09-11-18
ብራንች: ጎላጉል / ብስራተ ገብርኤል
ስም: ቤዛ አያሌው
ስራ የገባሁበት ሰዓት:
ከ01:05 - 02:20 ጎላጉል ብራንች
ከ03:30 - 12:00 ብስራተ ገብርኤል ብራንች

የተሰሩ ስራዎች:
በጎላጉል ብራንች፡ የእቃ ማጠቢያ ሲንክ ድሬኔጅ እንዲስተካከል ማትያስ መጥቶ አስተካክሎታል።
በብስራተ ገብርኤል ብራንች፡ ኢንሴክት ኪለር ተሰቅሏል።

መፍትሄ የሚፈሉ ጉዳዮች:
በጎላጉል ብራንች፡ ልክ ያልሆኑ ሶኬቶች እና ማብሪያ ማጥፊያዎች አሉ።
በብስራተ ገብርኤል ብራንች፡ የዲፕ ፍራየር ኮንታክተር ችግር ነበረበት፤ ማትያስ ነገ መጥቶ እንደሚያስተካክለው አረጋግጦልኛል።
በብስራተ ገብርኤል ብራንች፡ በእግር ተረግጦ የሚሰራው የእጅ መታጠቢያ የውሃ እና የሳሙና ብክነት አለ።

አጠቃላይ አስተያየት:
በጎላጉል ብራንች ስራው ጥሩ ነው። የብስራተ ገብርኤል ስራም ጥሩ ነው።

ከስራ የወጣሁበት ሰዓት: 12:00
```

**Digest:**

```json
{
  "schemaVersion": 1,
  "report": {
    "type": "Type-2",
    "visits": [
      { "visitId": 1, "branch": "ጎላጉል",        "clockIn": "01:05", "clockOut": "02:20" },
      { "visitId": 2, "branch": "ብስራተ ገብርኤል", "clockIn": "03:30", "clockOut": "12:00" }
    ]
  },
  "branches": [
    {
      "branch": "ጎላጉል",
      "activities": [
        { "itemId": "a1", "text": "የእቃ ማጠቢያ ሲንክ ድሬኔጅ እንዲስተካከል ማትያስ መጥቶ አስተካክሎታል።", "status": "completed", "sourceClipId": "c1", "attributionBasis": "binding" }
      ],
      "issues": [
        { "itemId": "i1", "text": "ልክ ያልሆኑ ሶኬቶች እና ማብሪያ ማጥፊያዎች አሉ።", "status": "reported", "sourceClipId": "c1", "attributionBasis": "binding" }
      ],
      "comment": { "text": "ስራው ጥሩ ነው።", "rating": null }
    },
    {
      "branch": "ብስራተ ገብርኤል",
      "activities": [
        { "itemId": "a2", "text": "ኢንሴክት ኪለር ተሰቅሏል።", "status": "completed", "sourceClipId": "c2", "attributionBasis": "binding" }
      ],
      "issues": [
        { "itemId": "i2", "text": "የዲፕ ፍራየር ኮንታክተር ችግር ነበረበት፤ ማትያስ ነገ መጥቶ እንደሚያስተካክለው አረጋግጦልኛል።", "status": "in_progress", "sourceClipId": "c2", "attributionBasis": "binding" },
        { "itemId": "i3", "text": "በእግር ተረግጦ የሚሰራው የእጅ መታጠቢያ የውሃና የሳሙና ብክነት አለ።", "status": "reported", "sourceClipId": "c2", "attributionBasis": "binding" }
      ],
      "comment": { "text": "የብስራተ ገብርኤል ሥራም ጥሩ ነው።", "rating": null }
    }
  ],
  "unassignedItems": []
}
```

Note: no global fan-out exists — each branch's comment comes from that branch's
own narration. `unassignedItems = []` → accept allowed.

**Filter demo:** `?branch=ብስራተ ገብርኤል&group=issues&status=in_progress` → 1 doc (i2).

## 9. Edge cases

| # | Case | Rule |
| - | ----- | ---- |
| 1 | Clip bound to visit X but narration names branch Y | `spoken` wins (rule 1). |
| 2 | A clip mentions another branch too | LLM splits; split pieces go to the spoken branch; ambiguous pieces → `unassignedItems` (rule 4); user assigns. |
| 3 | Branch archived/deleted after the report | Digest keeps the stored branch name text; filters match stored text regardless of current list state. |
| 4 | Correction adds/removes a visit | Digest regenerated; items of a removed branch become `unassignedItems`; user reassigns. |
| 5 | No rating given | `rating: null` — valid. |
| 6 | No comment voiced | `comment.text: null` — valid. |
| 7 | Zero visits or no audio | Wizard blocks generation (invalid report). |
| 8 | Multiple clips on the same branch tab | All merge into that branch's items in the digest — order-independent. |
| 9 | Spoken "በሁለቱም ብራንቾች…" phrase inside a clip | Belongs to the bound branch only (no global bind; refine at §6.10). |

## 10. Lock list (brainstorm decisions — provisional, refined later)

1. Metadata is captured by the form; form wins over transcription; fallback
   `form → transcript → blank` (§8 rule 6).
2. Audio carries only content (activities, issues, comments), any order.
3. Type = visits count (1 → Type-1, ≥ 2 → Type-2).
4. `branch` field in metadata = exactly the report header line
   (`branch: x` / `branch: x / y / z ...`).
5. **No global (ብራንች ሁሉ) tab/step** — binding tabs per visit only; every
   clip belongs to exactly one branch; Type-1 needs no tab.
6. Attribution priority: spoken > binding > single-branch-default >
   user-assigned; no silent fallback; no global-all rule.
7. `accept` is blocked while `unassignedItems` is non-empty.
8. Status vocabulary: `reported` → `in_progress` → `completed`; activities
   `completed` (default) or `in_progress`; issues `reported` (default);
   comments have no status; `rating` 0–5 optional; transcription status uses
   the same vocabulary (`reported` → `in_progress` → `completed`).
9. Multi-branch report body may be enriched with branch prefixes; single
   branch body stays natural.
10. Digest (schemaVersion 1) is stored, regenerated on every correction, and is
    the only source for branch filtering — no LLM in the filtering loop.