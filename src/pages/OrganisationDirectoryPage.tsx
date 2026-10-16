import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { OrganisationForm } from '../components/OrganisationForm'
import { OrganisationTable } from '../components/OrganisationTable'
import { SearchAndFilters } from '../components/SearchAndFilters'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useOrganisations } from '../hooks/useOrganisations'
import copy from '../locales/en.json'
import { createOrganisation } from '../services/organisationService'
import type { OrganisationFormValues, OrganisationStatus } from '../types/organisation'

const allowedStatuses: readonly (OrganisationStatus | 'All')[] = ['All', 'Active', 'Inactive', 'Suspended', 'Unknown']

function readStatus(value: string | null): OrganisationStatus | 'All' {
  return allowedStatuses.find((status) => status === value) ?? 'All'
}

function readPage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function OrganisationDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const status = readStatus(searchParams.get('status'))
  const page = readPage(searchParams.get('page'))
  const debouncedQuery = useDebouncedValue(query, 250)
  const [retryKey, setRetryKey] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState('')
  const { organisations, total, pageSize, loading, error } = useOrganisations(page, debouncedQuery, status, retryKey)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount)
  const firstResult = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastResult = Math.min(currentPage * pageSize, total)

  const pageLabel = useMemo(
    () => copy.directory.page.replace('{current}', String(currentPage)).replace('{total}', String(pageCount)),
    [currentPage, pageCount],
  )

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    setSearchParams(next)
  }

  async function handleCreate(values: OrganisationFormValues) {
    await createOrganisation(values)
    setShowForm(false)
    setNotice(copy.form.saved)
    updateParams({ q: null, status: null, page: null })
    setRetryKey((key) => key + 1)
  }

  return (
    <main id="directory" className="app-shell">
      <a className="skip-link" href="#directory-content">{copy.navigation.skip}</a>
      <header className="app-header">
        <a className="brand" href="/" aria-label={copy.app.brand}>
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>{copy.app.brand}</span>
        </a>
        <span className="header-context">{copy.app.eyebrow}</span>
      </header>

      <section className="page-intro" id="directory-content">
        <div>
          <p className="eyebrow">{copy.app.eyebrow}</p>
          <h1>{copy.app.title}</h1>
          <p className="page-subtitle">{copy.app.subtitle}</p>
        </div>
        <button className="button button--primary add-button" type="button" onClick={() => { setShowForm((shown) => !shown); setNotice('') }}>
          <span aria-hidden="true">+</span>{copy.form.open}
        </button>
      </section>

      {showForm && (
        <section className="form-panel" aria-labelledby="form-title">
          <div className="form-heading"><h2 id="form-title">{copy.form.title}</h2></div>
          <OrganisationForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </section>
      )}
      {notice && <p className="notice" role="status">{notice}</p>}

      <section className="directory-card" aria-label={copy.app.title}>
        <SearchAndFilters
          query={query}
          status={status}
          onQueryChange={(nextQuery) => updateParams({ q: nextQuery, page: null })}
          onStatusChange={(nextStatus) => updateParams({ status: nextStatus === 'All' ? null : nextStatus, page: null })}
        />
        <div className="results-summary" aria-live="polite">
          <span>{`${total} ${copy.directory.organisationCount}`}</span>
          <span>{copy.directory.showing.replace('{from}', String(firstResult)).replace('{to}', String(lastResult)).replace('{total}', String(total))}</span>
        </div>
        {loading ? <LoadingState /> : error ? <ErrorState onRetry={() => setRetryKey((key) => key + 1)} /> : total === 0 ? (
          <div className="empty-state"><span className="empty-icon" aria-hidden="true">⌕</span><h2>{copy.directory.emptyTitle}</h2><p>{copy.directory.emptyBody}</p></div>
        ) : <OrganisationTable records={organisations} />}
        {!loading && !error && total > 0 && (
          <nav className="pagination" aria-label={pageLabel}>
            <span>{pageLabel}</span>
            <div className="pagination-buttons">
              <button className="button button--secondary" type="button" disabled={currentPage <= 1} aria-label={copy.directory.previous} onClick={() => updateParams({ page: String(currentPage - 1) })}>←</button>
              <button className="button button--secondary" type="button" disabled={currentPage >= pageCount} aria-label={copy.directory.next} onClick={() => updateParams({ page: String(currentPage + 1) })}>→</button>
            </div>
          </nav>
        )}
      </section>
      <footer className="page-footer"><span>{copy.app.brand}</span><span>{copy.directory.organisationCount} · {total}</span></footer>
    </main>
  )
}
