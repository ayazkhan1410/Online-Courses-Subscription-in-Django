import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listCategories } from '@/api/categories'
import { getConfig } from '@/api/config'
import { getCourses } from '@/api/courses'
import { listProjects } from '@/api/projects'
import { PlaylistSuggestPanel } from '@/features/catalog/PlaylistSuggestPanel'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PAGE_DESCRIPTIONS } from '@/lib/pageDescriptions'

export default function AboutPage() {
  usePageTitle('About', {
    description: PAGE_DESCRIPTIONS.about,
    canonicalPath: '/about',
  })
  const config = useQuery({ queryKey: ['config'], queryFn: getConfig })
  const categories = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const courses = useQuery({ queryKey: ['courses', 'count'], queryFn: () => getCourses({ page: 1 }) })
  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
    retry: false,
  })

  const courseCount = config.data?.published_course_count ?? courses.data?.count
  const categoryCount = config.data?.category_count ?? categories.data?.length
  const publishedProjects = projects.isSuccess ? (projects.data ?? []) : []
  const fiverr = config.data?.fiverr_profile_url?.trim()

  return (
    <main className="wrap">
      <div className="panel work about-intro">
        <div>
          <h1 className="h1">Hi, I&apos;m Ayaz</h1>
          <p className="dim" style={{ marginTop: 16 }}>
            I&apos;m a software developer from Pakistan. I build backends and web apps with Python,
            Django and React, and I teach programming in Urdu and Hindi on my YouTube channel, Study
            with Ayaz.
          </p>
          <p className="dim" style={{ marginTop: 16 }}>
            I started the channel to explain things the way I wish someone had explained them to me:
            one small idea at a time, with code you type along with. My 50 Days of Python challenge
            is still where most people start.
          </p>
          <p className="dim" style={{ marginTop: 16 }}>
            This site grew out of the questions I kept getting: which course should I watch next, and
            is it any good. So I collected the best free playlists I know, from my channel and from
            other teachers, put them in order, and added a way to track every lesson. It&apos;s free
            and it will stay free.
          </p>
          <div className="hero-actions" style={{ marginTop: 24 }}>
            <Link className="btn btn-primary" to="/courses">
              Browse courses
            </Link>
            <Link className="btn" to="/services">
              Work with me
            </Link>
          </div>
        </div>
        <dl className="facts">
          <div>
            <dt className="meta">Courses in the library</dt>
            <dd>{courseCount != null ? courseCount : '—'}</dd>
          </div>
          <div>
            <dt className="meta">Categories</dt>
            <dd>{categoryCount != null ? categoryCount : '—'}</dd>
          </div>
          <div>
            <dt className="meta">Teaching languages</dt>
            <dd>Urdu, Hindi, English</dd>
          </div>
          <div>
            <dt className="meta">YouTube</dt>
            <dd>
              <a
                className="link"
                href="https://www.youtube.com/@studywithayaz"
                target="_blank"
                rel="noopener noreferrer"
              >
                Study with Ayaz
              </a>
            </dd>
          </div>
          <div>
            <dt className="meta">Work</dt>
            <dd>
              {fiverr ? (
                <a className="link" href={fiverr} target="_blank" rel="noopener noreferrer">
                  Hire me
                </a>
              ) : (
                <Link className="link" to="/services">
                  Hire me
                </Link>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {publishedProjects.length > 0 ? (
        <section className="section" id="work">
          <h2 className="h2">Work</h2>
          <ul className="proj-list">
            {publishedProjects.map((item) => (
              <li key={item.slug} className="panel" style={{ padding: 24 }}>
                <h3 className="h3">{item.title}</h3>
                <p className="dim small" style={{ margin: '8px 0 12px' }}>
                  {item.summary}
                </p>
                {item.tech ? <p className="meta">{item.tech}</p> : null}
                <div className="hero-actions" style={{ marginTop: 16 }}>
                  {item.live_url ? (
                    <a className="btn btn-sm" href={item.live_url} target="_blank" rel="noopener noreferrer">
                      Live site
                    </a>
                  ) : null}
                  {item.repo_url ? (
                    <a className="btn btn-sm btn-ghost" href={item.repo_url} target="_blank" rel="noopener noreferrer">
                      Source
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="section" style={{ paddingTop: publishedProjects.length ? 0 : undefined }}>
        <h2 className="h2">About the courses</h2>
        <p className="dim" style={{ maxWidth: '40rem' }}>
          Courses from other teachers belong to them. Videos play from YouTube, and every course
          links to the creator&apos;s channel. If you&apos;re a creator and want your playlist
          removed or updated, write to me on the{' '}
          <Link className="link" to="/contact">
            contact page
          </Link>{' '}
          and I&apos;ll do it within a week.
        </p>
        <div style={{ marginTop: 24 }}>
          <PlaylistSuggestPanel />
        </div>
      </section>
    </main>
  )
}