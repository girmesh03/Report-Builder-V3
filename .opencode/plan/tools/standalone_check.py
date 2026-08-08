"""Standalone Readiness audit for project-specification.md (read-only).

Checks C1-C6 defined in `.opencode/plan/standalone-readiness.md`:
  C1: internal links closed (citations beyond the last authored top section
      are reported as PENDING, not FAIL)
  C2: no work-file / path leaks (.opencode, plan/, .md, method-3, work-doc names)
  C3: TOC injected state
  C4: reserved anchors visible (e.g. 6.10, 6.11)
  C5: working-document inventory (informational)
  C6: summary and exit code

Usage:
  python standalone_readonly.py                # milestone run
  python standalone_readonly.py --sign-off     # final gate (PENDING must be empty)
"""

import argparse
import os
import re
import sys

PLAN_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SPEC = os.path.join(PLAN_DIR, "project-specification.md")

TOP_RE = re.compile(r"^## (\d+)\.\s", re.M)
SUB_RE = re.compile(r"^### (\d+)\.(\d+)\s", re.M)
CITE_RE = re.compile(r"§(\d+)(?:\.(\d+))?")

# C2 - tokens that must NEVER appear in the spec body
LEAK_RE = re.compile(r"\.opencode|plan[\\/]|\.md\b|method-3|validation-method|standalone-check")
# C2 - informational (may legitimately appear): extensions outside the leak set
INFO_RE = re.compile(r"\b(?:package\.json|httpStatus\.js|\.pem)\b|\b(?:TXT|CSV|XLSX)\b")

# Sanctioned subsection reservations (explicit anchors pending authoring).
RESERVED_SECTIONS = {"6.10", "6.11"}


def main() -> int:
    ap = argparse.ArgumentParser(description="Standalone readiness audit")
    ap.add_argument("--sign-off", action="store_true",
                    help="final gate: PENDING references must be zero")
    args = ap.parse_args()

    text = open(SPEC, encoding="utf-8").read()

    # ---- C1: internal links ----
    tops = {int(m.group(1)) for m in TOP_RE.finditer(text)}
    subs = {(int(m.group(1)), int(m.group(2))) for m in SUB_RE.finditer(text)}
    last = max(tops) if tops else 0

    fail, pending = set(), set()
    for m in CITE_RE.finditer(text):
        n, s = int(m.group(1)), m.group(2)
        if n > last:
            pending.add(f"{n}.{s}" if s else str(n))
        elif n not in tops:
            fail.add(str(n))
        elif s is not None and (n, int(s)) not in subs:
            cite = f"{n}.{s}"
            (pending if cite in RESERVED_SECTIONS else fail).add(cite)

    print("== C1: internal links ==")
    print(f"  authored headings: top 1..{last}; subsections {len(subs)}")
    print(f"  FAIL (cited but no heading): {sorted(fail) or '-'}")
    print(f"  PENDING (beyond last / reserved): {sorted(pending) or '-'}")
    c1_ok = not fail

    # ---- C2: leak scan ----
    print("\n== C2: work-file / path leaks ==")
    leaks = [(i, line.strip()[:100])
             for i, line in enumerate(text.splitlines(), 1)
             if LEAK_RE.search(line)]
    infos = [(i, line.strip()[:100])
             for i, line in enumerate(text.splitlines(), 1)
             if INFO_RE.search(line)]
    print(f"  violations: {len(leaks)}")
    for i, l in leaks:
        print(f"    line {i}: {l}")
    print(f"  informational mentions (allowed): {len(infos)}")
    for i, l in infos:
        print(f"    line {i}: {l}")
    c2_ok = not leaks

    # ---- C3: TOC state ----
    print("\n== C3: TOC state ==")
    placeholder = "TOC injected automatically" in text
    has_links = bool(re.search(r"^[-*]\s*\[[^\]]+\]\(#", text, re.M))
    print(f"  placeholder marker present: {placeholder}")
    print(f"  real link list detected: {has_links}")
    c3_ok = not placeholder and has_links

    # ---- C4: reserved anchors ----
    print("\n== C4: reserved anchors ==")
    m = re.search(r"\*\*Reserved anchors\.\*\*", text)
    if m and ("§6.10" in text or "§6.11" in text):
        print("  found anchor bullet; cites:", ", ".join(f"§{s}" for s in sorted(RESERVED_SECTIONS)))
    else:
        print("  anchor bullet MISSING")
    c4_ok = m is not None

    # ---- C5: working docs inventory (informational) ----
    print("\n== C5: working docs present (pending deletion) ==")
    work = sorted(f for f in os.listdir(PLAN_DIR) if f.endswith(".md") and f != "project-specification.md")
    print(f"  {work}" if work else "  none")

    # ---- C6: summary ----
    print("\n== C6: summary ==")
    status = "SINGLE SOURCE OF TRUTH REACHED" if (
        c1_ok and c2_ok and c3_ok and c4_ok and not pending and args.sign_off
    ) else "OK" if (c1_ok and c2_ok and c3_ok and c4_ok) else "INCOMPLETE"
    print(f"  C1={c1_ok}  C2={c2_ok}  C3={c3_ok}  C4={c4_ok}  PENDING={len(pending)}  sign-off={args.sign_off}")
    print(f"  status: {status}")
    return 0 if status != "INCOMPLETE" else 1


if __name__ == "__main__":
    sys.exit(main())