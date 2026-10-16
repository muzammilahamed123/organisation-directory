# Organisation Directory — Copilot Instructions

## Project context

- This is an Organisation Directory assessment built with React, Vite, and TypeScript. Keep implementation idiomatic to the existing codebase; inspect relevant files, scripts, dependencies, and tests before making changes.
- Use TypeScript strict mode. Keep types precise, use functional React components, explicitly type component props and reusable hooks, and prefer `unknown` plus runtime narrowing for untrusted values.
- Do not use `any`. If a third-party boundary makes it genuinely unavoidable, isolate it to the smallest possible area and document why it cannot be typed safely.
- Work incrementally. Avoid unnecessary rewrites and unrelated changes. Before editing, understand the current behavior and nearby conventions; after editing, summarize important implementation choices and any trade-offs in terms that can be explained in an interview.

## Data and API behavior

- Keep raw API responses and supplied fixtures separate from the normalized domain/UI model. Define explicit types for each, and use a deliberate adapter/normalization layer; do not mutate raw records to suit presentation needs.
- Preserve supplied malformed fixture data exactly as provided. Do not repair, reformat, or remove malformed fixture entries. Handle invalid or incomplete values safely at the parsing/normalization boundary and surface appropriate UI behavior without changing the source fixture.
- Never silently discard records, including records with duplicate IDs. Preserve and account for every record, make duplicates detectable, and use a stable unique rendering key or explicit disambiguation where needed. Explain any handling choice to the user.
- Respect the API limit of five requests per minute across the application. Avoid redundant requests, coordinate pagination/filter requests, and do not add automatic retries that can exceed the limit. Keep the page size at exactly 25 records; do not fetch or present a different page size unless the assessment requirements are explicitly changed.
- Use React Router URL search parameters as the source of truth for search and status filters. Keep the URL synchronized with the visible filter state, support browser back/forward navigation, and avoid maintaining competing unsynchronized copies of those values.

## Forms, localization, and styling

- Use React Hook Form with Zod schemas for form state and validation. Keep schemas and inferred types aligned, provide accessible field-level error feedback, and do not rely on browser validation alone for application rules.
- Put every user-facing string (including labels, empty/error/loading states, validation messages, and accessibility text) in `src/locales/en.json`. Reference those values from UI code; do not add user-visible copy inline. If locale resources are not present yet, inspect the existing structure and add the smallest consistent implementation rather than scattering strings.
- Define all colors and spacing values as CSS custom properties. Reference those tokens in styles instead of introducing new literal colors or spacing values. Reuse and extend the existing token system where possible.

## Accessibility and UI quality

- Use semantic HTML elements and native controls. Ensure all functionality works with a keyboard, interactive controls have meaningful accessible names and labels, and focus is clearly visible with `:focus-visible` styling.
- Associate form errors with their inputs, preserve sensible heading order, provide useful text alternatives for meaningful images, and use appropriate status/live-region semantics for asynchronous results when needed.
- Do not use clickable non-interactive elements or remove browser focus outlines without providing a visible replacement.

## Tests, builds, and decisions

- Add or update tests for important behavior changes, especially data normalization and malformed/duplicate records, URL-backed filters, pagination/rate limiting, and form validation when those areas change. First inspect the available test setup and package scripts; do not assume a test runner or invent a passing result.
- After implementation changes, run the production build and the relevant available tests. Report exactly which commands were run and whether they passed; if a test setup is absent or a command cannot run, say so instead of claiming verification.
- Update `DECISIONS.md` whenever a significant architectural or requirement trade-off is made. Record the context, decision, and consequences briefly. Do not create decision entries for routine implementation details.
- Inspect existing files and project state before editing, preserve unrelated work, and prefer focused changes. Clearly explain significant decisions and trade-offs in the final summary so the implementation can be defended in an interview.
