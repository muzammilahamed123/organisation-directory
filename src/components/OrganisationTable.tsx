import type { Organisation } from '../types/organisation'
import { formatDate } from '../utils/directory'
import copy from '../locales/en.json'
import { StatusBadge } from './StatusBadge'

interface OrganisationTableProps {
  records: readonly Organisation[]
}

export function OrganisationTable({ records }: OrganisationTableProps) {
  return (
    <div className="table-scroll">
      <table className="organisation-table">
        <thead>
          <tr>
            <th scope="col">{copy.directory.columns.organisation}</th>
            <th scope="col">{copy.directory.columns.owner}</th>
            <th scope="col">{copy.directory.columns.members}</th>
            <th scope="col">{copy.directory.columns.created}</th>
            <th scope="col">{copy.directory.columns.status}</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.recordKey}>
              <td>
                <span className="organisation-name">{record.name ?? copy.directory.blankName}</span>
                <span className="organisation-id">{copy.directory.idPrefix.replace('{id}', record.id ?? copy.directory.unavailable)}</span>
                {(record.duplicateId || record.hasInvalidData) && (
                  <span className="record-flags">
                    {record.duplicateId && <span className="record-flag">{copy.directory.duplicateId}</span>}
                    {record.hasInvalidData && <span className="record-warning">{copy.directory.invalidRecord}</span>}
                  </span>
                )}
              </td>
              <td>{record.ownerEmail ?? copy.directory.invalidOwner}</td>
              <td>{record.memberCount === null ? copy.directory.invalidMemberCount : record.memberCount.toLocaleString()}</td>
              <td>{record.createdAt ? formatDate(record.createdAt) : copy.directory.invalidDate}</td>
              <td><StatusBadge status={record.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
