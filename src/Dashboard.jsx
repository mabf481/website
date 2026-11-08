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
  const [data, setData] = useState({ settings: null, profile: null, pengawas: [], units: [], timeline: [], stats: [], activities: [], products: [], gallery: [] })
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
    const [
      { data: me },
      settings,
      profile,
      pengawas,
      units,
      timeline,
      stats,
      activities,
      products,
      gallery,
    ] = await Promise.all([
      supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('koperasi_profil').select('*').limit(1).maybeSingle(),
      supabase.from('koperasi_pengawas_periode').select('*').order('urutan'),
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
      pengawas: pengawas.data || [],
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
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    window.location.reload()
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
        {tab === 'profile' && <ProfileManager profile={data.profile} pengawas={data.pengawas} onSaved={load} setMessage={setMessage} />}
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


function ProfileManager({ profile, pengawas, onSaved, setMessage }) {
  const [form, setForm] = useState(profile || {})
  const [pengawasList, setPengawasList] = useState(pengawas || [])
  const [uploadingPhoto, setUploadingPhoto] = useState(null)
  const [editingPeriod, setEditingPeriod] = useState(null)

  useEffect(() => setForm(profile || {}), [profile])
  useEffect(() => setPengawasList(pengawas || []), [pengawas])

  async function uploadMainPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('File harus berupa gambar.')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Ukuran foto maksimal 5 MB.')
      e.target.value = ''
      return
    }

    setUploadingPhoto('main')
    setMessage('Mengunggah foto...')
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `profil-koperasi/${Date.now()}-${crypto.randomUUID()}.${extension}`

    const { error } = await supabase.storage
      .from('koperasi-images')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (error) {
      setMessage(error.message)
      setUploadingPhoto(null)
      e.target.value = ''
      return
    }

    const { data } = supabase.storage.from('koperasi-images').getPublicUrl(path)
    setForm(current => ({ ...current, foto_profil_url: data.publicUrl }))
    setMessage('Foto berhasil diunggah. Klik Simpan Profil Koperasi untuk menyimpan.')
    setUploadingPhoto(null)
    e.target.value = ''
  }

  async function uploadPersonPhoto(e, role) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('File harus berupa gambar.')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Ukuran foto maksimal 5 MB.')
      e.target.value = ''
      return
    }

    setUploadingPhoto(role)
    setMessage('Mengunggah foto...')
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `profil-koperasi/pengawas/${Date.now()}-${crypto.randomUUID()}.${extension}`

    const { error } = await supabase.storage
      .from('koperasi-images')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (error) {
      setMessage(error.message)
      setUploadingPhoto(null)
      e.target.value = ''
      return
    }

    const { data } = supabase.storage.from('koperasi-images').getPublicUrl(path)
    setEditingPeriod(current => current ? {
      ...current,
      [role]: { ...current[role], foto_url: data.publicUrl },
    } : current)
    setMessage('Foto berhasil diunggah. Klik Simpan Pengawas untuk menyimpan.')
    setUploadingPhoto(null)
    e.target.value = ''
  }

  async function saveProfile(e) {
    e.preventDefault()
    const payload = {
      ...form,
      misi: Array.isArray(form.misi)
        ? form.misi.map(x => String(x).trim()).filter(Boolean)
        : String(form.misi || '').split('\n').map(x => x.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('koperasi_profil').upsert(payload)
    setMessage(error ? error.message : 'Profil koperasi berhasil disimpan.')
    if (!error) onSaved()
  }

  const roleOrder = ['Ketua', 'Sekretaris', 'Bendahara']

  const periodGroups = useMemo(() => {
    const groups = new Map()
    pengawasList.forEach(item => {
      const key = item.periode || 'Belum diisi'
      if (!groups.has(key)) groups.set(key, { periode: item.periode || '', Ketua: null, Sekretaris: null, Bendahara: null })
      const group = groups.get(key)
      if (roleOrder.includes(item.jabatan)) group[item.jabatan] = item
    })
    return Array.from(groups.values())
  }, [pengawasList])

  function openAddPeriod() {
    setEditingPeriod({
      isNew: true,
      periode: '',
      Ketua: { jabatan: 'Ketua', nama: '', foto_url: '', urutan: 1 },
      Sekretaris: { jabatan: 'Sekretaris', nama: '', foto_url: '', urutan: 2 },
      Bendahara: { jabatan: 'Bendahara', nama: '', foto_url: '', urutan: 3 },
    })
  }

  function openEditPeriod(group) {
    setEditingPeriod({
      isNew: false,
      periode: group.periode || '',
      Ketua: group.Ketua ? { ...group.Ketua } : { jabatan: 'Ketua', nama: '', foto_url: '', urutan: 1 },
      Sekretaris: group.Sekretaris ? { ...group.Sekretaris } : { jabatan: 'Sekretaris', nama: '', foto_url: '', urutan: 2 },
      Bendahara: group.Bendahara ? { ...group.Bendahara } : { jabatan: 'Bendahara', nama: '', foto_url: '', urutan: 3 },
    })
  }

  function updateEditingRole(role, key, value) {
    setEditingPeriod(current => ({
      ...current,
      [role]: { ...current[role], [key]: value },
    }))
  }

  async function savePengawasPeriod(e) {
    e.preventDefault()
    if (!editingPeriod?.periode.trim()) {
      setMessage('Periode wajib diisi.')
      return
    }

    const now = new Date().toISOString()
    const rows = roleOrder.map((role, index) => ({
      ...(editingPeriod[role].id ? { id: editingPeriod[role].id } : {}),
      periode: editingPeriod.periode.trim(),
      jabatan: role,
      nama: editingPeriod[role].nama || '',
      foto_url: editingPeriod[role].foto_url || '',
      urutan: index + 1,
      aktif: true,
      updated_at: now,
    }))

    const { error } = await supabase.from('koperasi_pengawas_periode').upsert(rows)
    setMessage(error ? error.message : `Pengawas periode ${editingPeriod.periode} berhasil disimpan.`)
    if (!error) {
      setEditingPeriod(null)
      onSaved()
    }
  }

  const missionText = Array.isArray(form.misi) ? form.misi.filter(Boolean).join('\n') : (form.misi || '')

  return (
    <div className="manager">
      <form className="admin-form" onSubmit={saveProfile}>
        <div className="form-grid">
          <label>Legalitas<input value={form.legalitas || ''} onChange={e => setForm({ ...form, legalitas: e.target.value })} /></label>
          <label>
            Foto utama
            <input type="file" accept="image/*" onChange={uploadMainPhoto} disabled={uploadingPhoto} />
            <small>{uploadingPhoto ? 'Sedang mengunggah...' : 'Pilih foto dari komputer (maks. 5 MB).'}</small>
            {form.foto_profil_url && (
              <div style={{ marginTop: 10 }}>
                <img src={form.foto_profil_url} alt="Preview foto profil koperasi" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12 }} />
              </div>
            )}
          </label>
          <label className="wide">Sejarah<textarea rows="6" value={form.sejarah || ''} onChange={e => setForm({ ...form, sejarah: e.target.value })} /></label>
          <label className="wide">Visi<textarea rows="4" value={form.visi || ''} onChange={e => setForm({ ...form, visi: e.target.value })} /></label>
          <label className="wide">Misi — satu misi per baris<textarea rows="8" value={missionText} onChange={e => setForm({ ...form, misi: e.target.value.split('\n') })} /></label>
        </div>
        <button className="dashboard-primary" type="submit"><Save size={17} /> Simpan Profil Koperasi</button>
      </form>

      <div className="profile-block" style={{ marginTop: 28 }}>
        <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <h2><Users size={22} /> Pengawas Periode</h2>
            <p style={{ margin: '6px 0 0', color: '#66736b' }}>Kelola Ketua, Sekretaris, dan Bendahara berdasarkan periode kepengurusan.</p>
          </div>
          <button className="dashboard-primary small" type="button" onClick={openAddPeriod}><Plus size={16} /> Tambah</button>
        </div>

        {editingPeriod && (
          <form className="editor-card" onSubmit={savePengawasPeriod} style={{ marginTop: 18 }}>
            <h2>{editingPeriod.isNew ? 'Tambah' : 'Edit'} Pengawas Periode</h2>
            <label>
              Periode
              <input
                value={editingPeriod.periode}
                placeholder="Contoh: 2026–2029"
                onChange={e => setEditingPeriod({ ...editingPeriod, periode: e.target.value })}
                required
              />
            </label>

            <div className="form-grid" style={{ marginTop: 16 }}>
              {roleOrder.map(role => (
                <div key={role} className="pengawas-editor-person">
                  <label>
                    {role}
                    <input
                      value={editingPeriod[role].nama || ''}
                      placeholder={`Nama ${role}`}
                      onChange={e => updateEditingRole(role, 'nama', e.target.value)}
                    />
                  </label>
                  <label>
                    Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => uploadPersonPhoto(e, role)}
                      disabled={uploadingPhoto === role}
                    />
                    <small>{uploadingPhoto === role ? 'Sedang mengunggah...' : 'Maks. 5 MB.'}</small>
                  </label>
                  {editingPeriod[role].foto_url && (
                    <img
                      src={editingPeriod[role].foto_url}
                      alt={`Foto ${role}`}
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, marginTop: 6 }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="editor-actions">
              <button className="dashboard-primary" type="submit"><Save size={17} /> Simpan Pengawas</button>
              <button type="button" className="dashboard-secondary" onClick={() => setEditingPeriod(null)}>Batal</button>
            </div>
          </form>
        )}

        <div className="admin-table-wrap" style={{ marginTop: 18 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Periode</th>
                <th>Ketua</th>
                <th>Foto</th>
                <th>Sekretaris</th>
                <th>Foto</th>
                <th>Bendahara</th>
                <th>Foto</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {periodGroups.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 24 }}>Belum ada data pengawas periode.</td>
                </tr>
              ) : periodGroups.map((group, index) => (
                <tr key={group.periode || `empty-${index}`}>
                  <td><strong>{group.periode || 'Belum diisi'}</strong></td>
                  <td>{group.Ketua?.nama || '—'}</td>
                  <td>{group.Ketua?.foto_url ? <img src={group.Ketua.foto_url} alt="Foto Ketua" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10 }} /> : '—'}</td>
                  <td>{group.Sekretaris?.nama || '—'}</td>
                  <td>{group.Sekretaris?.foto_url ? <img src={group.Sekretaris.foto_url} alt="Foto Sekretaris" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10 }} /> : '—'}</td>
                  <td>{group.Bendahara?.nama || '—'}</td>
                  <td>{group.Bendahara?.foto_url ? <img src={group.Bendahara.foto_url} alt="Foto Bendahara" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10 }} /> : '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => openEditPeriod(group)}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

