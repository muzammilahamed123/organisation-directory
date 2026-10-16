import originalRecords from './organisations.fixture.json'
import type { RawOrganisation } from '../types/organisation'

const originalFixture = originalRecords as RawOrganisation[]
const generatedStatuses: readonly unknown[] = ['active', 'ACTIVE', 'Active', 'suspended', 'actve', 'inactive', null]
const generatedNames = ['Alder & Ash', 'Bright Path', 'Civic Orchard', 'Delta Works', 'شركة الأمل', 'Evergreen Network', 'Fable House']
const generatedOwners = ['team@example.org', 'contact@sample.example', 'invalid-email', 'owner@directory.test']
const longGeneratedName = 'A remarkably long organisation name deliberately retained to verify responsive table layout and graceful wrapping across narrower screens'

/** Generated input is deterministic; the imported eight-record JSON remains untouched. */
export const generatedOrganisations: RawOrganisation[] = Array.from({ length: 132 }, (_, index) => {
  const nameIndex = index % 17
  const name: unknown = nameIndex === 1 ? '' : nameIndex === 2 ? null : nameIndex === 3 ? longGeneratedName : nameIndex === 4 ? 'مؤسسة النور ✨' : `${generatedNames[index % generatedNames.length]} ${index + 1}`
  const memberCount: unknown = index % 9 === 0 ? String((index * 7) % 240) : index % 11 === 0 ? -index : index % 13 === 0 ? null : (index * 13) % 350
  const owner = index % 10 === 0
    ? undefined
    : { email: generatedOwners[index % generatedOwners.length] }
  const createdAt: unknown = index % 12 === 0
    ? 'invalid-date'
    : index % 8 === 0
      ? Date.UTC(2022 + (index % 4), index % 12, (index % 27) + 1)
      : new Date(Date.UTC(2020 + (index % 6), index % 12, (index % 27) + 1)).toISOString()

  return {
    id: index === 0 ? 42 : 1000 + index,
    name,
    status: generatedStatuses[index % generatedStatuses.length],
    memberCount,
    ...(owner ? { owner } : {}),
    createdAt,
  }
})

export const organisationFixture: RawOrganisation[] = [...originalFixture, ...generatedOrganisations]
