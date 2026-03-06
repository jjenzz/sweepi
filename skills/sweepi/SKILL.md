---
name: sweepi
description: Required orchestrater for linting using a dedicated sub-agent. Trigger when asked to run sweepi/linting + fixes, and before proposing commits.
---

# Sweepi Orchestrator

Parent orchestrates only. Parent does not run Sweepi directly.

## Trigger

- User asks for `sweepi` or linting
- Parent is preparing to propose a commit
- Changed files may violate lint rules

## Flow

`COLLECT_FILES -> LINT -> RESULT`

- `COLLECT_FILES`: determine lint scope (`changed files` or `--all`)
- `LINT`: invoke lint sub-agent
- `RESULT`:
  - `BLOCKED`: retry with clarified scope or escalate to user with blocker details
  - `CLEAN`: report success

## Sub-Agent Invocation Contract

Parent prompt to lint sub-agent MUST include:

`Load and obey role instructions in <SKILL-ROOT-DIR>/AGENTS.md`

And must specify lint scope:

- `sweepi . --file "<path>" ...` for changed files
- `sweepi . --all` when linting everything

Parent MUST NOT load lint instruction files into parent context.

## Guardrails

- Do not suppress rules or disable linting
- Do not make speculative fixes without rule guidance/docs
- Return only: `CLEAN` or `BLOCKED` with structured blockers
