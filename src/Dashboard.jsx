import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  Image,
  Leaf,
  LogOut,
  Package,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  Plus,
} from 'lucide-react'
import { supabase } from './lib/supabase'

const tabs = [
  ['overview', 'Ringkasan', BarChart3],
  ['settings', 'Profil Website', Settings],
  ['profile', 'Profil Koperasi', Leaf],
  ['stats', 'Statistik', Users],
  ['activities', 'Kegiatan', CalendarDays],
  ['products', 'Produk', Package],
  ['gallery', 'Dokumentasi', Image],
]

const empty = {
  stats: { label: '', value: '', note: '', icon: 'users', sort_order: 0, published: true },
  activities: { title: '', excerpt: '', event_date: new Date().toISOString().slice(0, 10), image_url: '', sort_order: 0, published: true },
  products: { name: '', description: '', image_url: '', price_text: '', sort_order: 0, published: true },
  gallery: { title: '', image_url: '', sort_order: 0, published: true },
}

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [admin, setAdmin] = useState(false)
  const [login, setLogin] = useState({ email: '', password: '' })
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState({ settings: null, profile: null, units: [], timeline: [], stats: [], activities: [], products: [], gallery: [] })
  const [draft, setDraft] = useState(empty.stats)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) load()
  }, [session])

  async function load() {
    const [{ data: me }, settings, stats, activities, products, gallery] = await Promise.all([
      supabase.from('koperasi_admin').select('id,email,nama,role,active').eq('id', session.user.id).maybeSingle(),
      supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('koperasi_profil').select('*').limit(1).maybeSingle(),
      supabase.from('koperasi_unit_usaha').select('*').order('urutan'),
      supabase.from('koperasi_timeline').select('*').order('urutan'),
      supabase.from('site_stats').select('*').order('sort_order'),
      supabase.from('activities').select('*').order('sort_order'),
      supabase.from('products').select('*').order('sort_order'),
      supabase.from('gallery').select('*').order('sort_order'),
    ])
    setAdmin(Boolean(me))
    setData({
      settings: settings.data,
      profile: profile.data,
      units: units.data || [],
      timeline: timeline.data || [],
      stats: stats.data || [],
      activities: activities.data || [],
      products: products.data || [],
      gallery: gallery.data || [],
    })
  }

  async function signIn(event) {
    event.preventDefault()
    setMessage('Memproses login...')
    const { error } = await supabase.auth.signInWithPassword(login)
    setMessage(error ? error.message : 'Login berhasil.')
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.hash = ''
  }

  if (!session) {
    return (
      <div className="dashboard-shell login-shell">
        <form className="login-card" onSubmit={signIn}>
          <div className="dashboard-logo"><Leaf size={30} /></div>
          <span className="section-kicker">LLP KEDUNGNENG</span>
          <h1>Login Dashboard</h1>
          <p>Kelola profil, statistik, kegiatan, produk, dan dokumentasi website.</p>
          <label>Email<input type="email" required value={login.email} onChange={e => setLogin({ ...login, email: e.target.value })} /></label>
          <label>Password<input type="password" required value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} /></label>
          <button className="dashboard-primary" type="submit"><ShieldCheck size={18} /> Masuk</button>
          {message && <div className="dashboard-message">{message}</div>}
          <a className="back-site" href="#beranda">← Kembali ke website</a>
        </form>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="dashboard-shell login-shell">
        <div className="login-card">
          <div className="dashboard-logo"><ShieldCheck size={30} /></div>
          <h1>Akun belum terdaftar sebagai admin</h1>
          <p>Akun berhasil login, tetapi belum memiliki akses dashboard. Tambahkan User ID akun ini ke tabel <code>admin_users</code> di Supabase.</p>
          <code className="user-id">{session.user.id}</code>
          <button className="dashboard-secondary" onClick={signOut}><LogOut size={17} /> Keluar</button>
        </div>
      </div>
    )
  }

  const counts = {
    stats: data.stats.length,
    activities: data.activities.length,
    products: data.products.length,
    gallery: data.gallery.length,
    units: data.units.length,
    timeline: data.timeline.length,
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <a className="dashboard-brand" href="#dashboard"><Leaf size={28} /><span>LLP<br />Kedungneng</span></a>
        <nav>
          {tabs.map(([id, label, Icon]) => (
            <button key={id} className={tab === id ? 'selected' : ''} onClick={() => { setTab(id); setEditing(null) }}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <button className="dashboard-logout" onClick={signOut}><LogOut size={17} /> Keluar</button>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-top">
          <div>
            <span className="section-kicker">DASHBOARD ADMIN</span>
            <h1>{tabs.find(t => t[0] === tab)?.[1]}</h1>
          </div>
          <a className="view-site" href="#beranda">Lihat Website ↗</a>
        </div>

        {message && <div className="dashboard-alert">{message}</div>}

        {tab === 'overview' && <Overview counts={counts} email={session.user.email} />}
        {tab === 'settings' && <SettingsForm data={data.settings} onSaved={load} setMessage={setMessage} />}
        {tab === 'profile' && <ProfileManager profile={data.profile} units={data.units} timeline={data.timeline} onSaved={load} setMessage={setMessage} />}
        {['stats', 'activities', 'products', 'gallery'].includes(tab) && (
          <ContentManager
            type={tab}
            items={data[tab]}
            draft={editing ? editing.data : draft}
            editing={editing}
            setEditing={setEditing}
            setDraft={setDraft}
            onSaved={load}
            setMessage={setMessage}
          />
        )}
      </main>
    </div>
  )
}

function Overview({ counts, email }) {
  return (
    <div>
      <div className="welcome-card">
        <div>
          <span className="section-kicker">SELAMAT DATANG</span>
          <h2>Kelola website LLP Kedungneng dari satu tempat.</h2>
          <p>Login sebagai <strong>{email}</strong>. Semua perubahan tersimpan langsung di Supabase.</p>
        </div>
        <Leaf size={80} strokeWidth={1.2} />
      </div>
      <div className="admin-count-grid">
        {[
          ['Statistik', counts.stats, BarChart3],
          ['Kegiatan', counts.activities, CalendarDays],
          ['Produk', counts.products, Package],
          ['Dokumentasi', counts.gallery, Image],
        ].map(([label, value, Icon]) => (
          <div className="admin-count" key={label}><Icon size={22} /><strong>{value}</strong><span>{label}</span></div>
        ))}
      </div>
      <div className="dashboard-note">
        <ShieldCheck size={20} />
        <div><strong>Keamanan</strong><p>Akses edit hanya diberikan kepada akun yang terdaftar di <code>admin_users</code>. Pengunjung publik hanya membaca konten yang dipublikasikan.</p></div>
      </div>
    </div>
  )
}

function SettingsForm({ data, onSaved, setMessage }) {
  const [form, setForm] = useState(data || {})
  useEffect(() => setForm(data || {}), [data])

  async function save(e) {
    e.preventDefault()
    const { error } = await supabase.from('site_settings').upsert({ ...form, id: 1 })
    setMessage(error ? error.message : 'Profil website berhasil disimpan.')
    if (!error) onSaved()
  }

  const fields = [
    ['name', 'Nama koperasi'], ['short_name', 'Nama singkat'], ['tagline', 'Tagline'],
    ['address', 'Alamat'], ['email', 'Email'], ['phone', 'Telepon'],
    ['hero_title', 'Judul hero'], ['hero_subtitle', 'Subjudul hero'], ['hero_image_url', 'URL gambar hero'],
    ['logo_url', 'URL logo'],
  ]

  return <form className="admin-form" onSubmit={save}>
    <div className="form-grid">
      {fields.map(([key, label]) => (
        <label key={key} className={key.includes('subtitle') || key === 'address' ? 'wide' : ''}>
          {label}
          {key.includes('subtitle') || key === 'address' ? <textarea rows="3" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} /> :
            <input value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />}
        </label>
      ))}
    </div>
    <button className="dashboard-primary" type="submit"><Save size={17} /> Simpan Profil</button>
  </form>
}

function ContentManager({ type, items, draft, editing, setEditing, setDraft, onSaved, setMessage }) {
  const labels = { stats: 'Statistik', activities: 'Kegiatan', products: 'Produk', gallery: 'Dokumentasi' }
  const fields = {
    stats: [['label', 'Label'], ['value', 'Nilai'], ['note', 'Catatan'], ['icon', 'Ikon'], ['sort_order', 'Urutan']],
    activities: [['title', 'Judul'], ['excerpt', 'Ringkasan'], ['event_date', 'Tanggal'], ['image_url', 'URL gambar'], ['sort_order', 'Urutan']],
    products: [['name', 'Nama produk'], ['description', 'Deskripsi'], ['image_url', 'URL gambar'], ['price_text', 'Teks tombol'], ['sort_order', 'Urutan']],
    gallery: [['title', 'Judul'], ['image_url', 'URL gambar'], ['sort_order', 'Urutan']],
  }[type]

  function startNew() {
    setEditing({ data: { ...empty[type] } })
  }

  function edit(item) {
    setEditing({ data: { ...item } })
  }

  async function save(e) {
    e.preventDefault()
    const payload = { ...draft, sort_order: Number(draft.sort_order || 0), published: Boolean(draft.published) }
    let query = supabase.from(type === 'activities' ? 'activities' : type).upsert(payload)
    const { error } = await query
    setMessage(error ? error.message : `${labels[type]} berhasil disimpan.`)
    if (!error) {
      setEditing(null)
      onSaved()
    }
  }

  async function remove(id) {
    if (!confirm('Hapus data ini?')) return
    const { error } = await supabase.from(type).delete().eq('id', id)
    setMessage(error ? error.message : 'Data berhasil dihapus.')
    if (!error) onSaved()
  }

  return (
    <div className="manager">
      <div className="manager-toolbar">
        <p>{items.length} data tersimpan</p>
        <button className="dashboard-primary small" onClick={startNew}><Plus size={16} /> Tambah {labels[type]}</button>
      </div>
      {editing && (
        <form className="editor-card" onSubmit={save}>
          <h2>{editing.data.id ? 'Edit' : 'Tambah'} {labels[type]}</h2>
          <div className="form-grid">
            {fields.map(([key, label]) => (
              <label key={key} className={['description', 'excerpt'].includes(key) ? 'wide' : ''}>
                {label}
                {['description', 'excerpt'].includes(key) ? <textarea rows="3" value={draft[key] || ''} onChange={e => setEditing({ data: { ...draft, [key]: e.target.value } })} /> :
                  <input type={key === 'event_date' ? 'date' : key === 'sort_order' ? 'number' : 'text'} value={draft[key] ?? ''} onChange={e => setEditing({ data: { ...draft, [key]: e.target.value } })} />}
              </label>
            ))}
            <label className="checkbox"><input type="checkbox" checked={draft.published !== false} onChange={e => setEditing({ data: { ...draft, published: e.target.checked } })} /> Tampilkan di website</label>
          </div>
          <div className="editor-actions">
            <button className="dashboard-primary" type="submit"><Save size={17} /> Simpan</button>
            <button type="button" className="dashboard-secondary" onClick={() => setEditing(null)}>Batal</button>
          </div>
        </form>
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Isi</th><th>Publikasi</th><th>Aksi</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td><strong>{item.title || item.name || item.label}</strong><small>{item.excerpt || item.description || item.value || item.image_url}</small></td>
                <td><span className={item.published ? 'status on' : 'status'}>{item.published ? 'Tampil' : 'Disembunyikan'}</span></td>
                <td><div className="table-actions"><button onClick={() => edit(item)}>Edit</button><button className="delete" onClick={() => remove(item.id)}><Trash2 size={15} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


function ProfileManager({ profile, units, timeline, onSaved, setMessage }) {
  const [form, setForm] = useState(profile || {})
  const [unitDraft, setUnitDraft] = useState(null)
  const [timelineDraft, setTimelineDraft] = useState(null)
  useEffect(() => setForm(profile || {}), [profile])

  async function saveProfile(e) {
    e.preventDefault()
    const payload = {
      ...form,
      misi: Array.isArray(form.misi) ? form.misi : String(form.misi || '').split('\n').map(x => x.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('koperasi_profil').upsert(payload)
    setMessage(error ? error.message : 'Profil koperasi berhasil disimpan.')
    if (!error) onSaved()
  }

  async function saveUnit(e) {
    e.preventDefault()
    const payload = { ...unitDraft, urutan: Number(unitDraft.urutan || 0), aktif: unitDraft.aktif !== false }
    const { error } = await supabase.from('koperasi_unit_usaha').upsert(payload)
    setMessage(error ? error.message : 'Unit usaha berhasil disimpan.')
    if (!error) { setUnitDraft(null); onSaved() }
  }

  async function saveTimeline(e) {
    e.preventDefault()
    const payload = { ...timelineDraft, urutan: Number(timelineDraft.urutan || 0), aktif: timelineDraft.aktif !== false }
    const { error } = await supabase.from('koperasi_timeline').upsert(payload)
    setMessage(error ? error.message : 'Timeline berhasil disimpan.')
    if (!error) { setTimelineDraft(null); onSaved() }
  }

  async function remove(table, id, label) {
    if (!confirm('Hapus ' + label + ' ini?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    setMessage(error ? error.message : label + ' berhasil dihapus.')
    if (!error) onSaved()
  }

  const missionText = Array.isArray(form.misi) ? form.misi.join('\n') : (form.misi || '')

  return (
    <div className="manager">
      <form className="admin-form" onSubmit={saveProfile}>
        <div className="form-grid">
          {[
            ['nama', 'Nama koperasi'],
            ['slogan', 'Slogan'],
            ['alamat', 'Alamat'],
            ['legalitas', 'Legalitas'],
            ['telepon', 'Telepon'],
            ['whatsapp', 'WhatsApp'],
            ['email', 'Email'],
            ['hero_image_url', 'URL foto utama'],
          ].map(([key, label]) => (
            <label key={key}>{label}<input value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>
          ))}
          <label className="wide">Deskripsi<textarea rows="4" value={form.deskripsi || ''} onChange={e => setForm({ ...form, deskripsi: e.target.value })} /></label>
          <label className="wide">Sejarah<textarea rows="6" value={form.sejarah || ''} onChange={e => setForm({ ...form, sejarah: e.target.value })} /></label>
          <label className="wide">Visi<textarea rows="4" value={form.visi || ''} onChange={e => setForm({ ...form, visi: e.target.value })} /></label>
          <label className="wide">Misi — satu misi per baris<textarea rows="8" value={missionText} onChange={e => setForm({ ...form, misi: e.target.value.split('\n') })} /></label>
        </div>
        <button className="dashboard-primary" type="submit"><Save size={17} /> Simpan Profil Koperasi</button>
      </form>

      <section className="manager-section">
        <div className="manager-toolbar"><div><h2>Unit Usaha</h2><p>{units.length} unit usaha</p></div><button className="dashboard-primary small" onClick={() => setUnitDraft({ nama:'', deskripsi:'', icon:'🌾', urutan:units.length+1, aktif:true })}><Plus size={16}/> Tambah</button></div>
        {unitDraft && <form className="editor-card" onSubmit={saveUnit}><div className="form-grid">
          <label>Nama<input required value={unitDraft.nama} onChange={e=>setUnitDraft({...unitDraft,nama:e.target.value})}/></label>
          <label>Ikon<input value={unitDraft.icon} onChange={e=>setUnitDraft({...unitDraft,icon:e.target.value})}/></label>
          <label>Urutan<input type="number" value={unitDraft.urutan} onChange={e=>setUnitDraft({...unitDraft,urutan:e.target.value})}/></label>
          <label className="wide">Deskripsi<textarea rows="3" value={unitDraft.deskripsi} onChange={e=>setUnitDraft({...unitDraft,deskripsi:e.target.value})}/></label>
        </div><div className="editor-actions"><button className="dashboard-primary" type="submit"><Save size={17}/> Simpan</button><button type="button" className="dashboard-secondary" onClick={()=>setUnitDraft(null)}>Batal</button></div></form>}
        <div className="admin-table-wrap"><table className="admin-table"><tbody>{units.map(item=><tr key={item.id}><td><strong>{item.icon} {item.nama}</strong><small>{item.deskripsi}</small></td><td><div className="table-actions"><button onClick={()=>setUnitDraft({...item})}>Edit</button><button className="delete" onClick={()=>remove('koperasi_unit_usaha',item.id,'Unit usaha')}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>
      </section>

      <section className="manager-section">
        <div className="manager-toolbar"><div><h2>Perjalanan Koperasi</h2><p>{timeline.length} tahapan</p></div><button className="dashboard-primary small" onClick={()=>setTimelineDraft({tahun:'',judul:'',deskripsi:'',urutan:timeline.length+1,aktif:true})}><Plus size={16}/> Tambah</button></div>
        {timelineDraft && <form className="editor-card" onSubmit={saveTimeline}><div className="form-grid">
          <label>Tahun<input required value={timelineDraft.tahun} onChange={e=>setTimelineDraft({...timelineDraft,tahun:e.target.value})}/></label>
          <label>Judul<input required value={timelineDraft.judul} onChange={e=>setTimelineDraft({...timelineDraft,judul:e.target.value})}/></label>
          <label>Urutan<input type="number" value={timelineDraft.urutan} onChange={e=>setTimelineDraft({...timelineDraft,urutan:e.target.value})}/></label>
          <label className="wide">Deskripsi<textarea rows="3" value={timelineDraft.deskripsi} onChange={e=>setTimelineDraft({...timelineDraft,deskripsi:e.target.value})}/></label>
        </div><div className="editor-actions"><button className="dashboard-primary" type="submit"><Save size={17}/> Simpan</button><button type="button" className="dashboard-secondary" onClick={()=>setTimelineDraft(null)}>Batal</button></div></form>}
        <div className="admin-table-wrap"><table className="admin-table"><tbody>{timeline.map(item=><tr key={item.id}><td><strong>{item.tahun} — {item.judul}</strong><small>{item.deskripsi}</small></td><td><div className="table-actions"><button onClick={()=>setTimelineDraft({...item})}>Edit</button><button className="delete" onClick={()=>remove('koperasi_timeline',item.id,'Timeline')}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>
      </section>
    </div>
  )
}
