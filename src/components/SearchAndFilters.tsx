import type { OrganisationStatus } from '../types/organisation'
import copy from '../locales/en.json'

interface SearchAndFiltersProps {
  query: string
  status: OrganisationStatus | 'All'
  onQueryChange: (query: string) => void
  onStatusChange: (status: OrganisationStatus | 'All') => void
}

export function SearchAndFilters({ query, status, onQueryChange, onStatusChange }: SearchAndFiltersProps) {
  return (
    <section className="directory-controls" aria-label={copy.app.title}>
      <label className="field search-field">
        <span>{copy.directory.searchLabel}</span>
        <span className="search-input-wrap">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="search-icon"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            placeholder={copy.directory.searchPlaceholder}
          />
        </span>
      </label>
      <label className="field status-filter">
        <span>{copy.directory.statusLabel}</span>
        <select value={status} onChange={(event) => onStatusChange(event.currentTarget.value as OrganisationStatus | 'All')}>
          <option value="All">{copy.directory.allStatuses}</option>
          <option value="Active">{copy.status.Active}</option>
          <option value="Inactive">{copy.status.Inactive}</option>
          <option value="Suspended">{copy.status.Suspended}</option>
          <option value="Unknown">{copy.status.Unknown}</option>
        </select>
      </label>
    </section>
  )
}
