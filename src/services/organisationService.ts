import type { CreateOrganisationInput, DirectoryResponse, OrganisationListOptions, RawOrganisation } from '../types/organisation'
import { normaliseDate, normaliseMemberCount, normaliseStatus } from '../utils/normaliseOrganisation'
import { organisationFixture } from './organisations.fixture'

export class MockApiError extends Error {
  constructor(message = 'Mock organisation API request failed') {
    super(message)
    this.name = 'MockApiError'
  }
}

export interface MockApiConfiguration {
  random: () => number
  latencyMs: number | null
  failureRate: number
  maxRequestsPerMinute: number
}

const defaults: MockApiConfiguration = {
  random: Math.random,
  latencyMs: null,
  failureRate: 0.15,
  maxRequestsPerMinute: 5,
}
let configuration: MockApiConfiguration = { ...defaults }
let dataset: RawOrganisation[] = [...organisationFixture]
const requestTimestamps: number[] = []
let nextId = Math.max(...dataset.map((record) => typeof record.id === 'number' ? record.id : 0)) + 1

/** Overrides make network timing, failures, and request budgets deterministic in tests. */
export function configureMockApi(overrides: Partial<MockApiConfiguration>): void {
  configuration = { ...configuration, ...overrides }
}

export function resetMockApi(): void {
  configuration = { ...defaults }
  dataset = [...organisationFixture]
  requestTimestamps.length = 0
  nextId = Math.max(...dataset.map((record) => typeof record.id === 'number' ? record.id : 0)) + 1
}

async function reserveRequestSlot(): Promise<void> {
  const limit = Math.max(1, Math.floor(configuration.maxRequestsPerMinute))
  while (true) {
    const now = Date.now()
    while (requestTimestamps[0] !== undefined && now - requestTimestamps[0] >= 60_000) requestTimestamps.shift()
    if (requestTimestamps.length < limit) {
      requestTimestamps.push(now)
      return
    }
    const oldest = requestTimestamps[0]
    if (oldest === undefined) continue
    await new Promise<void>((resolve) => setTimeout(resolve, Math.max(1, 60_000 - (now - oldest))))
  }
}

async function simulateListRequest(): Promise<void> {
  await reserveRequestSlot()
  const latency = configuration.latencyMs ?? 400 + Math.floor(configuration.random() * 501)
  await new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, latency)))
  if (configuration.random() < configuration.failureRate) throw new MockApiError()
}

function safeName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function matchesSearch(record: RawOrganisation, query: string): boolean {
  if (!query) return true
  const owner = typeof record.owner === 'object' && record.owner !== null && 'email' in record.owner && typeof record.owner.email === 'string'
    ? record.owner.email
    : ''
  const searchable = `${safeName(record.name) ?? ''} ${owner} ${String(record.id)}`.toLocaleLowerCase()
  return searchable.includes(query)
}

function compareRecords(left: RawOrganisation, right: RawOrganisation, options: OrganisationListOptions): number {
  const direction = options.sortDirection === 'desc' ? -1 : 1
  const sortBy = options.sortBy ?? 'name'
  const comparison = sortBy === 'memberCount'
    ? (normaliseMemberCount(left.memberCount) ?? -1) - (normaliseMemberCount(right.memberCount) ?? -1)
    : sortBy === 'createdAt'
      ? (normaliseDate(left.createdAt) ?? '').localeCompare(normaliseDate(right.createdAt) ?? '')
      : (safeName(left.name) ?? '').localeCompare(safeName(right.name) ?? '')
  return comparison === 0 ? 0 : comparison * direction
}

/** List the valid-name result set, sorted and sliced to at most 25 records. */
export async function getOrganisations(options: OrganisationListOptions = {}): Promise<DirectoryResponse> {
  await simulateListRequest()
  const query = options.search?.trim().toLocaleLowerCase() ?? ''
  const filtered = dataset
    .map((record, sourceIndex) => ({ record, sourceIndex }))
    .filter(({ record }) => safeName(record.name) !== null)
    .filter(({ record }) => matchesSearch(record, query))
    .filter(({ record }) => options.status === undefined || options.status === 'All' || normaliseStatus(record.status) === options.status)
    .sort((left, right) => compareRecords(left.record, right.record, options) || left.sourceIndex - right.sourceIndex)

  const total = filtered.length
  const requestedPageSize = Number.isInteger(options.pageSize) ? options.pageSize ?? 25 : 25
  const pageSize = Math.min(25, Math.max(1, requestedPageSize))
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, Math.floor(options.page ?? 1)), pageCount)
  const start = (page - 1) * pageSize
  const idCounts = new Map<string, number>()
  for (const record of dataset) {
    const id = typeof record.id === 'string' || typeof record.id === 'number' ? String(record.id) : null
    if (id !== null) idCounts.set(id, (idCounts.get(id) ?? 0) + 1)
  }

  return {
    records: filtered.slice(start, start + pageSize).map(({ record }) => record),
    total,
    page,
    pageSize,
    duplicateIds: [...idCounts].filter(([, count]) => count > 1).map(([id]) => id),
    rowKeys: filtered.slice(start, start + pageSize).map(({ sourceIndex }) => `organisation-${sourceIndex}`),
  }
}

/** Creates a record without reusing any numeric ID already present in the raw dataset. */
export async function createOrganisation(input: CreateOrganisationInput): Promise<RawOrganisation> {
  const record: RawOrganisation = {
    id: nextId++,
    name: input.name.trim(),
    status: input.status,
    memberCount: input.memberCount,
    owner: { email: input.ownerEmail.trim() },
    createdAt: new Date().toISOString(),
  }
  dataset = [...dataset, record]
  return record
}
