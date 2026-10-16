import type { Organisation, OrganisationStatus } from '../types/organisation'

export interface DirectoryFilters {
  query: string
  status: OrganisationStatus | 'All'
}

export function filterOrganisations(records: readonly Organisation[], filters: DirectoryFilters): Organisation[] {
  const query = filters.query.trim().toLocaleLowerCase()
  return records.filter((record) => {
    if (record.name === null) return false
    const matchesStatus = filters.status === 'All' || record.status === filters.status
    const searchable = [record.name, record.ownerEmail, record.id].filter((value) => value !== null).join(' ').toLocaleLowerCase()
    return matchesStatus && (!query || searchable.includes(query))
  })
}

export function sortOrganisations(records: readonly Organisation[]): Organisation[] {
  return [...records].sort((left, right) => (left.name ?? '').localeCompare(right.name ?? '') || left.recordKey.localeCompare(right.recordKey))
}

export function formatDate(date: string, locale = 'en-GB'): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date))
}
