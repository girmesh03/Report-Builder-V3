# Method-3 Validation Report — Section 6 Alignment (WORKING DOC)

> **Status: WORKING DOCUMENT — will be deleted.** This file exists only while
> section 6 of the project specification is being aligned against the Method-3
> decisions. It is **never referenced by name or path** anywhere in the
> project specification. When all registers below are closed, this file is
> deleted and the project specification becomes the single source of truth.

## 1. Purpose

Confirm that spec §6 (Report Format Specification) is fully prepared for the
Method-3 capture model: per-visit binding tabs, form-captured metadata, the
attribution priority chain, the per-branch status vocabulary, the branch
digest, and filtering — and remember that the actual content of §6.10/§6.11
is created (and refined) when we reach that section.

## 2. Trace: Method-3 memo → spec §6

| Method-3 item | Spec §6 anchor | Verdict |
| -------------- | -------------- | ------- |
| Type derived from visit count (1 → Type-1, ≥ 2 → Type-2) | §6.4 | ✅ aligned |
| `ብራንች:` header, names joined with ` / ` | §6.4, §6.3 field 2 | ✅ aligned |
| One time range line per visit, chronological | §6.4, §6.5 | ✅ aligned |
| Branch visited twice = two visit lines; header lists it once | §6.4 (Sample 4) | ✅ aligned |
| Exit time = end of last visit | §6.4 | ✅ aligned |
| DD-MM-YY dates; 24h zero-padded times; ` - ` bullets; fixed Amharic label + `:` | §6.5, §6.3 | ✅ aligned |
| Content routing (activities/issues/opinion) | §6.7 | ✅ aligned |
| No invention; missing → blank | §6.1, §5 BR-19, §8 rules 5–6 | ✅ aligned |
| Samples verbatim; canonical ≠ byte templates | §6.8, §6.5 | ✅ aligned |
| Metadata captured by form; form wins; fallback form → transcription → blank | §6.1 (updated), §6.3 fields 1/2/4/8 (updated) | ✅ aligned via this validation pass |
| Multi-branch body may be branch-prefixed | §6.7 rules 10–11, Sample 4 | ✅ aligned |
| Binding tabs per visit (no global tab) | §6.9 reserved anchor → §6.10 | ⏳ deferred to §6.10 |
| Attribution priority: spoken > binding > single-branch-default > user-assigned | §6.9 reserved anchor → §6.10 | ⏳ deferred to §6.10 |
| Item status vocabulary: `reported → in_progress → completed`; activities completed/in_progress; rating 0–5 | §6.10/§6.11 | ⏳ deferred |
| STT per clip; transcript status vocabulary | §30/§31 | ⏳ later sections |
| branchDigest schema (v1) | §6.11 | ⏳ deferred to §6.11 |
| Filtering by branch/group/status/date; no LLM in loop | §6.11, §38/§39 | ⏳ deferred |
| Unassigned-items accept gate | §6.10, §54 | ⏳ deferred |
| Corrections regenerate digest before accept | §35 | ⏳ later sections |

## 3. Changes applied to spec §6 (this pass)

1. §6.1 — No-invention bullet rewritten: metadata captured at capture time;
   reviewed transcription = body source + fallback; missing stays blank.
2. §6.3 — value-source cells for fields 1 (ቀን), 2 (ብራንች), 4 (ሰዓት),
   8 (ከስራ የወጣሁበት ሰዓት) → capture form + fallback chain; field 3 (ስም)
   notes profile captured into form.
3. §6.9 — reserved-anchor bullet for §6.10/§6.11 (no file names or paths).

## 4. Register for later sections (still to align while this file exists)

| Later section | What to check against this report |
| -------------- | --------------------------------- |
| §19 | Supervisor name source; profile → capture form |
| §21 | Report-shaped draft; visit rows; metadata JSON fields (`date`, `branch`, `supervisor`, `visits`, `dayClockIn/Out`, `type`) |
| §30–§31 | Transcription per clip, transcript status vocabulary (`reported → in_progress → completed`) |
| §34 | LLM input = metadata JSON + bound transcripts; output = report text + branch digest + unassigned items; header from metadata values only |
| §35 | Corrects → digest recompute before next accept |
| §38–§39 | Filters by branch/group/status/date-range from the digest (no LLM) |
| §51–§54 | Review UI, status editing (activities/issues), unassigned gate blocks accept |
| §58 | Export uses report text; format unchanged |

## 6. Deletion gate (before this file is removed)

- [ ] Every Method-3 decision is present in the spec (here or in its later section)
- [ ] The spec contains no name/path reference to this file, the Method-3 memo, or any other plan file
- [ ] The §6 text passes self-containment: all references resolve in-document (§-style only)
- [ ] The later-section register items all exist in the spec
- [ ] This file's removal leaves no dangling pointer

After deletion: **the project specification is the single source of truth.**