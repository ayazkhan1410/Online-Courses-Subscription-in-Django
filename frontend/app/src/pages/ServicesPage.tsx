import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getConfig } from '@/api/config'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PAGE_DESCRIPTIONS } from '@/lib/pageDescriptions'

const SERVICES = [
  {
    name: 'Django and DRF backends',
    body: 'REST APIs, admin panels, auth with Google and two-factor login, payments, background jobs and Postgres data models.',
    meta: 'API, admin, auth',
  },
  {
    name: 'React frontends and dashboards',
    body: 'Fast, responsive interfaces in React and TypeScript, wired to your API, with light and dark themes and tests.',
    meta: 'React, TypeScript',
  },
  {
    name: 'Deploys and maintenance',
    body: 'Docker setups, CI, servers and fixes for apps that are already live. Monthly support if you need it.',
    meta: 'Docker, CI, support',
  },
] as const

const STEPS = [
  { n: '01', title: 'Call.', text: 'A 30 minute call about what you need and what it should cost.' },
  { n: '02', title: 'Plan.', text: 'A written scope with milestones and a fixed price for each one.' },
  {
    n: '03',
    title: 'Build.',
    text: 'Weekly demos on a staging link, so you see progress, not promises.',
  },
  { n: '04', title: 'Launch.', text: 'Deploy, a handover walkthrough, and two weeks of free fixes.' },
] as const

export default function ServicesPage() {
  usePageTitle('Services', {
    description: PAGE_DESCRIPTIONS.services,
    canonicalPath: '/services',
  })
  const config = useQuery({ queryKey: ['config'], queryFn: getConfig })
  const fiverr = config.data?.fiverr_profile_url?.trim()

  return (
    <main className="wrap">
      <div className="page-head" style={{ gridTemplateColumns: '1fr' }}>
        <div>
          <h1 className="h1">I build web products with Django and React</h1>
          <p className="lead">
            Backends, dashboards and full apps for founders and small teams. You talk to the person
            who writes the code, from the first call to the deploy.
          </p>
          <div className="hero-actions" style={{ marginTop: 24 }}>
            <Link className="btn btn-primary btn-lg" to="/contact?topic=project">
              Start a project
            </Link>
            <Link className="btn btn-lg" to="/about#work">
              See my work
            </Link>
          </div>
        </div>
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <ul className="svc-list">
          {SERVICES.map((item) => (
            <li key={item.name} className="panel svc-row">
              <h2 className="h3">{item.name}</h2>
              <p className="dim" style={{ margin: 0 }}>
                {item.body}
              </p>
              <span className="meta">{item.meta}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <h2 className="h2">How I work</h2>
        <ol className="process">
          {STEPS.map((step) => (
            <li key={step.n}>
              <span className="meta">{step.n}</span>
              <p style={{ margin: 0 }}>
                <strong>{step.title}</strong> {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="panel" style={{ padding: 32 }}>
          <h2 className="h2">Have a project in mind</h2>
          <p className="dim" style={{ margin: '12px 0 24px' }}>
            Tell me what you&apos;re building and when you need it. I reply within two working days.
          </p>
          <Link className="btn btn-primary" to="/contact?topic=project">
            Send a message
          </Link>
          {fiverr ? (
            <p className="small dim" style={{ marginTop: 20, marginBottom: 0 }}>
              <a className="link" href={fiverr} target="_blank" rel="noopener noreferrer">
                Or hire me on Fiverr
              </a>
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}