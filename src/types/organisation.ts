export type OrganisationStatus = 'Active' | 'Inactive' | 'Suspended' | 'Unknown'

export interface RawOrganisation {
  id: unknown
  name: unknown
  status: unknown
  memberCount: unknown
  owner?: unknown
  createdAt: unknown
}

export interface Organisation {
  /** Stable rendering identifier independent of potentially duplicated API IDs. */
  recordKey: string
  id: string | null
  name: string | null
  status: OrganisationStatus
  memberCount: number | null
  ownerEmail: string | null
  createdAt: string | null
  duplicateId: boolean
  hasInvalidData: boolean
}

export interface OrganisationFormValues {
  name: string
  status: OrganisationStatus
  memberCount: number
  ownerEmail: string
}

export interface DirectoryResponse {
  records: RawOrganisation[]
  total: number
  page: number
  pageSize: number
  duplicateIds: string[]
  rowKeys: string[]
}

export interface OrganisationListOptions {
  page?: number
  pageSize?: number
  search?: string
  status?: OrganisationStatus | 'All'
  sortBy?: 'name' | 'createdAt' | 'memberCount'
  sortDirection?: 'asc' | 'desc'
}

export interface CreateOrganisationInput {
  name: string
  status: OrganisationStatus
  memberCount: number
  ownerEmail: string
}
