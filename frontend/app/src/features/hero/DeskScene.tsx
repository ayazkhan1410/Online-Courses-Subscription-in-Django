import { useReducedMotion } from '@/hooks/useReducedMotion'

/** Pure CSS 3D desk from the design mockup. No three.js. */
export function DeskScene() {
  const reduce = useReducedMotion()
  return (
    <div className="scene" aria-hidden="true">
      <div className="lamp" />
      <div className="stage" style={reduce ? { animation: 'none' } : undefined}>
        <div className="shadow-blob" />
        <div className="phone">
          <div className="screen">
            <div className="scr-video">
              <div>
                <span className="kw">fruits</span> = [
                <span className="s">&quot;apple&quot;</span>,{' '}
                <span className="s">&quot;mango&quot;</span>]
              </div>
              <div>
                <span className="kw">marks</span> = [72, 88, 95]
              </div>
              <div>
                fruits.append(<span className="s">&quot;kiwi&quot;</span>)
              </div>
              <div>
                <span className="kw">print</span>(fruits[1:])
              </div>
            </div>
            <div className="scr-bar">
              <div className="t">
                <i />
              </div>
              Day 08/50 · How to create a list
            </div>
          </div>
        </div>
        <div className="book">
          <div className="book-cover" />
          <div className="page l">
            <h5>Python in 50 days</h5>
            <div className="pm">STUDY WITH AYAZ · 50 LESSONS</div>
            <div className="big">
              07<small> / 50</small>
            </div>
            <div className="sk">
              {Array.from({ length: 25 }, (_, i) => (
                <i
                  key={i}
                  className={i < 7 ? 'on' : i === 7 ? 'now' : undefined}
                />
              ))}
            </div>
          </div>
          <div className="page r">
            <ol>
              <li className="done">
                <b className="bx" />
                <span>Day 04 · Comments</span>
              </li>
              <li className="done">
                <b className="bx" />
                <span>Day 05 · User input</span>
              </li>
              <li className="done">
                <b className="bx" />
                <span>Day 06 · Typecasting</span>
              </li>
              <li className="done">
                <b className="bx" />
                <span>Day 07 · Types of casting</span>
              </li>
              <li className="now">
                <b className="bx" />
                <span>Day 08 · Create a list</span>
              </li>
              <li>
                <b className="bx" />
                <span>Day 09 · List methods</span>
              </li>
              <li>
                <b className="bx" />
                <span>Day 10 · Strings</span>
              </li>
              <li>
                <b className="bx" />
                <span>Day 11 · Positive slicing</span>
              </li>
              <li>
                <b className="bx" />
                <span>Day 12 · Negative slicing</span>
              </li>
            </ol>
          </div>
        </div>
        <div className="pencil" />
      </div>
    </div>
  )
}
