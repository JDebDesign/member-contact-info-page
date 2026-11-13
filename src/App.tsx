import { useState } from 'react'
import { DevPanel } from './components/DevPanel'
import { Hero, SiteFooter, SiteHeader } from './components/Shell'
import { Notice, Tag } from './components/ui'
import { AddressSection } from './sections/AddressSection'
import { EmailSection } from './sections/EmailSection'
import { PhoneSection } from './sections/PhoneSection'
import { useBackend } from './services/backend'

export default function App() {
  const { members } = useBackend()
  const [memberId, setMemberId] = useState('MEM-1001')
  const [resetKey, setResetKey] = useState(0)
  const member = members[memberId]
  const manager = member.managedByMemberId ? members[member.managedByMemberId] : undefined
  const isDependent = !member.canEditOwnContactInfo

  return (
    <div id="top">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <SiteHeader />
      <Hero />
      <main id="main" className="page-main">
        <div className="content-column">
          <div className="member-line">
            <span>
              {member.name.given} {member.name.family} · Member ID {member.memberId}
            </span>
            <Tag>{isDependent ? 'Dependent under 18' : 'Primary account holder'}</Tag>
          </div>

          {isDependent ? (
            <Notice type="info" title="The account holder manages these details">
              {member.name.given} is under 18.{' '}
              {manager ? `${manager.name.given} ${manager.name.family}, the primary account holder,` : 'The primary account holder'}{' '}
              can update this contact information.
            </Notice>
          ) : null}

          <PhoneSection key={`${memberId}-phone-${resetKey}`} member={member} />
          <EmailSection key={`${memberId}-email-${resetKey}`} member={member} />
          <AddressSection key={`${memberId}-address-${resetKey}`} member={member} />
        </div>
      </main>
      <SiteFooter />
      <DevPanel
        memberId={memberId}
        onMemberChange={setMemberId}
        onReset={() => setResetKey((key) => key + 1)}
      />
    </div>
  )
}
