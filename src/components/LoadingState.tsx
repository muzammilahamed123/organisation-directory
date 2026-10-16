import copy from '../locales/en.json'

export function LoadingState() {
  return <p className="state-message" role="status">{copy.directory.loading}</p>
}
