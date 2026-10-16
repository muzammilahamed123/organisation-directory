import type { Organisation, OrganisationStatus, RawOrganisation } from '../types/organisation'

const validStatuses: readonly OrganisationStatus[] = ['Active', 'Inactive', 'Suspended']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function safeId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value)
  return null
}

function safeName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function normaliseStatus(value: unknown): OrganisationStatus {
  if (typeof value !== 'string') return 'Unknown'
  const normalized = value.trim().toLocaleLowerCase('en')
  if (normalized === 'active') return 'Active'
  if (normalized === 'inactive') return 'Inactive'
  if (normalized === 'suspended') return 'Suspended'
  return 'Unknown'
}

export function normaliseMemberCount(value: unknown): number | null {
  let count: number
  if (typeof value === 'number') {
    count = value
  } else if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    count = Number(value.trim())
  } else {
    return null
  }
  return Number.isSafeInteger(count) && count >= 0 ? count : null
}

export function normaliseOwnerEmail(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('email' in value)) return null
  const email = value.email
  return typeof email === 'string' && emailPattern.test(email.trim()) ? email.trim() : null
}

export function normaliseDate(value: unknown): string | null {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) return null
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const datePart = value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null
  const [year, month, day] = datePart.split('-').map(Number)
  const calendarDate = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0))
  if (calendarDate.toISOString().slice(0, 10) !== datePart) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return null
  return parsed.toISOString()
}

export function normaliseOrganisations(
  rawRecords: readonly RawOrganisation[],
  indexOffset = 0,
  knownDuplicateIds?: ReadonlySet<string>,
  stableRowKeys?: readonly string[],
): Organisation[] {
  const idCounts = new Map<string, number>()
  for (const record of rawRecords) {
    const id = safeId(record.id)
    if (id !== null) idCounts.set(id, (idCounts.get(id) ?? 0) + 1)
  }

  return rawRecords.map((record, index) => {
    const id = safeId(record.id)
    const name = safeName(record.name)
    const memberCount = normaliseMemberCount(record.memberCount)
    const ownerEmail = normaliseOwnerEmail(record.owner)
    const createdAt = normaliseDate(record.createdAt)
    const status = normaliseStatus(record.status)

    return {
      recordKey: stableRowKeys?.[index] ?? `${id ?? 'invalid'}-${indexOffset + index}`,
      id,
      name,
      status,
      memberCount,
      ownerEmail,
      createdAt,
      duplicateId: id !== null && (knownDuplicateIds?.has(id) ?? ((idCounts.get(id) ?? 0) > 1)),
      hasInvalidData: id === null || name === null || memberCount === null || !validStatuses.includes(status) || ownerEmail === null || createdAt === null,
    }
  })
}
