import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import copy from '../locales/en.json'
import { getOrganisations } from '../services/organisationService'
import type { RawOrganisation } from '../types/organisation'
import { OrganisationDirectoryPage } from '../pages/OrganisationDirectoryPage'

vi.mock('../services/organisationService', () => ({ getOrganisations: vi.fn() }))

const sample: RawOrganisation[] = [
  { id: 1, name: 'Cedar Company', status: 'Active', memberCount: 12, owner: { email: 'cedar@example.org' }, createdAt: '2024-01-10' },
  { id: 2, name: 'Cedar Works', status: 'Inactive', memberCount: '4', owner: { email: 'works@example.org' }, createdAt: '2023-07-05' },
  { id: 3, name: 'Maple Group', status: 'Active', memberCount: 9, owner: { email: 'maple@example.org' }, createdAt: '2022-03-16' },
]

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="Current location">{location.search}</output>
}

function renderDirectory(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <OrganisationDirectoryPage />
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('OrganisationDirectoryPage', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.mocked(getOrganisations).mockImplementation(async (options = {}) => {
      const query = options.search?.toLowerCase() ?? ''
      const matching = sample.filter((record) => {
        const name = typeof record.name === 'string' ? record.name.toLowerCase() : ''
        const owner = typeof record.owner === 'object' && record.owner !== null && 'email' in record.owner && typeof record.owner.email === 'string' ? record.owner.email.toLowerCase() : ''
        const statusMatches = !options.status || options.status === 'All' || String(record.status).toLowerCase() === options.status.toLowerCase()
        return statusMatches && `${name} ${owner} ${record.id}`.includes(query)
      })
      const pageSize = Math.min(options.pageSize ?? 25, 25)
      const page = options.page ?? 1
      return {
        records: matching.slice((page - 1) * pageSize, page * pageSize),
        total: matching.length,
        page,
        pageSize,
        duplicateIds: [],
        rowKeys: matching.slice((page - 1) * pageSize, page * pageSize).map((record, index) => `test-${String(record.id)}-${index}`),
      }
    })
  })

  it('loads records and applies URL-backed search and status filters', async () => {
    renderDirectory('/?q=cedar&status=Inactive')

    expect(await screen.findByText('Cedar Works')).toBeInTheDocument()
    expect(screen.queryByText('Cedar Company')).not.toBeInTheDocument()
    expect(screen.getByLabelText(copy.directory.searchLabel)).toHaveValue('cedar')
    expect(screen.getByLabelText(copy.directory.statusLabel)).toHaveValue('Inactive')
  })

  it('writes search and status changes to the URL', async () => {
    renderDirectory()
    const search = await screen.findByRole('searchbox', { name: copy.directory.searchLabel })
    fireEvent.change(search, { target: { value: 'maple' } })
    await waitFor(() => expect(screen.getByLabelText('Current location')).toHaveTextContent('q=maple'))
    fireEvent.change(screen.getByLabelText(copy.directory.statusLabel), { target: { value: 'Active' } })
    await waitFor(() => expect(screen.getByLabelText('Current location')).toHaveTextContent('status=Active'))
    expect(await screen.findByText('Maple Group')).toBeInTheDocument()
  })

  it('renders no more than 25 records on a page and follows the page URL', async () => {
    const manyRecords: RawOrganisation[] = Array.from({ length: 28 }, (_, index) => ({
      id: index + 1,
      name: `Organisation ${String(index + 1).padStart(2, '0')}`,
      status: 'Active',
      memberCount: index,
      owner: { email: `org${index}@example.org` },
      createdAt: '2024-01-01',
    }))
    vi.mocked(getOrganisations).mockImplementation(async (options = {}) => {
      const page = options.page ?? 1
      return {
        records: manyRecords.slice((page - 1) * 25, page * 25),
        total: manyRecords.length,
        page,
        pageSize: 25,
        duplicateIds: [],
        rowKeys: manyRecords.slice((page - 1) * 25, page * 25).map((record) => `test-${String(record.id)}`),
      }
    })

    renderDirectory()
    expect(await screen.findByText('Organisation 01')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(26)
    fireEvent.click(screen.getByRole('button', { name: copy.directory.next }))
    expect(await screen.findByText('Organisation 26')).toBeInTheDocument()
    expect(screen.queryByText('Organisation 01')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText('Current location')).toHaveTextContent('page=2'))
  })

  it('shows accessible field errors when the add form is submitted empty', async () => {
    renderDirectory()
    fireEvent.click(await screen.findByRole('button', { name: copy.form.open }))
    fireEvent.click(screen.getByRole('button', { name: copy.form.submit }))
    expect(await screen.findAllByText(copy.form.required)).toHaveLength(1)
    expect(screen.getByRole('textbox', { name: copy.form.name })).toHaveAttribute('aria-invalid', 'true')
  })
})
