import { afterEach, describe, expect, it } from 'vitest'
import { configureMockApi, createOrganisation, getOrganisations, MockApiError, resetMockApi } from '../services/organisationService'
import { generatedOrganisations, organisationFixture } from '../services/organisations.fixture'
import originalFixture from '../services/organisations.fixture.json'
import type { RawOrganisation } from '../types/organisation'
import { normaliseDate, normaliseMemberCount, normaliseOrganisations, normaliseOwnerEmail, normaliseStatus } from '../utils/normaliseOrganisation'

afterEach(() => resetMockApi())

describe('raw fixture preservation and expansion', () => {
  it('retains the eight provided source records and expands deterministically to 140', () => {
    expect(originalFixture).toHaveLength(8)
    expect(organisationFixture).toHaveLength(140)
    expect(originalFixture[1]).toMatchObject({ id: 2, name: '', status: 'ACTIVE', memberCount: '12', createdAt: 1710150720000 })
    expect(originalFixture[2]).toMatchObject({ id: 3, name: null, memberCount: -1 })
    expect(organisationFixture.filter(({ id }) => id === 42)).toHaveLength(3)
    expect(organisationFixture.some(({ name }) => name === 'شركة الأمل 🚀')).toBe(true)
    expect(generatedOrganisations.some(({ name }) => typeof name === 'string' && name.length > 100)).toBe(true)
  })
})

describe('normalization', () => {
  it('maps recognized statuses case-insensitively and leaves typos unknown', () => {
    expect(['active', 'ACTIVE', 'Active'].map(normaliseStatus)).toEqual(['Active', 'Active', 'Active'])
    expect(normaliseStatus('inactive')).toBe('Inactive')
    expect(normaliseStatus('suspended')).toBe('Suspended')
    expect(normaliseStatus('actve')).toBe('Unknown')
    expect(normaliseStatus(null)).toBe('Unknown')
  })

  it('accepts non-negative integer values and numeric strings only', () => {
    expect(normaliseMemberCount(42)).toBe(42)
    expect(normaliseMemberCount(' 12 ')).toBe(12)
    expect(normaliseMemberCount(-1)).toBeNull()
    expect(normaliseMemberCount('3.5')).toBeNull()
    expect(normaliseMemberCount(null)).toBeNull()
  })

  it('validates owner emails and parses ISO dates and epoch milliseconds safely', () => {
    expect(normaliseOwnerEmail({ email: ' ops@example.org ' })).toBe('ops@example.org')
    expect(normaliseOwnerEmail({ email: 'not-an-email' })).toBeNull()
    expect(normaliseOwnerEmail(undefined)).toBeNull()
    expect(normaliseDate('2024-03-11T09:12:00Z')).toBe('2024-03-11T09:12:00.000Z')
    expect(normaliseDate(1710150720000)).toBe('2024-03-11T09:52:00.000Z')
    expect(normaliseDate('not a date')).toBeNull()
    expect(normaliseDate('2024-02-30T00:00:00Z')).toBeNull()
  })

  it('preserves invalid and duplicate rows with stable distinct keys and normalized display fields', () => {
    const rawRecords: RawOrganisation[] = [
      { id: 42, name: '  First  ', status: 'active', memberCount: 4, owner: { email: 'first@example.org' }, createdAt: '2024-01-01T00:00:00Z' },
      { id: 42, name: 'Second', status: 'actve', memberCount: -1, owner: { email: 'bad' }, createdAt: 'not a date' },
      { id: 3, name: null, status: null, memberCount: null, createdAt: null },
    ]
    const result = normaliseOrganisations(rawRecords)
    expect(result).toHaveLength(3)
    expect(result.map(({ recordKey }) => new Set([recordKey]).size)).toEqual([1, 1, 1])
    expect(new Set(result.map(({ recordKey }) => recordKey)).size).toBe(3)
    expect(result.slice(0, 2).every(({ duplicateId }) => duplicateId)).toBe(true)
    expect(result[0]).toMatchObject({ name: 'First', status: 'Active', memberCount: 4 })
    expect(result[1]).toMatchObject({ status: 'Unknown', memberCount: null, ownerEmail: null, createdAt: null, hasInvalidData: true })
    expect(result[2]).toMatchObject({ name: null, status: 'Unknown', hasInvalidData: true })
    expect(rawRecords[0]?.name).toBe('  First  ')
  })
})

describe('mock API', () => {
  it('returns at most 25 results per page and supports search and status filters', async () => {
    configureMockApi({ latencyMs: 0, failureRate: 0, maxRequestsPerMinute: 100, random: () => 0.9 })
    const firstPage = await getOrganisations({ page: 1, pageSize: 100 })
    const nextPage = await getOrganisations({ page: 2, pageSize: 25 })
    const searched = await getOrganisations({ search: 'Northwind', status: 'Active' })
    expect(firstPage.records).toHaveLength(25)
    expect(firstPage.pageSize).toBe(25)
    expect(nextPage.records).toHaveLength(25)
    expect(nextPage.records[0]?.id).not.toBe(firstPage.records[0]?.id)
    expect(searched.records).toHaveLength(1)
    expect(searched.total).toBe(1)
    expect(firstPage.duplicateIds).toContain('42')
  })

  it('makes the 15% failure branch deterministic in tests', async () => {
    configureMockApi({ latencyMs: 0, failureRate: 0.15, maxRequestsPerMinute: 100, random: () => 0.1 })
    await expect(getOrganisations()).rejects.toBeInstanceOf(MockApiError)
  })

  it('creates IDs that do not collide with duplicate fixture IDs', async () => {
    configureMockApi({ latencyMs: 0, failureRate: 0, maxRequestsPerMinute: 100, random: () => 0.9 })
    const createdOne = await createOrganisation({ name: 'One', status: 'Active', memberCount: 1, ownerEmail: 'one@example.org' })
    const createdTwo = await createOrganisation({ name: 'Two', status: 'Active', memberCount: 2, ownerEmail: 'two@example.org' })
    expect(createdOne.id).not.toBe(42)
    expect(createdTwo.id).not.toBe(createdOne.id)
  })
})
