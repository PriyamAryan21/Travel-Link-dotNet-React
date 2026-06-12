import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    MapPin,
    Wallet,
    Sparkles,
    ArrowRight,
    Users,
    UserCheck,
    CreditCard,
    HandCoins,
    Lightbulb,
    Vote,
    ShieldCheck,
} from 'lucide-react';
import './landing.css';

const coreFeatures = [
    {
        icon: MapPin,
        color: 'rose',
        title: 'Live Location Sharing',
        desc: "See where everyone is on a shared map — in real time. Whether your whole squad is exploring a new city or you're meeting a friend across town, nobody gets lost.",
        subs: [
            {
                icon: Users,
                title: 'Group Sessions',
                desc: "Start a live session for your trip group. Everyone's location lights up on one map, so you can coordinate without the \"where are you??\" texts.",
            },
            {
                icon: UserCheck,
                title: 'One-to-One Sessions',
                desc: "Share your live pin with a single friend for meetups, airport pickups, or just making sure everyone gets back to the hotel safely.",
            },
        ],
    },
    {
        icon: Wallet,
        color: 'emerald',
        title: 'Expense Split Module',
        desc: "Splitting bills on a trip shouldn't require a spreadsheet. Log expenses, split them fairly, and settle up — all without the awkward \"you owe me\" conversations.",
        subs: [
            {
                icon: CreditCard,
                title: 'Group Expenses',
                desc: "Add a dinner bill, a cab ride, or an Airbnb booking. Choose who's in, and TravelLink splits it evenly or by custom amounts.",
            },
            {
                icon: HandCoins,
                title: 'Personal Settlements',
                desc: "Track what you owe and what's owed to you across all your trips. Mark debts as settled with one tap when someone pays up.",
            },
        ],
    },
    {
        icon: Sparkles,
        color: 'amber',
        title: 'Smart AI Itinerary Builder',
        desc: "Tell us your destination, budget, and vibe — our AI crafts a day-by-day itinerary that actually makes sense. Then let your group shape it together.",
        subs: [
            {
                icon: Lightbulb,
                title: 'Suggestions',
                desc: "Group members can suggest places, activities, or restaurants. Every idea gets heard before the plan is locked in.",
            },
            {
                icon: Vote,
                title: 'Democratic Voting',
                desc: "Can't decide between the beach or the mountains? Put it to a vote. The group decides, no hard feelings.",
            },
            {
                icon: ShieldCheck,
                title: 'Admin Approval',
                desc: "The trip admin reviews and approves suggestions, keeping the itinerary clean and avoiding that one friend's questionable ideas.",
            },
        ],
    },
];

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const revealRefs = useRef<HTMLDivElement[]>([]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        );

        revealRefs.current.forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const addRevealRef = (el: HTMLDivElement | null) => {
        if (el && !revealRefs.current.includes(el)) {
            revealRefs.current.push(el);
        }
    };

    return (
        <div className="landing-page">
            {/* Animated Background */}
            <div className="landing-bg" />
            <div className="landing-bg-overlay" />
            <div className="landing-orb landing-orb-1" />
            <div className="landing-orb landing-orb-2" />
            <div className="landing-orb landing-orb-3" />

            {/* Content */}
            <div className="landing-content">
                {/* ── Navbar ─────────────────────────── */}
                <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                    <div className="landing-nav-logo">
                        <span className="logo-travel">Travel</span>
                        <span className="logo-link">Link</span>
                    </div>
                    <div className="landing-nav-actions">
                        <Link to="/login" className="landing-btn-ghost">
                            Sign In
                        </Link>
                        <Link to="/register" className="landing-btn-primary">
                            Get Started
                        </Link>
                    </div>
                </nav>

                {/* ── Hero ───────────────────────────── */}
                <section className="landing-hero">
                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        Your next adventure starts here
                    </div>

                    <div className="hero-logo">
                        <span className="logo-travel">Travel</span>
                        <span className="logo-link">Link</span>
                    </div>

                    <p className="hero-tagline">
                        The all-in-one platform for planning trips with friends.
                        Share locations live, split every expense, and let AI
                        build the perfect itinerary — effortlessly.
                    </p>

                    <div className="hero-cta-group">
                        <Link to="/register" className="hero-btn-start">
                            Start Planning <ArrowRight size={18} />
                        </Link>
                        <a href="#features" className="hero-btn-explore">
                            See What's Inside
                        </a>
                    </div>

                    <div className="stats-bar">
                        <div className="stat-item">
                            <div className="stat-value">3</div>
                            <div className="stat-label">Core Modules</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">AI</div>
                            <div className="stat-label">Powered Itineraries</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">Real-time</div>
                            <div className="stat-label">Live Tracking</div>
                        </div>
                    </div>
                </section>

                {/* ── Features ───────────────────────── */}
                <section className="landing-section" id="features">
                    <div className="section-header">
                        <div className="section-label reveal" ref={addRevealRef}>
                            <Sparkles size={14} /> Core Features
                        </div>
                        <h2 className="section-title reveal" ref={addRevealRef}>
                            Three modules.<br />One seamless experience.
                        </h2>
                        <p className="section-description reveal" ref={addRevealRef}>
                            We built TravelLink around the three things that
                            make or break a group trip — staying connected,
                            managing money, and planning the fun stuff.
                        </p>
                    </div>

                    <div className="features-list">
                        {coreFeatures.map((feature, idx) => (
                            <div
                                key={feature.title}
                                className={`feature-block reveal ${idx % 2 !== 0 ? 'feature-block-reverse' : ''}`}
                                ref={addRevealRef}
                            >
                                {/* Main feature card */}
                                <div className="feature-main-card">
                                    <div className={`feature-icon-wrap ${feature.color}`}>
                                        <feature.icon size={30} />
                                    </div>
                                    <div className="feature-number">0{idx + 1}</div>
                                    <h3 className="feature-title">{feature.title}</h3>
                                    <p className="feature-desc">{feature.desc}</p>
                                </div>

                                {/* Sub-features */}
                                <div className="feature-subs">
                                    {feature.subs.map((sub, si) => (
                                        <div
                                            key={sub.title}
                                            className={`feature-sub-card reveal reveal-delay-${si + 1}`}
                                            ref={addRevealRef}
                                        >
                                            <div className={`feature-sub-icon ${feature.color}`}>
                                                <sub.icon size={20} />
                                            </div>
                                            <div className="feature-sub-content">
                                                <h4 className="feature-sub-title">{sub.title}</h4>
                                                <p className="feature-sub-desc">{sub.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Final CTA ──────────────────────── */}
                <section className="landing-cta">
                    <div className="cta-glow" />
                    <div className="cta-card reveal" ref={addRevealRef}>
                        <h2 className="cta-title">
                            Ready to plan something amazing?
                        </h2>
                        <p className="cta-desc">
                            Join TravelLink and turn your next trip from a chaotic
                            group chat into a beautifully organized adventure.
                            It's free to get started.
                        </p>
                        <Link to="/register" className="cta-btn">
                            Create Your Account <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>

                {/* ── Footer ─────────────────────────── */}
                <footer className="landing-footer">
                    © {new Date().getFullYear()} TravelLink. Crafted with ☕ and wanderlust By Priyam Aryan.
                </footer>
            </div>
        </div>
    );
}
