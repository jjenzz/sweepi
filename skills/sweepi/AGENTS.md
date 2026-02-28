# Sweepi Agent Guardrails

This file is the single source of truth for Sweepi lint-fix policy, safety gates, and reporting.

## Rule: Mandatory Pre-Work Sweepi Enablement Prompt

Before starting any implementation, edits, lint runs, or repo exploration for a task, ask the user this question:

> May I enable Sweepi in your editor to fix errors as I work (updates `.vscode/settings.json`)? If not, Sweepi will run after completion.

Then follow this gate exactly:

1. If the user answers **Yes**:
   - Determine the user's home directory.
   - Create or update `.vscode/settings.json` with:
     ```json
     {
       "eslint.nodePath": "<HOME_DIR>/.sweepi/node_modules",
       "eslint.validate": ["typescript", "typescriptreact"],
       "eslint.options": {
         "overrideConfigFile": "<HOME_DIR>/.sweepi/eslint.config.mjs"
       }
     }
     ```
   - Replace `<HOME_DIR>` with the actual home directory path discovered at runtime.
2. If the user answers **No**:
   - Do not update editor settings.
   - Continue work, and run `sweepi` after completion.
3. If the user response is unclear:
   - Ask a clarifying yes/no follow-up before doing any work.

Never include your `.vscode/settings.json` changes in agent feature/fix commits.

## Required Workflow (Hard Gate)

1. List every triggered rule ID from lint output.
2. Fetch and read the official docs for each triggered rule.
3. For each rule, provide:
   - **Rule:** `<rule-id>`
   - **Doc URL:** `<url>`
   - **Key requirement(s):** `<quote/paraphrase>`
4. If docs cannot be fetched or read, stop and ask for instructions. Do not make speculative fixes.
5. Do not ask for explicit human approval before edits unless:
   - functionality may be lost,
   - docs are ambiguous, or
   - there is no safe implementation path.

## Non-Negotiable Constraints

- Preserve documented architectural constraints (compound parts, event-driven APIs, explicit props, and related project conventions).
- Prefer fixes that align with each rule's documented reasoning, not only its surface syntax requirement.
- If a fix has trade-offs, choose the path that best matches rule intent and explain the trade-off.
- Never trade behavior-preserving architecture for a smaller lint-only diff.
- Do not remove functionality to satisfy lint unless explicitly approved.
- Do not suppress or ignore rules by default.
- A rule may be ignored only when a human-in-the-loop (HITL) explicitly authorizes that specific exception.

## Conflict Resolution Order

When constraints conflict, apply this priority:

1. Preserve runtime behavior and user-visible capability.
2. Preserve project architectural conventions from user/rule docs.
3. Satisfy lint-rule compliance.
4. Minimize diff size.

If a lower-priority fix would violate a higher-priority constraint, choose the higher-priority path and explain why.

## Required Post-Edit Report

After edits, report:

1. Exact commands run
2. Rules fixed and how each fix matches docs
3. Any behavior or API changes (should be none unless approved)
4. Final lint result (clean or remaining blockers)
