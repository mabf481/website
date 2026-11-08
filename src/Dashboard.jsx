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
  const [data, setData] = useState({ settings: null, profile: null, pengawas: [], pengurus: [], divisi: [], units: [], timeline: [], stats: [], activities: [], products: [], gallery: [] })
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
      pengurus,
      divisi,
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
      supabase.from('koperasi_pengawas_periode').select('*').order('periode').order('urutan'),
      supabase.from('koperasi_pengurus_periode').select('*').order('periode').order('urutan'),
      supabase.from('koperasi_divisi_periode').select('*').order('periode').order('urutan'),
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
      pengurus: pengurus.data || [],
      divisi: divisi.data || [],
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
        {tab === 'profile' && <ProfileManager profile={data.profile} pengawas={data.pengawas} pengurus={data.pengurus} divisi={data.divisi} onSaved={load} setMessage={setMessage} />}
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


function ProfileManager({ profile, pengawas, pengurus, divisi, onSaved, setMessage }) {
  const [form, setForm] = useState(profile || {})
  const [uploadingPhoto, setUploadingPhoto] = useState(null)
  useEffect(() => setForm(profile || {}), [profile])

  async function uploadMainPhoto(e) {
    const file=e.target.files?.[0]; if(!file) return
    if(!file.type.startsWith('image/')){setMessage('File harus berupa gambar.');e.target.value='';return}
    if(file.size>5*1024*1024){setMessage('Ukuran foto maksimal 5 MB.');e.target.value='';return}
    setUploadingPhoto('main'); setMessage('Mengunggah foto...')
    const extension=file.name.split('.').pop()?.toLowerCase()||'jpg'
    const path=\`profil-koperasi/${Date.now()}-${crypto.randomUUID()}.${extension}\`
    const {error}=await supabase.storage.from('koperasi-images').upload(path,file,{cacheControl:'3600',upsert:false})
    if(error){setMessage(error.message);setUploadingPhoto(null);e.target.value='';return}
    const {data}=supabase.storage.from('koperasi-images').getPublicUrl(path)
    setForm(current=>({...current,foto_profil_url:data.publicUrl}))
    setMessage('Foto berhasil diunggah. Klik Simpan Profil Koperasi untuk menyimpan.')
    setUploadingPhoto(null); e.target.value=''
  }

  async function saveProfile(e){
    e.preventDefault()
    const payload={...form,misi:Array.isArray(form.misi)?form.misi.map(x=>String(x).trim()).filter(Boolean):String(form.misi||'').split('\\n').map(x=>x.trim()).filter(Boolean),updated_at:new Date().toISOString()}
    const {error}=await supabase.from('koperasi_profil').upsert(payload)
    setMessage(error?'error:'+error.message:'Profil koperasi berhasil disimpan.')
    if(!error) onSaved()
  }

  const missionText=Array.isArray(form.misi)?form.misi.filter(Boolean).join('\\n'):(form.misi||'')
  return (
    <div className="manager">
      <form className="admin-form" onSubmit={saveProfile}>
        <div className="form-grid">
          <label>Legalitas<input value={form.legalitas||''} onChange={e=>setForm({...form,legalitas:e.target.value})}/></label>
          <label>Foto utama
            <input type="file" accept="image/*" onChange={uploadMainPhoto} disabled={uploadingPhoto}/>
            <small>{uploadingPhoto?'Sedang mengunggah...':'Pilih foto dari komputer (maks. 5 MB).'}</small>
            {form.foto_profil_url&&<div style={{marginTop:10}}><img src={form.foto_profil_url} alt="Preview foto profil koperasi" style={{width:'100%',maxHeight:220,objectFit:'cover',borderRadius:12}}/></div>}
          </label>
          <label className="wide">Sejarah<textarea rows="6" value={form.sejarah||''} onChange={e=>setForm({...form,sejarah:e.target.value})}/></label>
          <label className="wide">Visi<textarea rows="4" value={form.visi||''} onChange={e=>setForm({...form,visi:e.target.value})}/></label>
          <label className="wide">Misi — satu misi per baris<textarea rows="8" value={missionText} onChange={e=>setForm({...form,misi:e.target.value.split('\\n')})}/></label>
        </div>
        <button className="dashboard-primary" type="submit"><Save size={17}/> Simpan Profil Koperasi</button>
      </form>

      <PeriodSection title="Pengawas Periode" description="Kelola Ketua Pengawas dan 2 Anggota Pengawas berdasarkan periode." table="koperasi_pengawas_periode" items={pengawas}
        roles={[{key:'Ketua Pengawas',label:'Ketua Pengawas',urutan:1},{key:'Anggota 1',label:'Anggota Pengawas',urutan:2},{key:'Anggota 2',label:'Anggota Pengawas',urutan:3}]}
        saveLabel="Simpan Pengawas" onSaved={onSaved} setMessage={setMessage} uploadingPhoto={uploadingPhoto} setUploadingPhoto={setUploadingPhoto}/>

      <PeriodSection title="Pengurus Periode" description="Kelola Ketua, Sekertaris, dan Bendahara berdasarkan periode." table="koperasi_pengurus_periode" items={pengurus}
        roles={[{key:'Ketua',label:'Ketua',urutan:1},{key:'Sekretaris',label:'Sekertaris',urutan:2},{key:'Bendahara',label:'Bendahara',urutan:3}]}
        saveLabel="Simpan Pengurus" onSaved={onSaved} setMessage={setMessage} uploadingPhoto={uploadingPhoto} setUploadingPhoto={setUploadingPhoto}/>

      <PeriodSection title="Divisi" description="Kelola penanggung jawab divisi berdasarkan periode." table="koperasi_divisi_periode" items={divisi}
        roles={[{key:'Keanggotaan',label:'Keanggotaan',urutan:1},{key:'Bisnis',label:'Bisnis',urutan:2},{key:'Pendidikan dan Pelatihan',label:'Pendidikan dan Pelatihan',urutan:3}]}
        saveLabel="Simpan Divisi" onSaved={onSaved} setMessage={setMessage} uploadingPhoto={uploadingPhoto} setUploadingPhoto={setUploadingPhoto}/>
    </div>
  )
}

async function uploadPeriodPhoto(e, section, role, setMessage, setUploadingPhoto) {
  const file=e.target.files?.[0]; if(!file) return
  if(!file.type.startsWith('image/')){setMessage('File harus berupa gambar.');e.target.value='';return}
  if(file.size>5*1024*1024){setMessage('Ukuran foto maksimal 5 MB.');e.target.value='';return}
  const key=\`${section}-${role}\`; setUploadingPhoto(key); setMessage('Mengunggah foto...')
  const extension=file.name.split('.').pop()?.toLowerCase()||'jpg'
  const path=\`profil-koperasi/${section}/${Date.now()}-${crypto.randomUUID()}.${extension}\`
  const {error}=await supabase.storage.from('koperasi-images').upload(path,file,{cacheControl:'3600',upsert:false})
  if(error){setMessage(error.message);setUploadingPhoto(null);e.target.value='';return}
  const {data}=supabase.storage.from('koperasi-images').getPublicUrl(path)
  e.target.dataset.uploadedUrl=data.publicUrl
  e.target.dispatchEvent(new CustomEvent('period-photo-uploaded',{detail:{role,url:data.publicUrl}}))
  setMessage('Foto berhasil diunggah.')
  setUploadingPhoto(null); e.target.value=''
}

function PeriodSection({title,description,table,items,roles,saveLabel,onSaved,setMessage,uploadingPhoto,setUploadingPhoto}) {
  const [editing,setEditing]=useState(null)
  const section=table.includes('pengawas')?'pengawas':table.includes('pengurus')?'pengurus':'divisi'

  const groups=useMemo(()=>{
    const map=new Map()
    items.filter(item=>item.periode?.trim()).forEach(item=>{
      const key=item.periode.trim()
      if(!map.has(key)){const g={periode:key};roles.forEach(role=>{g[role.key]=null});map.set(key,g)}
      const g=map.get(key)
      let roleKey=item.divisi||item.jabatan
      if(section==='pengawas' && roleKey==='Ketua') roleKey='Ketua Pengawas'
      if(roles.some(role=>role.key===roleKey)) g[roleKey]=item
    })
    return Array.from(map.values())
  },[items,roles,section])

  function newPeriod(){
    const next={isNew:true,periode:''}
    roles.forEach(role=>{next[role.key]={nama:'',foto_url:'',urutan:role.urutan}})
    setEditing(next)
  }
  function editPeriod(group){
    const next={isNew:false,periode:group.periode}
    roles.forEach(role=>{next[role.key]=group[role.key]?{...group[role.key]}:{nama:'',foto_url:'',urutan:role.urutan}})
    setEditing(next)
  }
  function updateRole(role,key,value){setEditing(current=>({...current,[role]:{...current[role],[key]:value}}))}

  useEffect(()=>{
    const handler=e=>updateRole(e.detail.role,'foto_url',e.detail.url)
    window.addEventListener('period-photo-uploaded',handler)
    return()=>window.removeEventListener('period-photo-uploaded',handler)
  })

  async function save(e){
    e.preventDefault()
    if(!editing?.periode.trim()){setMessage('Periode wajib diisi.');return}
    const rows=roles.map(role=>{
      const item=editing[role.key]||{}
      const row={...(item.id?{id:item.id}:{}),periode:editing.periode.trim(),nama:item.nama||'',foto_url:item.foto_url||'',urutan:role.urutan,aktif:true,updated_at:new Date().toISOString()}
      if(section==='divisi') row.divisi=role.key
      else if(section==='pengawas') row.jabatan=role.key==='Ketua Pengawas'?'Ketua':role.key
      else row.jabatan=role.key
      return row
    })
    const {error}=await supabase.from(table).upsert(rows)
    setMessage(error?error.message:\`${title} periode ${editing.periode} berhasil disimpan.\`)
    if(!error){setEditing(null);onSaved()}
  }

  const headers=['Periode',...roles.flatMap(role=>[role.label,'Foto']),'Aksi']
  return (
    <div className="profile-block" style={{marginTop:28}}>
      <div className="section-heading" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16}}>
        <div><h2><Users size={22}/> {title}</h2><p style={{margin:'6px 0 0',color:'#66736b'}}>{description}</p></div>
        <button className="dashboard-primary small" type="button" onClick={newPeriod}><Plus size={16}/> Tambah</button>
      </div>

      {editing&&<form className="editor-card" onSubmit={save} style={{marginTop:18}}>
        <h2>{editing.isNew?'Tambah':'Edit'} {title}</h2>
        <label>Periode<input value={editing.periode} placeholder="Contoh: 2025–2028" onChange={e=>setEditing({...editing,periode:e.target.value})} required/></label>
        <div className="form-grid" style={{marginTop:16}}>
          {roles.map(role=><div key={role.key} className="pengawas-editor-person">
            <label>{role.label}<input value={editing[role.key]?.nama||''} placeholder={\`Nama ${role.label}\`} onChange={e=>updateRole(role.key,'nama',e.target.value)}/></label>
            <label>Foto<input type="file" accept="image/*" onChange={e=>uploadPeriodPhoto(e,section,role.key,setMessage,setUploadingPhoto)} disabled={uploadingPhoto===\`${section}-${role.key}\`}/><small>{uploadingPhoto===\`${section}-${role.key}\`?'Sedang mengunggah...':'Maks. 5 MB.'}</small></label>
            {editing[role.key]?.foto_url&&<img src={editing[role.key].foto_url} alt={\`Foto ${role.label}\`} style={{width:72,height:72,objectFit:'cover',borderRadius:12,marginTop:6}}/>}
          </div>)}
        </div>
        <div className="editor-actions"><button className="dashboard-primary" type="submit"><Save size={17}/> {saveLabel}</button><button type="button" className="dashboard-secondary" onClick={()=>setEditing(null)}>Batal</button></div>
      </form>}

      <div className="admin-table-wrap" style={{marginTop:18}}>
        <table className="admin-table"><thead><tr>{headers.map(header=><th key={header}>{header}</th>)}</tr></thead>
          <tbody>{groups.map(group=><tr key={group.periode}>
            <td><strong>{group.periode}</strong></td>
            {roles.map(role=><FragmentCell key={role.key} item={group[role.key]}/>)}
            <td><div className="table-actions"><button type="button" onClick={()=>editPeriod(group)}>Edit</button></div></td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}

function FragmentCell({item}) {
  return <><td>{item?.nama||'—'}</td><td>{item?.foto_url?<img src={item.foto_url} alt="Foto" style={{width:52,height:52,objectFit:'cover',borderRadius:10}}/>:'—'}</td></>
}
