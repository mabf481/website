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
  PlayCircle,
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

function PublicSite() {
  const [data, setData] = useState(fallback)
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
      ])

      if (!active) return

      const [settings, stats, activities, products, gallery] = results
      setData({
        settings: settings.data || fallback.settings,
        stats: stats.data?.length ? stats.data : fallback.stats,
        activities: activities.data?.length ? activities.data : fallback.activities,
        products: products.data?.length ? products.data : fallback.products,
        gallery: gallery.data?.length ? gallery.data : fallback.gallery,
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
            <a href="#" aria-label="Facebook"><AtSign size={16} /></a>
            <a href="#" aria-label="Instagram"><Camera size={16} /></a>
            <a href="#" aria-label="YouTube"><PlayCircle size={16} /></a>
          </div>
        </div>
      </header>

      <nav className="navbar">
        <div className="container nav-inner">
          <a className="brand" href="#beranda" onClick={() => setMenuOpen(false)}>
            <div className="brand-mark"><Leaf size={31} /></div>
            <div>
              <strong>KOPERASI PERTANIAN</strong>
              <b>LANGGENG LUMBUNG PANGAN</b>
              <b>KEDUNGNENG</b>
              <small>{data.settings.tagline}</small>
            </div>
          </a>

          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <a className="active" href="#beranda" onClick={() => setMenuOpen(false)}>Beranda</a>
            <a href="#profil" onClick={() => setMenuOpen(false)}>Profil Koperasi</a>
            <a href="#kegiatan" onClick={() => setMenuOpen(false)}>Kegiatan</a>
            <a href="#dokumentasi" onClick={() => setMenuOpen(false)}>Dokumentasi</a>
            <a href="#produk" onClick={() => setMenuOpen(false)}>Produk</a>
          </div>

          <div className="nav-actions">
            <button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Cari">
              <Search size={21} />
            </button>
            <a className="login-button" href="#dashboard"><Users size={18} /> Login Dashboard</a>
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
              <a className="primary-button" href="#profil">Profil Koperasi <ArrowRight size={18} /></a>
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
          <div className="container intro-grid">
            <div>
              <span className="section-kicker">TENTANG KAMI</span>
              <h2>Membangun ekosistem pertanian yang kuat dari Kedungneng.</h2>
            </div>
            <p>
              LLP Kedungneng hadir sebagai wadah usaha bersama untuk memperkuat petani,
              mengembangkan produk pertanian, dan membangun ketahanan pangan yang
              berkelanjutan. Konten di halaman ini terhubung langsung ke Supabase sehingga
              data kegiatan, produk, statistik, dan dokumentasi dapat dikelola dari dashboard.
            </p>
          </div>
        </section>

        <section id="kegiatan" className="content-section section">
          <div className="container">
            <SectionHeading icon={<CalendarDays />} title="Kegiatan Terbaru" href="#kegiatan" />
            <div className="three-column">
              {data.activities.slice(0, 3).map((item) => (
                <article className="activity-card" key={item.id || item.title}>
                  <img src={item.image_url} alt={item.title} loading="lazy" />
                  <div className="card-body">
                    <span className="date"><CalendarDays size={14} /> {formatDate(item.event_date)}</span>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    <a href="#kegiatan">Selengkapnya <ArrowRight size={16} /></a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="produk" className="content-section section soft">
          <div className="container">
            <SectionHeading icon={<Package />} title="Produk Unggulan" href="#produk" />
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
                    <a className="outline-button" href="#produk">Lihat Produk <ArrowRight size={16} /></a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="dokumentasi" className="content-section section">
          <div className="container">
            <SectionHeading icon={<Leaf />} title="Dokumentasi" href="#dokumentasi" />
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

function SectionHeading({ icon, title, href }) {
  return (
    <div className="section-heading">
      <h2><span>{icon}</span>{title}</h2>
      <a href={href}>Lihat Semua <ArrowRight size={16} /></a>
    </div>
  )
}


export default function App() {
  const [hash, setHash] = useState(window.location.hash || '#beranda')

  useEffect(() => {
    const onHash = () => setHash(window.location.hash || '#beranda')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return hash === '#dashboard' ? <Dashboard /> : <PublicSite />
}
