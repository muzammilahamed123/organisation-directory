import type { OrganisationStatus } from '../types/organisation'
import copy from '../locales/en.json'

interface StatusBadgeProps {
  status: OrganisationStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${status.toLowerCase()}`}>{copy.status[status]}</span>
}
