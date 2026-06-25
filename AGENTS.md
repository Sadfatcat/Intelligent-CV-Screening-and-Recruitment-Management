Direct answers only. No filler, manners, hedging, summaries, or prefaces. Thinking process: concise, no deliberation narration. Format: Bullet points/single sentences. Max 2 sentences per code block (0 if self-explanatory). Never generate boilerplates, setups, or configs. Use modern shorthand to minimize code. Never rewrite entire files/components; output ONLY modified methods or added lines. Multi-layer bug fixes: Outline a 3-bullet plan and wait for confirmation before coding.

Stop and ask immediately if:

Core business logic rules (e.g., Rent, Deposit, Invoice) are missing.
Database queries require unlisted foreign keys (ask for schema clarification).
Implementing FE/UI/UX features: Ask for role access and restrictions first.
Think Before Coding Don't assume. Don't hide confusion. Surface tradeoffs.
Before implementing:

State your assumptions explicitly. If uncertain, ask. If multiple interpretations exist, present them - don't pick silently. If a simpler approach exists, say so. Push back when warranted. If something is unclear, stop. Name what's confusing. Ask. 2. Simplicity First Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked. No abstractions for single-use code. No "flexibility" or "configurability" that wasn't requested. No error handling for impossible scenarios. If you write 200 lines and it could be 50, rewrite it. Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

Surgical Changes Touch only what you must. Clean up only your own mess.
When editing existing code:

Don't "improve" adjacent code, comments, or formatting. Don't refactor things that aren't broken. Match existing style, even if you'd do it differently. If you notice unrelated dead code, mention it - don't delete it. When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused. Don't remove pre-existing dead code unless asked. The test: Every changed line should trace directly to the user's request.

Goal-Driven Execution Define success criteria. Loop until verified.
Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass" "Fix the bug" → "Write a test that reproduces it, then make it pass" "Refactor X" → "Ensure tests pass before and after" For multi-step tasks, state a brief plan:

[Step] → verify: [check]
[Step] → verify: [check]
Code Conventions
Write code that is easy to read, debug, and extend.

Keep each file, class, and function focused on one clear responsibility.
Use descriptive names, even if they are long. A name should explain what the code does without needing extra comments.
Prefer names like getActiveUsersByOrganizationId, calculateInvoiceTotalAfterDiscount, or validateUserPermissionBeforeUpdate.
Keep functions small, with early returns and minimal nesting.
Avoid magic numbers, hardcoded strings, and hidden side effects. Move them into constants, config, or clearly named helpers.
Follow a consistent flow: validate → authorize → execute → transform → return.
Separate business logic from UI, framework, database, and external services.
Handle errors clearly: fail fast, include useful context, and never silently ignore exceptions.
Reuse shared logic through utilities, services, or modules instead of duplicating code.
Prioritize maintainability over cleverness. Code should be simple to debug today and easy to upgrade later.
[Step] → verify: [check] Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.") require constant clarification.