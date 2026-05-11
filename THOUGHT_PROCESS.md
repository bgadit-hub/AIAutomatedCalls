# THOUGHT_PROCESS.md — AI Automated Calls: Mandatory Workflow

---

## Why This Exists

The consistent failure pattern in AI call projects: jumping straight to code without understanding the full call flow, webhook chain, or provider-specific constraints. This causes broken call sequences, missed state management, and webhook errors that are hard to debug.

**Every step is mandatory.** Skipping any step must be acknowledged before continuing.

---

## Session Management Rule (Added 2026-05-11)

**Work in small, focused sessions to avoid context window exhaustion and MCP timeouts.**

- Each session tackles ONE discrete unit of work (one function, one migration set, one page, one doc update)
- After completing the unit, summarize what was done and what comes next
- Ask the user "Ready to continue?" before starting the next unit
- Never ask the user to push manually — always push directly via `github:push_files` (local PAT tool)
- The local `github:push_files` tool handles files up to at least 70KB without issue
- If a tool call fails, debug and retry — do not fall back to asking the user to push manually
- Keep responses concise during build sessions — no long explanations mid-build

---

## The Mandatory Workflow

### Step 1 — Analyze the Entire Prompt

Before touching anything, read the prompt completely. Write a visible **Prompt Analysis** that answers:

1. **What is explicitly being asked?** List every distinct request, numbered.
2. **What is implicitly required?** Call flow dependencies, webhook chains, state transitions, provider constraints.
3. **What is broken or was flagged before?** Do not repeat prior mistakes.
4. **What is the correct build order?** What must exist before what?
5. **What files, functions, webhooks, and services are affected?**

This must be written text in the response — not a mental note.

---

### Step 2 — Read All Reference Docs

Fetch and read ALL reference docs before proceeding:

- **`docs/SPEC.md`** — full call flow, routes, endpoints, webhook events, provider configs, integrations, prompt scripts
- **`docs/SCHEMA.md`** — every DB table, column, type, constraint. **Check this before assuming any column exists.**
- **`docs/OPS.md`** — outstanding items, open issues, session log
- **`ISSUE_LOG.md`** — full issue history. Do not re-discover logged problems.
- **`CHANGE_LOG.md`** — full change history. Do not duplicate or contradict prior work.

Do not rely on session memory. Always read all five files.

---

### Step 3 — Research the Topic

Check official docs for the relevant provider (Vapi, Twilio, ElevenLabs, Deepgram, etc.). Write a visible **Research Findings** section that states:

1. What was searched or verified
2. Different approaches found
3. Recommended approach and why
4. Whether anything found changed the planned approach

---

### Step 4 — State the Recommendation

Before writing any code, state:
- What the problem is
- What approach is recommended and why
- What the risks are
- What the call flow / webhook sequence will look like
- Whether anything from the Issue Log must be resolved first

---

### Step 5 — Execute the Change

- Always read the relevant file before editing it
- For DB changes: use `apply_migration`, never raw `execute_sql`
- **Every new table migration MUST include `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;`**
- For webhook handlers: trace the full event chain before writing code
- For call flow changes: map the full conversation path including failure states
- **Wiring check:** For every data field changed, trace DB → API → webhook → frontend
- **Always push directly** via `github:push_files` (local PAT) — never ask the user to push manually

---

### Step 6 — Update the Change Log

After every change, add an entry to `CHANGE_LOG.md`.

---

### Step 7 — Update the Issue Log (Resolved)

If a change resolves an issue: add `CORRECTION N` and update the issue to ✅ Resolved.

---

### Step 8 — Update the Issue Log (New Issue)

If work reveals a new problem: add `ISSUE N` to `ISSUE_LOG.md`, mark ⚠️ Open.

---

### Step 9 — Update the Reference Docs

If the change affects call flow, schema, webhook events, provider config, routes, or integrations, update the appropriate file.

---

### Step 10 — Session Wrap-Up

At the end of every session unit:
1. State what was completed
2. State what comes next (specific next action)
3. Ask: **"Ready to continue?"**
4. Wait for confirmation before starting the next unit

---

## Rules That Never Change

- Never assume a webhook event, provider API field, or DB column exists — verify it
- Never modify a file without reading it first in the same session
- Never make a change without logging it in `CHANGE_LOG.md`
- Never discover a new problem without logging it in `ISSUE_LOG.md`
- Always use `apply_migration` for schema changes
- **Every new table must have explicit GRANTs to `authenticated`. No exceptions.**
- **Every call flow change must account for all terminal states: answered, voicemail, no-answer, error, transfer.**
- **Every webhook handler must be idempotent** — assume it can be called more than once
- Never store sensitive data (recordings, PII, API keys) in logs or error messages
- **Never ask the user to push manually — always push directly via `github:push_files`**
- **Work in small sessions — one unit at a time — ask to continue between units**

---

## Checklist (Every Prompt)

- [ ] Step 1: Prompt Analysis
- [ ] Step 2: Read all 5 docs from GitHub
- [ ] Step 3: Research findings
- [ ] Step 4: Recommendation before building
- [ ] Step 5: Execute — read before editing, trace full call flow, GRANTs in every new table, webhooks idempotent, always push directly
- [ ] Step 6: Update CHANGE_LOG
- [ ] Step 7: Update ISSUE_LOG (resolved)
- [ ] Step 8: Update ISSUE_LOG (new issues)
- [ ] Step 9: Update SPEC/SCHEMA/OPS if structural change
- [ ] Step 10: Session wrap-up — summarize + ask to continue

---

## Reference Files

| File | Purpose |
|------|--------|
| `docs/SPEC.md` | Call flow, routes, endpoints, webhook events, provider configs, AI prompts/scripts, integrations |
| `docs/SCHEMA.md` | Complete DB schema — all tables, columns, types, constraints, RLS, functions |
| `docs/OPS.md` | Outstanding items, open issues, rolling session log |
| `THOUGHT_PROCESS.md` | This file — the mandatory workflow |
| `ISSUE_LOG.md` | Full issue history with corrections |
| `CHANGE_LOG.md` | Full change history |

---

## MCP Tool Reference

| Task | Tool | Notes |
|------|------|-------|
| Push any file | `github:push_files` | Local PAT — works for files up to 70KB+ |
| GitHub Copilot MCP | Do NOT use for push | Returns 403 |
| DB migrations | `Supabase:apply_migration` | Never raw execute_sql for DDL |
| DB queries | `Supabase:execute_sql` | Read-only safe |
