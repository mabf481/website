import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coins,
  AtSign,
  Camera,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Package,
  Phone,
  Play,
  Search,
  Users,
  X,
  CirclePlay,
} from 'lucide-react'
import { supabase } from './lib/supabase'
import Dashboard from './Dashboard'

const fallback = {
  settings: {
    name: 'Koperasi Pertanian Langgeng Lumbung Pangan Kedungneng',
    short_name: 'LLP Kedungneng',
    tagline: 'Bersama Petani untuk Ketahanan Pangan',
    address: 'Desa Kedungneng, Kecamatan Losari, Kabupaten Brebes, Jawa Tengah',
    email: 'info@lppkedungneng.or.id',
    phone: '0812 3456 7890',
    hero_title: 'Langgeng Lumbung Pangan Kedungneng',
    hero_subtitle: 'Bersama Petani, Mewujudkan Pertanian yang Produktif dan Berkelanjutan',
    hero_image_url:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=85',
    logo_url: '/logo-llp.webp',
  },
  stats: [
    { label: 'Anggota', value: '136', note: '12% dari tahun lalu', icon: 'users' },
    { label: 'Total Simpanan', value: 'Rp 850.000.000', note: '18% dari tahun lalu', icon: 'coins' },
    { label: 'Unit Usaha', value: '6', note: '2 unit baru tahun ini', icon: 'chart' },
    { label: 'Komoditas Utama', value: '2', note: 'Padi & Pisang', icon: 'leaf' },
  ],
  activities: [
    {
      title: 'Pelatihan Perbenihan Padi',
      excerpt: 'Bersama BPSB Jawa Tengah',
      event_date: '2026-10-25',
      image_url: 'https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'Demplot Padi Inpari 49',
      excerpt: 'di Desa Kedungneng',
      event_date: '2026-09-18',
      image_url: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'Sosialisasi e-RDKK',
      excerpt: 'Bersama Anggota Koperasi',
      event_date: '2026-09-10',
      image_url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
    },
  ],
  products: [
    {
      name: 'Benih Padi Inpari 49',
      description: 'Benih padi unggulan untuk produktivitas petani.',
      image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=85',
    },
    {
      name: 'Beras Medium LLP Kedungneng',
      description: 'Beras pilihan hasil produksi dan pengolahan koperasi.',
      image_url: 'https://images.unsplash.com/photo-1536304993881-ff6e9e6c8b7f?auto=format&fit=crop&w=900&q=85',
    },
    {
      name: 'Keripik Pisang Langgeng',
      description: 'Olahan pisang lokal dengan cita rasa khas Kedungneng.',
      image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=900&q=85',
    },
  ],
  gallery: [
    { title: 'Panen padi', image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=85' },
    { title: 'Kegiatan petani', image_url: 'https://images.unsplash.com/photo-1523742814516-4d8f1f2d3f6c?auto=format&fit=crop&w=900&q=85' },
    { title: 'Komoditas pisang', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=900&q=85' },
    { title: 'Pertemuan koperasi', image_url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85' },
    { title: 'Gudang hasil panen', image_url: 'https://images.unsplash.com/photo-1586528116493-da8b0d2f8f9f?auto=format&fit=crop&w=900&q=85' },
    { title: 'Lahan pertanian', image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=85' },
  ],
}

const formatDate = (value) =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value),
  )

function StatIcon({ icon }) {
  const icons = { users: Users, coins: Coins, chart: BarChart3, leaf: Leaf }
  const Icon = icons[icon] || Leaf
  return <Icon size={29} strokeWidth={2.2} />
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function PublicSite() {
  const [data, setData] = useState({ ...fallback, profile: null, units: [], timeline: [] })
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      if (!supabase) {
        setLoading(false)
        return
      }

      const results = await Promise.all([
        supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('site_stats').select('*').order('sort_order'),
        supabase.from('activities').select('*').order('sort_order'),
        supabase.from('products').select('*').order('sort_order'),
        supabase.from('gallery').select('*').order('sort_order'),
        supabase.from('koperasi_profil').select('*').limit(1).maybeSingle(),
        supabase.from('koperasi_unit_usaha').select('*').order('urutan'),
        supabase.from('koperasi_timeline').select('*').order('urutan'),
      ])

      if (!active) return

      const [settings, stats, activities, products, gallery, profile, units, timeline] = results
      setData({
        settings: settings.data || fallback.settings,
        stats: stats.data?.length ? stats.data : fallback.stats,
        activities: activities.data?.length ? activities.data : fallback.activities,
        products: products.data?.length ? products.data : fallback.products,
        gallery: gallery.data?.length ? gallery.data : fallback.gallery,
        profile: profile.data || null,
        units: units.data || [],
        timeline: timeline.data || [],
      })
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((current) => (current + 1) % 3)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const heroImages = useMemo(
    () => [
      data.settings.hero_image_url,
      data.gallery[0]?.image_url || fallback.gallery[0].image_url,
      data.gallery[5]?.image_url || fallback.gallery[5].image_url,
    ],
    [data],
  )

  return (
    <div className="site">
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="contact">
            <span><MapPin size={15} /> {data.settings.address}</span>
            <span className="desktop-only"><Mail size={15} /> {data.settings.email}</span>
            <span className="desktop-only"><Phone size={15} /> {data.settings.phone}</span>
          </div>
          <div className="socials">
            <button type="button" className="social-link" aria-label="Facebook"><AtSign size={16} /></button>
            <button type="button" className="social-link" aria-label="Instagram"><Camera size={16} /></button>
            <button type="button" className="social-link" aria-label="YouTube"><CirclePlay size={16} /></button>
          </div>
        </div>
      </header>

      <nav className="navbar">
        <div className="container nav-inner">
          <button type="button" className="brand" onClick={() => { scrollToSection("beranda"); setMenuOpen(false) }}>
            <img
              className="brand-logo"
              src={data.settings.logo_url || fallback.settings.logo_url}
              alt="Logo LLP Kedungneng"
            />
            <div>
              <strong>KOPERASI PERTANIAN</strong>
              <b>LANGGENG LUMBUNG PANGAN</b>
              <b>KEDUNGNENG</b>
              <small>{data.settings.tagline}</small>
            </div>
          </button>

          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <button type="button" className="active" onClick={() => { scrollToSection("beranda"); setMenuOpen(false) }}>Beranda</button>
            <button type="button" onClick={() => { scrollToSection("profil"); setMenuOpen(false) }}>Profil Koperasi</button>
            <button type="button" onClick={() => { scrollToSection("kegiatan"); setMenuOpen(false) }}>Kegiatan</button>
            <button type="button" onClick={() => { scrollToSection("dokumentasi"); setMenuOpen(false) }}>Dokumentasi</button>
            <button type="button" onClick={() => { scrollToSection("produk"); setMenuOpen(false) }}>Produk</button>
          </div>

          <div className="nav-actions">
            <button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Cari">
              <Search size={21} />
            </button>
            <a className="login-button" href="/dashboard"><Users size={18} /> Login Dashboard</a>
            <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="search-panel">
            <div className="container">
              <input autoFocus placeholder="Cari kegiatan, produk, atau dokumentasi..." />
            </div>
          </div>
        )}
      </nav>

      <main>
        <section id="beranda" className="hero">
          <div
            className="hero-bg"
            style={{ backgroundImage: `url(${heroImages[slide]})` }}
          />
          <div className="hero-overlay" />
          <div className="container hero-content">
            <div className="eyebrow">KOPERASI PERTANIAN</div>
            <h1>{data.settings.hero_title}</h1>
            <p>{data.settings.hero_subtitle}</p>
            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={() => scrollToSection("profil")}>Profil Koperasi <ArrowRight size={18} /></button>
              <button className="secondary-button"><Play size={18} fill="currentColor" /> Video Profil</button>
            </div>
          </div>
          <div className="hero-dots">
            {heroImages.map((_, index) => (
              <button
                key={index}
                className={index === slide ? 'selected' : ''}
                onClick={() => setSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
          <div className="hero-badge">
            <span>Pertanian Maju</span>
            <span>Petani Sejahtera</span>
            <span>Pangan Berkelanjutan</span>
          </div>
        </section>

        <section className="stats">
          <div className="container stats-grid">
            {data.stats.map((stat) => (
              <article className="stat" key={stat.id || stat.label}>
                <div className="stat-icon"><StatIcon icon={stat.icon} /></div>
                <div>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                  <small>{stat.note}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="profil" className="intro section">
          <div className="container">
            <div className="profile-intro">
              <div className="profile-intro-copy">
                <span className="section-kicker">PROFIL KOPERASI</span>
                <h2>{data.profile?.nama || 'Koperasi Pertanian Langgeng Lumbung Pangan Kedungneng'}</h2>
                {data.profile?.slogan && <p className="profile-slogan">{data.profile.slogan}</p>}
              </div>
              {data.profile?.foto_profil_url && (
                <div className="profile-photo">
                  <img src={data.profile.foto_profil_url} alt="Foto Profil Koperasi LLP Kedungneng" />
                </div>
              )}
            </div>

            <div className="profile-highlight-grid">
              {data.profile?.sejarah && (
                <article className="profile-card profile-card-story">
                  <span className="section-kicker">SEJARAH</span>
                  <p className="profile-long-text">{data.profile.sejarah}</p>
                </article>
              )}
              {data.profile?.visi && (
                <article className="profile-card">
                  <span className="section-kicker">VISI</span>
                  <p>{data.profile.visi}</p>
                </article>
              )}
              {data.profile?.legalitas && (
                <article className="profile-card">
                  <span className="section-kicker">LEGALITAS</span>
                  <p>{data.profile.legalitas}</p>
                </article>
              )}
            </div>

            {Array.isArray(data.profile?.misi) && data.profile.misi.filter(Boolean).length > 0 && (
              <div className="profile-block">
                <div className="section-heading"><h2><span><Leaf size={22} /></span>Misi</h2></div>
                <div className="mission-grid">
                  {data.profile.misi.filter(Boolean).map((item, index) => (
                    <article className="mission-item" key={index}><strong>{String(index + 1).padStart(2, '0')}</strong><p>{item}</p></article>
                  ))}
                </div>
              </div>
            )}

            {data.units.length > 0 && (
              <div className="profile-block">
                <div className="section-heading"><h2><span><Leaf size={22} /></span>Unit Usaha</h2></div>
                <div className="three-column">
                  {data.units.map((item) => <article className="profile-card profile-unit-card" key={item.id}><div className="profile-icon">{item.icon}</div><h3>{item.nama}</h3><p>{item.deskripsi}</p></article>)}
                </div>
              </div>
            )}

            {data.timeline.length > 0 && (
              <div className="profile-block">
                <div className="section-heading"><h2><span><CalendarDays size={22} /></span>Perjalanan Koperasi</h2></div>
                <div className="timeline">
                  {data.timeline.map((item) => <article className="timeline-item" key={item.id}><strong>{item.tahun}</strong><div><h3>{item.judul}</h3><p>{item.deskripsi}</p></div></article>)}
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="kegiatan" className="content-section section">
          <div className="container">
            <SectionHeading icon={<CalendarDays />} title="Kegiatan Terbaru" target="kegiatan" />
            <div className="three-column">
              {data.activities.slice(0, 3).map((item) => (
                <article className="activity-card" key={item.id || item.title}>
                  <img src={item.image_url} alt={item.title} loading="lazy" />
                  <div className="card-body">
                    <span className="date"><CalendarDays size={14} /> {formatDate(item.event_date)}</span>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    <button type="button" className="text-link" onClick={() => scrollToSection("kegiatan")}>Selengkapnya <ArrowRight size={16} /></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="produk" className="content-section section soft">
          <div className="container">
            <SectionHeading icon={<Package />} title="Produk Unggulan" target="produk" />
            <div className="three-column">
              {data.products.slice(0, 3).map((item) => (
                <article className="product-card" key={item.id || item.name}>
                  <div className="product-image">
                    <img src={item.image_url} alt={item.name} loading="lazy" />
                    <span>Produk LLP</span>
                  </div>
                  <div className="card-body">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <button type="button" className="outline-button" onClick={() => scrollToSection("produk")}>Lihat Produk <ArrowRight size={16} /></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="dokumentasi" className="content-section section">
          <div className="container">
            <SectionHeading icon={<Leaf />} title="Dokumentasi" target="dokumentasi" />
            <div className="gallery-grid">
              {data.gallery.slice(0, 6).map((item) => (
                <figure key={item.id || item.image_url}>
                  <img src={item.image_url} alt={item.title || 'Dokumentasi LLP Kedungneng'} loading="lazy" />
                  {item.title && <figcaption>{item.title}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="dashboard">
        <div className="container footer-grid">
          <div>
            <div className="footer-brand"><Leaf size={24} /> {data.settings.short_name}</div>
            <p>{data.settings.tagline}</p>
          </div>
          <div>
            <strong>Kontak</strong>
            <p><MapPin size={15} /> {data.settings.address}</p>
            <p><Mail size={15} /> {data.settings.email}</p>
            <p><Phone size={15} /> {data.settings.phone}</p>
          </div>
          <div>
            <strong>Dashboard</strong>
            <p>Area pengelolaan konten, statistik, kegiatan, produk, dan dokumentasi.</p>
            <button className="footer-login">Login Dashboard</button>
          </div>
        </div>
        <div className="copyright">© {new Date().getFullYear()} LLP Kedungneng. Semua hak dilindungi.</div>
      </footer>

      {loading && <div className="loading">Memuat data...</div>}
    </div>
  )
}

function SectionHeading({ icon, title, target }) {
  return (
    <div className="section-heading">
      <h2><span>{icon}</span>{title}</h2>
      <button type="button" className="section-link" onClick={() => scrollToSection(target)}>Lihat Semua <ArrowRight size={16} /></button>
    </div>
  )
}


export default function App() {
  const [hash, setHash] = useState(window.location.hash || '')

  useEffect(() => {
    const onHash = () => setHash(window.location.hash || '')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (window.location.pathname === '/dashboard' || hash === '#dashboard') ? <Dashboard /> : <PublicSite />
}
