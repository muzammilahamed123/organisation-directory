import { useEffect, useState } from 'react'
import { getOrganisations } from '../services/organisationService'
import type { Organisation, OrganisationStatus } from '../types/organisation'
import { normaliseOrganisations } from '../utils/normaliseOrganisation'

interface UseOrganisationsResult {
  organisations: Organisation[]
  total: number
  pageSize: number
  loading: boolean
  error: boolean
}

interface OrganisationRequestState {
  key: string
  organisations: Organisation[]
  total: number
  pageSize: number
  error: boolean
}

export function useOrganisations(page: number, search: string, status: OrganisationStatus | 'All', retryKey: number): UseOrganisationsResult {
  const requestKey = JSON.stringify([page, search, status, retryKey])
  const [state, setState] = useState<OrganisationRequestState>({
    key: '',
    organisations: [],
    total: 0,
    pageSize: 25,
    error: false,
  })

  useEffect(() => {
    let active = true
    void getOrganisations({ page, pageSize: 25, search, status }).then((response) => {
      if (!active) return
      setState({
        key: requestKey,
        organisations: normaliseOrganisations(response.records, (response.page - 1) * response.pageSize, new Set(response.duplicateIds), response.rowKeys),
        total: response.total,
        pageSize: response.pageSize,
        error: false,
      })
    }).catch(() => {
      if (active) setState({ key: requestKey, organisations: [], total: 0, pageSize: 25, error: true })
    })
    return () => { active = false }
  }, [page, requestKey, retryKey, search, status])

  const isCurrent = state.key === requestKey
  return {
    organisations: isCurrent ? state.organisations : [],
    total: isCurrent ? state.total : 0,
    pageSize: state.pageSize,
    loading: !isCurrent,
    error: isCurrent && state.error,
  }
}
