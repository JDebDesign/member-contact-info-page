import type { ReactNode } from 'react'
import chevron from '../assets/icons/chevron-down.svg'
import searchIcon from '../assets/icons/search.svg'
import separator from '../assets/icons/separator.svg'

/** Non-functional links in the shared site chrome: this prototype only covers the contact page. */
function PlaceholderLink({ children, className = 'placeholder-link' }: { children: ReactNode; className?: string }) {
  return (
    <a href="#top" className={className} onClick={(event) => event.preventDefault()}>
      {children}
    </a>
  )
}

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="logo">
      <div className="logo__mark" aria-hidden="true" />
      <span className="logo__name" style={inverse ? { color: 'var(--hcsc-color-text-inverse)' } : undefined}>
        Fiber Test DS
      </span>
    </div>
  )
}

export function SiteHeader() {
  return (
    <header>
      <div className="utility-bar">
        <div className="container utility-bar__inner">
          <PlaceholderLink>Careers</PlaceholderLink>
          <PlaceholderLink>Contact Us</PlaceholderLink>
        </div>
      </div>
      <div className="main-bar">
        <div className="container main-bar__inner">
          <Logo />
          <div className="main-bar__spacer" />
          <nav aria-label="Primary">
            <ul className="primary-nav">
              <li>
                <a
                  href="#top"
                  className="nav-link nav-link--active"
                  aria-current="page"
                  onClick={(event) => event.preventDefault()}
                >
                  Our Story
                  <img src={chevron} alt="" width={16} height={16} />
                </a>
              </li>
              <li>
                <PlaceholderLink className="nav-link">Our Impact</PlaceholderLink>
              </li>
              <li>
                <PlaceholderLink className="nav-link">News &amp; Insights</PlaceholderLink>
              </li>
            </ul>
          </nav>
          <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
            <img src={searchIcon} alt="" width={24} height={24} />
            <label htmlFor="site-search" className="sr-only">
              Search
            </label>
            <input id="site-search" type="search" placeholder="Search" />
          </form>
        </div>
      </div>
    </header>
  )
}

export function Hero() {
  return (
    <div className="hero">
      <div className="container hero__inner">
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumbs">
            <li>
              <PlaceholderLink>Home</PlaceholderLink>
              <img src={separator} alt="" width={16} height={16} />
            </li>
            <li>
              <PlaceholderLink>Account</PlaceholderLink>
              <img src={separator} alt="" width={16} height={16} />
            </li>
            <li aria-current="page">Contact information</li>
          </ol>
        </nav>
        <h1 className="display">Contact information</h1>
        <p className="hero__intro">
          Keep your phone, email and mailing address up to date. Each section saves on its own.
        </p>
      </div>
    </div>
  )
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="footer-column">
      <h2>{title}</h2>
      {links.map((link) => (
        <PlaceholderLink key={link} className="">
          {link}
        </PlaceholderLink>
      ))}
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Logo inverse />
            <p>A training stand-in for a healthcare brand site.</p>
          </div>
          <FooterColumn title="About HCSC" links={['Our Story', 'Leadership', 'Careers', 'Contact Us']} />
          <FooterColumn
            title="Our Impact"
            links={['Community investment', 'Health equity', 'Sustainability', 'Annual reports']}
          />
          <FooterColumn title="News" links={['Press releases', 'Perspectives', 'Research', 'Media contacts']} />
        </div>
        <hr />
        <small>Unofficial training file for design-system practice. Not affiliated with or endorsed by HCSC.</small>
      </div>
    </footer>
  )
}
