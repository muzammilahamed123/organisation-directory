import copy from '../locales/en.json'

interface ErrorStateProps {
  onRetry: () => void
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="state-message state-message--error" role="alert">
      <p>{copy.directory.loadError}</p>
      <button className="button button--secondary" onClick={onRetry} type="button">{copy.directory.retry}</button>
    </div>
  )
}
