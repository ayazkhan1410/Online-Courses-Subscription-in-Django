import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Logo />
            <p className="dim small" style={{ maxWidth: 320, margin: '12px 0 0' }}>
              Free programming courses from YouTube, put in order and tracked lesson by
              lesson. Curated by Ayaz Khan.
            </p>
          </div>
          <div>
            <h4>Learn</h4>
            <ul>
              <li>
                <Link to="/courses">All courses</Link>
              </li>
              <li>
                <Link to="/categories">Categories</Link>
              </li>
              <li>
                <Link to="/paths">Paths</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Work with me</h4>
            <ul>
              <li>
                <Link to="/services">Services</Link>
              </li>
              <li>
                <Link to="/work">Projects</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Site</h4>
            <ul>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
              <li>
                <Link to="/terms">Terms</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-note small muted">
          <span>Videos belong to their creators and play from YouTube.</span>
          <span className="mono">© 2026</span>
        </div>
      </div>
    </footer>
  )
}
