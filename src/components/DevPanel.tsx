import { ThemeToggle } from './ThemeToggle'
import { Button } from './ui'
import {
  advanceClock,
  getDevCode,
  resetBackend,
  updateSettings,
  useBackend,
} from '../services/backend'

interface DevPanelProps {
  memberId: string
  onMemberChange: (memberId: string) => void
  onReset: () => void
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString()
}

export function DevPanel({ memberId, onMemberChange, onReset }: DevPanelProps) {
  const { members, settings, audit, outbox, pending } = useBackend()
  const code = getDevCode(memberId)
  const pendingEmail = pending[memberId]

  return (
    <aside className="dev-panel" aria-label="Prototype controls">
      <div className="container dev-panel__inner">
        <h2 className="dev-panel__title">Prototype controls</h2>
        <p className="small">Not part of the member experience. Use these to walk through each scenario.</p>

        <div className="dev-panel__grid">
          <div className="stack">
            <ThemeToggle />
            <label htmlFor="dev-member" className="bold">
              Signed-in view
            </label>
            <select
              id="dev-member"
              className="dev-select"
              value={memberId}
              onChange={(event) => onMemberChange(event.target.value)}
            >
              {Object.values(members).map((entry) => (
                <option key={entry.memberId} value={entry.memberId}>
                  {entry.name.given} {entry.name.family} ({entry.memberId},{' '}
                  {entry.accountRole === 'primary' ? 'primary' : 'dependent under 18'})
                </option>
              ))}
            </select>
            <p className="small muted">
              1001: two phones. 1002: dependent. 1003: ZIP+4 and consent. 1004: state change. 1005: email code waiting.
            </p>
          </div>

          <div className="stack">
            <p className="bold">Scenarios</p>
            <label className="dev-check">
              <input
                type="checkbox"
                checked={settings.failSaves}
                onChange={(event) => updateSettings({ failSaves: event.target.checked })}
              />
              Make the save service unavailable
            </label>
            <label className="dev-check">
              <input
                type="checkbox"
                checked={settings.forcePostalSuggestion}
                onChange={(event) => updateSettings({ forcePostalSuggestion: event.target.checked })}
              />
              Always return a postal close match (adds -2210 to 5 digit ZIPs)
            </label>
            <p className="small muted">
              The postal lookup also suggests short forms, for example Street becomes St.
            </p>
          </div>

          <div className="stack">
            <p className="bold">Email verification code</p>
            {pendingEmail ? (
              <>
                <p className="small">
                  Sent to {pendingEmail.newAddress}. Prototype only, a real code is never shown to members.
                </p>
                <p className="dev-code" aria-label="Current verification code">
                  {code}
                </p>
                <div className="actions">
                  <Button variant="secondary" onClick={() => advanceClock(30 * 1000)}>
                    Skip 30 seconds
                  </Button>
                  <Button variant="secondary" onClick={() => advanceClock(10 * 60 * 1000 + 1000)}>
                    Skip 10 minutes
                  </Button>
                </div>
              </>
            ) : (
              <p className="small muted">No email change in progress for this member.</p>
            )}
          </div>
        </div>

        <div className="dev-panel__grid">
          <div className="stack">
            <p className="bold">Change log (kept 7 years)</p>
            {audit.length === 0 ? (
              <p className="small muted">No changes yet.</p>
            ) : (
              <ul className="dev-log">
                {audit.map((entry) => (
                  <li key={entry.id}>
                    <p className="small bold">
                      {entry.section} · {entry.memberId} · {formatTime(entry.at)}
                    </p>
                    <p className="small">By: {entry.changedBy}</p>
                    <p className="small">Old: {entry.oldValue}</p>
                    <p className="small">New: {entry.newValue}</p>
                    <p className="small muted">Retain until {new Date(entry.retainUntil).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="stack">
            <p className="bold">Messages sent</p>
            {outbox.length === 0 ? (
              <p className="small muted">Nothing sent yet.</p>
            ) : (
              <ul className="dev-log">
                {outbox.map((message) => (
                  <li key={message.id}>
                    <p className="small bold">
                      {message.channel === 'sms' ? 'Text' : 'Email'} to {message.to}
                    </p>
                    <p className="small">{message.subject}</p>
                    <p className="small muted">{message.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="actions">
          <Button
            variant="secondary"
            onClick={() => {
              resetBackend()
              onReset()
            }}
          >
            Reset all data
          </Button>
        </div>
      </div>
    </aside>
  )
}
