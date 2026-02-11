'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Phone,
  Play,
  X as XIcon,
  CheckCircle,
  Shield,
  Zap,
  Clock,
  Filter,
  BarChart3,
  Headphones,
  CalendarCheck,
} from 'lucide-react'

/* ============================================
   HOMEPAGE — Dribbble-Quality Sales Page
   ============================================ */
export default function HomePage() {

  // --- Scroll-triggered animations ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    const elements = document.querySelectorAll('.r-anim')
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="r-page">
      {/* Gradient Mesh Background Blobs */}
      <div className="r-mesh r-mesh-1" />
      <div className="r-mesh r-mesh-2" />
      <div className="r-mesh r-mesh-3" />

      {/* ========== NAV ========== */}
      <nav className="r-nav">
        <Link href="/" className="r-nav-logo">
          Retain<span>.</span>
        </Link>
        <div className="r-nav-links">
          <button onClick={() => scrollTo('features')} className="r-nav-link">Features</button>
          <button onClick={() => scrollTo('proof')} className="r-nav-link">Proof</button>
          <button onClick={() => scrollTo('pricing')} className="r-nav-link">Pricing</button>
          <Link href="/sign-up" className="r-btn r-btn-primary r-btn-sm">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="r-hero">
        <div className="r-anim">
          <div className="r-hero-badge">
            <span className="dot" />
            Now accepting partners
          </div>
        </div>
        <div className="r-anim r-d1">
          <h1>
            Your AI Salesman That
            <br />
            <span className="gradient">Never Sleeps.</span>
          </h1>
        </div>
        <div className="r-anim r-d2">
          <p className="r-hero-sub">
            Meet Jim — an AI that answers every call, qualifies every lead, and books
            appointments on your calendar. While you sleep, he sells.
          </p>
        </div>
        <div className="r-hero-actions r-anim r-d3">
          <Link href="/sign-up" className="r-btn r-btn-primary r-btn-lg">
            Start Free Trial <ArrowRight className="h-5 w-5" />
          </Link>
          <button onClick={() => scrollTo('proof')} className="r-btn r-btn-ghost r-btn-lg">
            See It Live
          </button>
        </div>
      </section>

      {/* ========== LIVE PROOF STRIP ========== */}
      <div className="r-proof r-anim">
        <span className="r-proof-text">Try it yourself</span>
        <a href="tel:+15550000000" className="r-phone-pill">
          <Phone className="h-5 w-5" />
          (555) 000-JIMS
        </a>
        <span className="r-proof-text" style={{ opacity: 0.5 }}>Call now — stump the AI</span>
      </div>

      {/* ========== COMPARISON ========== */}
      <section className="r-section" id="features">
        <div className="r-section-header r-anim">
          <div className="r-label r-label-orange">Why Retain</div>
          <h2 className="r-h2">
            Stop Buying Leads.
            <br />
            <span className="gradient">Buy Booked Appointments.</span>
          </h2>
        </div>
        <div className="r-compare">
          {/* Old Way */}
          <div className="r-compare-card old r-anim">
            <div className="r-compare-tag">
              <XIcon className="h-3 w-3" /> Without Retain
            </div>
            <h3>Bleeding Money</h3>
            <div className="r-compare-row">
              <XIcon className="r-compare-icon h-4 w-4" style={{ color: '#FF6B6B' }} />
              <span>Shared leads from Angi — 5 competitors get the same name</span>
            </div>
            <div className="r-compare-row">
              <XIcon className="r-compare-icon h-4 w-4" style={{ color: '#FF6B6B' }} />
              <span>You call back 3 hours later — they already hired someone else</span>
            </div>
            <div className="r-compare-row">
              <XIcon className="r-compare-icon h-4 w-4" style={{ color: '#FF6B6B' }} />
              <span>Endless phone tag, ghosted voicemails</span>
            </div>
            <div className="r-compare-row">
              <XIcon className="r-compare-icon h-4 w-4" style={{ color: '#FF6B6B' }} />
              <span>Paying for contacts, not results</span>
            </div>
          </div>
          {/* With Retain */}
          <div className="r-compare-card jim r-anim r-d1">
            <div className="r-compare-tag">
              <CheckCircle className="h-3 w-3" /> With Retain
            </div>
            <h3>Printing Money</h3>
            <div className="r-compare-row">
              <CheckCircle className="r-compare-icon h-4 w-4" style={{ color: 'var(--r-accent-1)' }} />
              <span><strong>Exclusive leads</strong> — ads run for you only, zero sharing</span>
            </div>
            <div className="r-compare-row">
              <CheckCircle className="r-compare-icon h-4 w-4" style={{ color: 'var(--r-accent-1)' }} />
              <span><strong>5-second response</strong> — Jim calls while they&apos;re still on your site</span>
            </div>
            <div className="r-compare-row">
              <CheckCircle className="r-compare-icon h-4 w-4" style={{ color: 'var(--r-accent-1)' }} />
              <span><strong>Qualified + booked</strong> — budget verified, slot confirmed</span>
            </div>
            <div className="r-compare-row">
              <CheckCircle className="r-compare-icon h-4 w-4" style={{ color: 'var(--r-accent-1)' }} />
              <span><strong>You pay for results</strong> — booked calendar, not a CSV</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== BENTO FEATURE GRID ========== */}
      <section className="r-section">
        <div className="r-section-header r-anim">
          <div className="r-label r-label-violet">How It Works</div>
          <h2 className="r-h2">
            Everything You Need.
            <br />
            <span className="muted">Nothing You Don&apos;t.</span>
          </h2>
        </div>
        <div className="r-bento">
          {/* Wide card — Traffic */}
          <div className="r-bento-card r-bento-8 r-anim">
            <div className="glow" style={{ background: 'var(--r-glow-orange)', top: -60, right: -60 }} />
            <div className="r-bento-icon orange">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3>Exclusive Lead Generation</h3>
            <p>
              We run high-converting Google &amp; Facebook ads in your city for your trade.
              No shared leads. No junk. Just homeowners actively searching for what you do,
              funneled directly to Jim.
            </p>
          </div>
          {/* Narrow card — Speed */}
          <div className="r-bento-card r-bento-4 r-anim r-d1">
            <div className="glow" style={{ background: 'var(--r-glow-violet)', bottom: -60, left: -60 }} />
            <div className="r-bento-icon violet">
              <Zap className="h-6 w-6" />
            </div>
            <h3>5-Second Strike</h3>
            <p>
              The instant a lead submits a form, Jim calls them. Voice, not text.
            </p>
          </div>
          {/* Narrow card — Filter */}
          <div className="r-bento-card r-bento-4 r-anim r-d2">
            <div className="glow" style={{ background: 'var(--r-glow-orange)', top: -40, left: -40 }} />
            <div className="r-bento-icon orange">
              <Filter className="h-6 w-6" />
            </div>
            <h3>Smart Qualification</h3>
            <p>
              Jim filters tire-kickers so you never waste gas on a $0 estimate.
            </p>
          </div>
          {/* Wide card — 24/7 */}
          <div className="r-bento-card r-bento-8 r-anim r-d3">
            <div className="glow" style={{ background: 'var(--r-glow-violet)', bottom: -80, right: -80 }} />
            <div className="r-bento-icon violet">
              <Clock className="h-6 w-6" />
            </div>
            <h3>24/7 AI Receptionist</h3>
            <p>
              Jim answers every call — 2 AM emergencies, weekend inquiries, mid-job interruptions.
              Never miss a lead again. He handles the conversation, qualifies the budget,
              and books the appointment directly on your calendar.
            </p>
          </div>
        </div>
      </section>

      {/* ========== AUDIO PROOF ========== */}
      <section className="r-section" id="proof">
        <div className="r-section-header r-anim">
          <div className="r-label r-label-orange">Real Calls</div>
          <h2 className="r-h2">
            Listen to Jim Close
            <br />
            <span className="gradient">Real Deals.</span>
          </h2>
        </div>
        <div className="r-audio-list">
          <div className="r-audio-card r-anim">
            <div className="r-audio-play">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <h4>The Difficult Customer</h4>
              <p>Jim calms them down, overcomes objections, and books the job. 4:32</p>
            </div>
          </div>
          <div className="r-audio-card r-anim r-d1">
            <div className="r-audio-play">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <h4>The 2 AM Emergency</h4>
              <p>Jim answers at 2 AM and secures a $12k water damage job. 3:18</p>
            </div>
          </div>
          <div className="r-audio-card r-anim r-d2">
            <div className="r-audio-play">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <h4>The Price Shopper</h4>
              <p>Handles &quot;what&apos;s your cheapest price?&quot; and books them anyway. 2:45</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== ONBOARDING STEPS ========== */}
      <section className="r-section">
        <div className="r-section-header r-anim">
          <div className="r-label r-label-violet">Setup</div>
          <h2 className="r-h2">
            Live in 48 Hours.
            <br />
            <span className="muted">Zero Technical Skills Needed.</span>
          </h2>
        </div>
        <div className="r-steps">
          <div className="r-step r-anim">
            <div className="r-step-num">1</div>
            <h4>15-Minute Strategy Call</h4>
            <p>We learn your business, ideal jobs, and service area. That&apos;s it.</p>
          </div>
          <div className="r-step r-anim r-d1">
            <div className="r-step-num">2</div>
            <h4>Connect Your Calendar</h4>
            <p>Link your calendar and define your &quot;perfect job&quot; — the calls you actually want.</p>
          </div>
          <div className="r-step r-anim r-d2">
            <div className="r-step-num">3</div>
            <h4>Jim Goes Live</h4>
            <p>He starts answering your phone and calling leads immediately. We handle everything.</p>
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section className="r-section" id="pricing">
        <div className="r-section-header r-anim">
          <div className="r-label r-label-orange">Limited Availability</div>
          <h2 className="r-h2">
            Only <span className="gradient">5 Partners</span> Per City.
          </h2>
          <p className="r-hero-sub" style={{ maxWidth: 520, margin: '0 auto' }}>
            We keep it exclusive so your leads stay yours. No competing with 50 other guys in your market.
          </p>
        </div>
        <div className="r-pricing-wrap r-anim">
          <div className="r-pricing">
            <div className="r-pricing-title">
              The <span className="gradient">Total Domination</span> Package
            </div>

            <div className="r-pricing-features">
              <div className="r-pricing-feat">
                <CheckCircle className="icon h-5 w-5" />
                <span><strong>Exclusive Lead Gen</strong> — Ad spend management included</span>
              </div>
              <div className="r-pricing-feat">
                <Headphones className="icon h-5 w-5" />
                <span><strong>24/7 AI Receptionist</strong> — Unlimited inbound minutes</span>
              </div>
              <div className="r-pricing-feat">
                <Zap className="icon h-5 w-5" />
                <span><strong>Speed-to-Lead Dialer</strong> — Instant form callback</span>
              </div>
              <div className="r-pricing-feat">
                <CalendarCheck className="icon h-5 w-5" />
                <span><strong>Daily Human Audit</strong> — We QA every call, every morning</span>
              </div>
            </div>

            <div className="r-price-row">
              <div className="r-price-old">Was $5,000/mo</div>
              <div className="r-price-num">
                $2,500 Setup <span className="gradient">+ $1,500/mo</span>
              </div>
              <div className="r-price-sub">Launch pricing — limited spots remaining</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link href="/sign-up" className="r-btn r-btn-primary r-btn-lg">
                Claim Your City <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            {/* Guarantee */}
            <div className="r-guarantee">
              <Shield className="icon h-5 w-5" />
              <div>
                <h4>Performance Guarantee</h4>
                <p>
                  If Jim doesn&apos;t book at least 5 qualified estimates in your first 30 days,
                  we refund your retainer. No questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <div className="r-final-cta">
        <div className="r-anim">
          <h2 className="r-h2">
            Your Competitors Are Sleeping.
            <br />
            <span className="gradient">Jim Isn&apos;t.</span>
          </h2>
        </div>
        <p className="r-hero-sub r-anim r-d1" style={{ margin: '0 auto 40px' }}>
          Check if your city is still available before someone else locks it down.
        </p>
        <div className="r-anim r-d2">
          <Link href="/sign-up" className="r-btn r-btn-primary r-btn-lg">
            Check Availability <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* ========== FOOTER ========== */}
      <footer className="r-footer">
        <Link href="/" className="r-nav-logo" style={{ fontSize: 16 }}>
          Retain<span>.</span>
        </Link>
        <span>© {new Date().getFullYear()} Retain Inc. All rights reserved.</span>
      </footer>
    </div>
  )
}
