# Standalone Readiness — Runbook & Checklist (WORKING DOC)

> **Status: WORKING DOCUMENT.** Defines what "the project specification is
> completely standalone" means and how it is verified at each milestone. The
> spec itself never references this file (C2 leak rule). Audit tool:
> `tools/standalone_check.py` (same folder).

## 1. Definition of "completely standalone"

The spec is standalone when **all six checks pass**:

| # | Check | Pass criteria |
| - | ----- | ------------- |
| C1 | Internal links closed | Every `§N` citation with `N` ≤ last-authored top section must have a matching `## N.` heading; every `§N.M` sub-citation with an authored parent must have a `### N.M` heading or be in the sanctioned reserved list. Citations beyond the last authored section are reported as PENDING (expected until the dependency-order pass finishes). |
| C2 | No work-file / path leaks | No occurrence of `.opencode`, `plan\`, `plan/`, `.md`, `method-3`, or `validation` doc names/formats in the spec body. Sanctioned exceptions (must remain only the header input list): the `backend/package.json` & `client/package.json` source-of-truth line and the `httpStatus.js` naming-rule line. |
| C3 | TOC injected | The `<!-- TOC injected automatically during controlled builds -->` placeholder is gone and a real link list exists. |
| C4 | Reserved anchors listed | The audit prints the reserved anchors it found (e.g. §6.10, §6.11 from the §6.9 anchor bullet) and no anchor text was removed by accident. |
| C5 | Working-file deletion gates | For each working file (`method-3-capture-and-attribution.md`, `validation-method-3.md`): every decision/home is written into the spec (or into an explicit later-section register in this file), the leak scan is clean, and no spec text depends on the file (its deletion leaves no dangling pointer). |
| C6 | Sign-off | C1 pass with zero PENDING rows, C2 no violations, C3 TOC real, C4 anchors intact, C5 gates closed ⇒ declare **single source of truth** milestone. Run audit with `--signoff` to enforce this. |

## 2. How to run

```text
python .opencode/plan/tools/standalone_check.py            # milestone run
python .opencode/plan/tools/standalone_check.py --sign-off # final gate
```

Read-only: never modifies the spec.

## 3. Milestones where the audit runs

1. End of each section-authoring pass (start: after §9–§16 land).
2. After TOC injection.
3. Before deleting `validation-method-3.md` (and the method-3 memo).
4. Final sign-off pass (C6).

## 4. Sanctioned forward references (currently in flight)

Authored top sections today: §1–§8. All citations with `N > 8` (e.g. §19,
§21, §30–§39, §49–§54, §58, §62, §63, §69) are planned and legitimately
pending. Sub-citations with an authored parent that are pending:
§6.10, §6.11 (explicit "Reserved anchors" bullet in §6.9).

## 5. Deletion gates (C5) — per working file

### 5.1 `validation-method-3.md`
- [ ] Trace table fully superseded: every ⏳ row has landed in its later section
- [ ] Spec text self-contained (C1–C3 pass); no name/path of the file anywhere in the spec
- [ ] Later-section register (§19/§21/§30-§31/§34/§35/§38-§39/§51-§54/§58) closed

### 5.2 `method-3-capture-and-attribution.md`
- [ ] Memo content folded: §6.10 (capture & attribution) and §6.11 (branch
      digest & filtering) written and refined per the memo lock list
- [ ] Related sections aligned (§21 schema, §30/31, §34 generation contract,
      §35 corrections, §38/§39 filtering endpoints, §51/§54 review/gate, §58)
- [ ] Status vocabulary (`reported → in_progress → completed`) present in the spec
- [ ] No spec line cites the memo directly

## 6. Sign-off record

| Check | Milestone ran at | Result |
| - | - | - |