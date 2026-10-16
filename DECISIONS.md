# Architecture decisions

## Mock directory data uses a raw JSON seed and deterministic expansion

- **Context:** The assessment's eight supplied records deliberately contain malformed values, duplicates, localized text, and mixed date/count formats; the directory also needs around 140 records and a realistic mock endpoint.
- **Decision:** Keep the original records in `src/services/organisations.fixture.json` without normalizing them, then append a deterministic set of generated raw records. The typed mock service adds 400–900 ms list latency, a controllable 15% failure rate, filtering/sorting, a maximum 25-record page, and a five-requests-per-minute request budget.
- **Consequences:** Tests can make the random branch, latency, and request budget deterministic. The UI uses server pagination, so its count and current page are sourced from API response metadata rather than a client-side copy of the full data.

## Blank names are excluded from directory results; other invalid rows remain inspectable

- **Context:** Empty and null names cannot identify an organisation in search results, but source rows must never be repaired or removed from the fixture.
- **Decision:** Leave raw data unchanged. The API excludes records whose normalized name is blank/null from normal directory results; normalization marks these names null. Other malformed fields remain in results and render translated fallbacks. Status matching is case-insensitive for active/inactive/suspended; misspellings such as `actve` map to `Unknown`, not `Active`. Counts must be non-negative safe integers (numeric strings are parsed explicitly), owner emails are validated, and ISO dates/epoch milliseconds are parsed into a normalized ISO value.
- **Consequences:** The visible directory contains only name-addressable records, while the full raw fixture remains available to the service/tests. Users can distinguish unknown status and missing owner/count/date data without mistaking them for valid values.

## Duplicate business IDs are preserved and disambiguated

- **Context:** The seed deliberately includes ID 42 more than once, and generated rows add further edge cases.
- **Decision:** Never deduplicate by business ID. The API returns every name-valid record, reports duplicate IDs as metadata, and normalization generates row keys from the ID plus stable source position.
- **Consequences:** Both duplicate rows render with an explicit warning and stable unique React keys. Creation assigns monotonically increasing numeric IDs above the current maximum, so new records do not collide with fixture identifiers.

## URL is authoritative for filter state

- **Context:** Search and status need to be shareable and respond correctly to browser history navigation.
- **Decision:** Store query, status, and current page in React Router search parameters. Debounce the derived query used for filtering, but do not keep a second mutable copy of the filter values.
- **Consequences:** Reloaded/shared URLs reproduce the current view and back/forward restores filters. Query edits reset pagination so results cannot remain on an out-of-range page.
