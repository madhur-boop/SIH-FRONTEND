import React, { useState } from 'react'
import type { PageType, BackendUser } from '../types'

interface LayoutProps {
  currentPage: PageType
  navSelection: string
  onNavigate: (p: PageType, nav: string) => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onLogout: () => void
  currentUser: BackendUser | null
  children: React.ReactNode
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'User Management',
  documents: 'Documents',
  verification: 'Document Verification',
  review: 'Document Review',
  history: 'Verification History',
  notifications: 'Notifications',
  settings: 'Settings',
  profile: 'Admin Profile',
}

/* ── Ashoka Chakra icon ─────────────────────────── */
const ChakraIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" stroke="#FF9933" strokeWidth="1.5" opacity="0.55"/>
    <circle cx="24" cy="24" r="8" stroke="#FF9933" strokeWidth="1.5" opacity="0.75"/>
    {Array.from({length:24},(_,i)=>{
      const a=(i/24)*2*Math.PI, x1=24+10*Math.cos(a), y1=24+10*Math.sin(a), x2=24+22*Math.cos(a), y2=24+22*Math.sin(a)
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF9933" strokeWidth="0.7" opacity="0.45"/>
    })}
    <circle cx="24" cy="24" r="3" fill="#FF9933" opacity="0.8"/>
  </svg>
)

/* ── SVG nav icons ──────────────────────────────── */
const Icons: Record<string, React.ReactElement> = {
  dashboard: <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><rect x="1" y="1" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1"/></svg>,
  users:     <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><circle cx="5.5" cy="5" r="2.5"/><path d="M1 13c0-2.76 2.24-5 4.5-5s4.5 2.24 4.5 5"/><circle cx="11.5" cy="5" r="2" opacity=".55"/><path d="M11.5 9c1.66 0 3 1.34 3 3" opacity=".55"/></svg>,
  documents: <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><path d="M3 1.5h6l3 3v9H3V1.5z" opacity=".8"/><path d="M9 1.5v3h3" fill="none" stroke="currentColor" strokeWidth="1"/><line x1="5" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1" fill="none"/><line x1="5" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="1" fill="none"/><line x1="5" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1" fill="none"/></svg>,
  verification: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M7.5 1.5L9.5 6H14L10.5 8.5L12 13L7.5 10L3 13L4.5 8.5L1 6H5.5L7.5 1.5Z"/></svg>,
  history:   <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7.5" cy="7.5" r="5.5"/><polyline points="7.5,4 7.5,7.5 10,9.5"/></svg>,
  bell:      <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5 1A4.5 4.5 0 0 0 3 5.5v3L2 10v.5h11V10L12 8.5v-3A4.5 4.5 0 0 0 7.5 1z"/><path d="M6 11.5a1.5 1.5 0 0 0 3 0"/></svg>,
  settings:  <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" opacity=".8"/><path d="M6.2 1.5H8.8l.5 1.5L11 2.4l1.8 1.8-.6 1.5L13.5 6v2.8l-1.5.5.6 1.5-1.8 1.8-1.5-.6-.5 1.5H6.2l-.5-1.5-1.5.6L2.4 11l.6-1.5L1.5 9V6.2l1.5-.5-.6-1.5 1.8-1.8 1.5.6z" opacity=".45"/></svg>,
  profile:   <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><circle cx="7.5" cy="5" r="3"/><path d="M1 14c0-3.31 2.94-6 6.5-6s6.5 2.69 6.5 6"/></svg>,
  logout:    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M5.5 13H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2.5M10 11l3-3-3-3M13 7.5H6"/></svg>,
}

interface NavRow { navId: string; pageId: PageType; iconKey: string; label: string; group: 'MAIN'|'SYSTEM' }

const navRows: NavRow[] = [
  { navId:'dashboard',     pageId:'dashboard',     iconKey:'dashboard',      label:'Dashboard',            group:'MAIN' },
  { navId:'users',         pageId:'users',          iconKey:'users',          label:'Users',                group:'MAIN' },
  { navId:'documents',     pageId:'documents',      iconKey:'documents',      label:'Documents',            group:'MAIN' },
  { navId:'verification',  pageId:'verification',   iconKey:'verification',   label:'Verification',         group:'MAIN' },
  { navId:'history',       pageId:'history',        iconKey:'history',        label:'Verification History', group:'MAIN' },
  { navId:'notifications', pageId:'notifications',  iconKey:'bell',           label:'Notifications',        group:'SYSTEM' },
  { navId:'settings',      pageId:'settings',       iconKey:'settings',       label:'Settings',             group:'SYSTEM' },
  { navId:'profile',       pageId:'profile',        iconKey:'profile',        label:'Profile',              group:'SYSTEM' },
]

/* ── Notifications panel ────────────────────────── */
const NotificationsPanel = ({ onClose }: { onClose: () => void }) => {
  const items = [
    { type:'alert', msg:'Mismatch detected: Rahul Verma — Aadhaar Card', time:'2 min ago', color:'#c87878' },
    { type:'info',  msg:'New document submitted by Kavita Sharma', time:'14 min ago', color:'#7899cc' },
    { type:'warn',  msg:'Needs Review: Neha Gupta — Visa pending since 8h', time:'1 hr ago', color:'#cc9944' },
    { type:'ok',    msg:'Verified: Aman Singh — Aadhaar Card approved', time:'3 hrs ago', color:'#68c87a' },
    { type:'alert', msg:'Suspicious document flagged: Suresh Kumar — Passport', time:'5 hrs ago', color:'#c87878' },
    { type:'info',  msg:'New user registered: Rohit Agarwal', time:'8 hrs ago', color:'#7899cc' },
  ]
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:49 }}/>
      <div className="animate-fade-in" style={{ position:'fixed', right:16, top:64, width:360, background:'#141810', border:'1px solid rgba(74,90,42,0.35)', borderRadius:10, zIndex:50, boxShadow:'0 12px 48px rgba(0,0,0,0.7)', overflow:'hidden' }}>
        <div style={{ padding:'14px 18px 12px', borderBottom:'1px solid rgba(74,90,42,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0' }}>Notifications</div>
            <div style={{ fontSize:10, color:'#5a6a40', marginTop:2 }}>{items.length} unread alerts</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#5a6a40', padding:4 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>
          </button>
        </div>
        <div style={{ maxHeight:400, overflowY:'auto' }}>
          {items.map((item,i) => (
            <div key={i} style={{ padding:'12px 18px', borderBottom:'1px solid rgba(74,90,42,0.1)', display:'flex', gap:12, alignItems:'flex-start', cursor:'pointer', transition:'background 0.12s' }}
              onMouseOver={e=>(e.currentTarget.style.background='rgba(74,90,42,0.08)')}
              onMouseOut={e=>(e.currentTarget.style.background='transparent')}
            >
              <div style={{ width:7, height:7, borderRadius:'50%', background:item.color, marginTop:5, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:'#d0c8b8', lineHeight:1.4 }}>{item.msg}</div>
                <div style={{ fontSize:10, color:'#4a5a30', marginTop:3 }}>{item.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:'10px 18px', borderTop:'1px solid rgba(74,90,42,0.15)' }}>
          <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#6b7a40' }}>Mark all as read</button>
        </div>
      </div>
    </>
  )
}

/* ── Profile page ───────────────────────────────── */
const getInitials = (name: string) => name ? name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '?'

export const ProfilePage = ({ currentUser }: { currentUser: BackendUser | null }) => {
  const name = currentUser?.name || currentUser?.email || 'Unknown User'
  const initials = getInitials(name)
  
  return (
    <div style={{ padding:'32px', maxWidth:640 }}>
      <h1 style={{ fontSize:20, fontWeight:700, color:'#e8e0d0', margin:'0 0 24px' }}>Admin Profile</h1>
      <div className="card-2" style={{ borderRadius:10, padding:'28px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:28 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#4f6128,#2a3218)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#e8e0d0', border:'2px solid rgba(255,153,51,0.4)' }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:'#e8e0d0' }}>{name}</div>
            <div style={{ fontSize:12, color:'#FF9933', marginTop:3, letterSpacing:'0.06em' }}>{currentUser?.role || 'Unknown'}</div>
            <span className={currentUser?.isActive ? 'badge-verified' : 'badge-rejected'} style={{ fontSize:10, padding:'2px 8px', borderRadius:3, fontWeight:600, marginTop:6, display:'inline-block' }}>
              {currentUser?.isActive ? 'Active Session' : 'Inactive'}
            </span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            ['Admin ID', currentUser?._id ? currentUser._id.substring(0,8).toUpperCase() : 'N/A'],
            ['Email', currentUser?.email || 'N/A'],
            ['Role', currentUser?.role || 'N/A'],
            ['Department', currentUser?.department || 'Document Verification'],
            ['Account Created', currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'],
            ['Status', currentUser?.isActive ? 'Active' : 'Inactive']
          ].map(([l,v]) => (
            <div key={l} style={{ background:'rgba(42,50,24,0.4)', borderRadius:6, padding:'10px 14px', border:'1px solid rgba(74,90,42,0.15)' }}>
              <div style={{ fontSize:10, color:'#4a5a30', fontWeight:600, letterSpacing:'0.06em', marginBottom:4 }}>{l.toUpperCase()}</div>
              <div style={{ fontSize:12, color:'#c8c0b0', fontWeight:500 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card-1" style={{ borderRadius:10, padding:'20px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0', marginBottom:14 }}>Activity Summary</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[['Documents Reviewed','--','#b5c070'],['Approved','--','#68c87a'],['Rejected','--','#c87878']].map(([l,v,c]) => (
            <div key={l} style={{ textAlign:'center', padding:'14px', background:`${c}12`, borderRadius:6, border:`1px solid ${c}25` }}>
              <div style={{ fontSize:22, fontWeight:800, color:String(c) }}>{v}</div>
              <div style={{ fontSize:10, color:'#5a6a40', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Settings page ──────────────────────────────── */
export const SettingsPage = () => {
  const [settings, setSettings] = useState({ autoNotify:true, twoFactor:true, sessionLog:true, aiScan:true, emailAlerts:false, darkMode:true, strictMode:false, apiAccess:true })
  const toggle = (k: keyof typeof settings) => setSettings(s => ({ ...s, [k]: !s[k] }))

  const Toggle = ({ id, label, desc }: { id: keyof typeof settings; label: string; desc: string }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid rgba(74,90,42,0.12)' }}>
      <div>
        <div style={{ fontSize:13, color:'#d0c8b8', fontWeight:500 }}>{label}</div>
        <div style={{ fontSize:11, color:'#4a5a30', marginTop:2 }}>{desc}</div>
      </div>
      <div onClick={() => toggle(id)} style={{ width:40, height:22, borderRadius:11, background:settings[id]?'#4f6128':'rgba(42,50,24,0.6)', border:'1px solid rgba(74,90,42,0.35)', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
        <div style={{ width:16, height:16, borderRadius:'50%', background:'#e8e0d0', position:'absolute', top:2, left:settings[id]?20:2, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.4)' }}/>
      </div>
    </div>
  )

  return (
    <div style={{ padding:'32px', maxWidth:680 }}>
      <h1 style={{ fontSize:20, fontWeight:700, color:'#e8e0d0', margin:'0 0 24px' }}>Settings</h1>
      <div className="card-2" style={{ borderRadius:10, padding:'24px', marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#FF9933', marginBottom:4, letterSpacing:'0.06em' }}>SECURITY</div>
        <div style={{ fontSize:11, color:'#4a5a30', marginBottom:16 }}>Authentication and access control settings</div>
        <Toggle id="twoFactor"  label="Two-Factor Authentication" desc="Require 2FA for admin login"/>
        <Toggle id="sessionLog" label="Session Activity Logging" desc="Log all admin actions for audit trail"/>
        <Toggle id="strictMode" label="Strict Verification Mode" desc="Require manual confirmation for all decisions"/>
        <Toggle id="apiAccess"  label="API Access" desc="Allow external API integrations"/>
      </div>
      <div className="card-2" style={{ borderRadius:10, padding:'24px', marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#FF9933', marginBottom:4, letterSpacing:'0.06em' }}>NOTIFICATIONS</div>
        <div style={{ fontSize:11, color:'#4a5a30', marginBottom:16 }}>Alert and notification preferences</div>
        <Toggle id="autoNotify"  label="Automatic Alerts" desc="Get notified when documents are submitted"/>
        <Toggle id="emailAlerts" label="Email Notifications" desc="Receive verification summaries via email"/>
      </div>
      <div className="card-2" style={{ borderRadius:10, padding:'24px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#FF9933', marginBottom:4, letterSpacing:'0.06em' }}>AI ENGINE</div>
        <div style={{ fontSize:11, color:'#4a5a30', marginBottom:16 }}>AI and OCR processing configuration</div>
        <Toggle id="aiScan"   label="AI Auto-Scan" desc="Automatically run AI analysis on submission"/>
        <Toggle id="darkMode" label="High Contrast Mode" desc="Enhanced visual contrast for review screens"/>
      </div>
    </div>
  )
}

/* ── Main Layout ────────────────────────────────── */
export default function Layout({ currentPage, navSelection, onNavigate, isSidebarOpen, onToggleSidebar, onLogout, currentUser, children }: LayoutProps) {
  const [showNotif, setShowNotif] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div style={{ display:'flex', height:'100%', background:'#0d0f08', fontFamily:'Inter,system-ui,sans-serif' }}>
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside style={{ width:isSidebarOpen?248:64, minWidth:isSidebarOpen?248:64, background:'#080a05', borderRight:'1px solid rgba(74,90,42,0.25)', display:'flex', flexDirection:'column', transition:'width 0.25s ease, min-width 0.25s ease', overflow:'hidden', position:'relative', zIndex:10, boxShadow:'4px 0 24px rgba(0,0,0,0.5)' }}>
        {/* Logo */}
        <div style={{ padding:'18px 14px 14px', borderBottom:'1px solid rgba(74,90,42,0.2)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ flexShrink:0 }}><ChakraIcon size={30}/></div>
            {isSidebarOpen && (
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontSize:15, fontWeight:800, color:'#e8e0d0', letterSpacing:'0.03em', lineHeight:1.1 }}>DOCIscan</div>
                <div style={{ fontSize:9, fontWeight:600, color:'#FF9933', letterSpacing:'0.15em', marginTop:2, textTransform:'uppercase' }}>Admin Portal</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'10px 8px' }}>
          {(['MAIN','SYSTEM'] as const).map(group => (
            <div key={group} style={{ marginBottom:14 }}>
              {isSidebarOpen && (
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.15em', color:'#2a3a14', padding:'0 6px 7px', textTransform:'uppercase' }}>{group}</div>
              )}
              {navRows.filter(r=>r.group===group).map((row,i) => {
                const isActive = navSelection === row.navId
                return (
                  <div key={i} className={`nav-item${isActive?' active':''}`}
                    onClick={() => onNavigate(row.pageId, row.navId)}
                    style={{ justifyContent:isSidebarOpen?'flex-start':'center', padding:isSidebarOpen?'9px 12px':'9px 0', marginBottom:2 }}
                    title={!isSidebarOpen?row.label:undefined}
                  >
                    <span className="nav-accent" style={{ display:isSidebarOpen?'block':'none' }}/>
                    <span style={{ display:'flex', alignItems:'center', color:'inherit', flexShrink:0 }}>
                      {Icons[row.iconKey]}
                    </span>
                    {isSidebarOpen && <span style={{ fontSize:13 }}>{row.label}</span>}
                  </div>
                )
              })}
              {group === 'SYSTEM' && (
                <div className="nav-item" onClick={onLogout}
                  style={{ color:'#7a4040', marginTop:6, justifyContent:isSidebarOpen?'flex-start':'center', padding:isSidebarOpen?'9px 12px':'9px 0' }}
                  title={!isSidebarOpen?'Logout':undefined}
                >
                  <span className="nav-accent" style={{ display:isSidebarOpen?'block':'none', background:'transparent' }}/>
                  <span style={{ display:'flex', alignItems:'center', color:'inherit', flexShrink:0 }}>{Icons.logout}</span>
                  {isSidebarOpen && <span style={{ fontSize:13 }}>Logout</span>}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Security indicator */}
        {isSidebarOpen && (
          <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(74,90,42,0.2)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#4a9a4a', boxShadow:'0 0 6px #4a9a4a' }}/>
              <span style={{ fontSize:9, color:'#4a6a28', letterSpacing:'0.06em', fontWeight:600 }}>SECURE CONNECTION</span>
            </div>
            <div style={{ fontSize:9, color:'#2a3a14', marginTop:3, letterSpacing:'0.04em' }}>SSL/TLS ENCRYPTED · ADMIN ONLY</div>
          </div>
        )}
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        {/* Header */}
        <header style={{ height:54, background:'rgba(8,10,5,0.97)', borderBottom:'1px solid rgba(74,90,42,0.25)', display:'flex', alignItems:'center', gap:14, padding:'0 18px', flexShrink:0, zIndex:9 }}>
          <button onClick={onToggleSidebar} style={{ background:'none', border:'none', cursor:'pointer', color:'#7a8a58', padding:4, display:'flex', alignItems:'center' }}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="currentColor"><rect y="2.5" width="17" height="1.5" rx="0.75"/><rect y="7.75" width="17" height="1.5" rx="0.75"/><rect y="13" width="17" height="1.5" rx="0.75"/></svg>
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ fontSize:10, color:'#2a3a14', letterSpacing:'0.06em' }}>ADMIN</span>
            <span style={{ color:'#2a3a14', fontSize:10 }}>›</span>
            <span style={{ fontSize:14, fontWeight:600, color:'#e8e0d0', letterSpacing:'0.02em' }}>{PAGE_TITLES[navSelection] || PAGE_TITLES[currentPage]}</span>
          </div>

          <div style={{ flex:1, maxWidth:380, position:'relative' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#3a4a22' }}>
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="8.5" y1="8.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input className="admin-input" placeholder="Search users, documents…" style={{ width:'100%', padding:'6px 12px 6px 30px', fontSize:12 }}/>
          </div>

          <div style={{ flex:1 }}/>

          {/* Notifications button */}
          <div style={{ position:'relative' }}>
            <button onClick={()=>setShowNotif(p=>!p)} style={{ position:'relative', background:'rgba(74,90,42,0.12)', border:'1px solid rgba(74,90,42,0.25)', borderRadius:6, padding:'5px 8px', cursor:'pointer', color:'#8b9a5a', display:'flex', alignItems:'center' }}>
              {Icons.bell}
              <span style={{ position:'absolute', top:-4, right:-4, background:'#FF9933', color:'#1a0800', fontSize:9, fontWeight:700, borderRadius:'50%', width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center' }}>6</span>
            </button>
            {showNotif && <NotificationsPanel onClose={()=>setShowNotif(false)}/>}
          </div>

          {/* Admin profile */}
          <div style={{ position:'relative' }}>
            <div onClick={()=>setProfileOpen(p=>!p)} style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', padding:'5px 10px', borderRadius:6, background:'rgba(74,90,42,0.1)', border:'1px solid rgba(74,90,42,0.2)' }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#4f6128,#2a3218)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#e8e0d0', border:'1px solid rgba(255,153,51,0.3)' }}>
                {currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '?'}
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#e8e0d0', lineHeight:1.2 }}>{currentUser?.name || currentUser?.email || 'Unknown User'}</div>
                <div style={{ fontSize:9, color:'#FF9933', letterSpacing:'0.04em' }}>{currentUser?.role || 'Unknown'}</div>
              </div>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="#5a6a40"><polyline points="1.5,3.5 4.5,6.5 7.5,3.5"/></svg>
            </div>
            {profileOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'#141810', border:'1px solid rgba(74,90,42,0.3)', borderRadius:8, padding:8, minWidth:150, zIndex:100, boxShadow:'0 8px 32px rgba(0,0,0,0.6)' }}>
                {[['Profile','profile','profile'],['Settings','settings','settings']].map(([label,page,nav]) => (
                  <div key={page} onClick={()=>{ onNavigate(page as PageType, nav); setProfileOpen(false) }}
                    style={{ padding:'8px 12px', fontSize:12, color:'#b8b098', borderRadius:4, cursor:'pointer' }}
                    onMouseOver={e=>(e.currentTarget.style.background='rgba(74,90,42,0.15)')}
                    onMouseOut={e=>(e.currentTarget.style.background='transparent')}
                  >{label}</div>
                ))}
                <div style={{ height:1, background:'rgba(74,90,42,0.2)', margin:'4px 0' }}/>
                <div onClick={onLogout} style={{ padding:'8px 12px', fontSize:12, color:'#c87878', borderRadius:4, cursor:'pointer' }}
                  onMouseOver={e=>(e.currentTarget.style.background='rgba(138,56,56,0.12)')}
                  onMouseOut={e=>(e.currentTarget.style.background='transparent')}
                >Sign Out</div>
              </div>
            )}
          </div>

          {/* Auth badge */}
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 8px', background:'rgba(42,60,18,0.3)', borderRadius:4, border:'1px solid rgba(58,138,72,0.2)' }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="#4a9a4a"><path d="M4.5 1L2 2.8v2c0 1.7 1.3 3 2.5 3.2 1.2-.2 2.5-1.5 2.5-3.2V2.8L4.5 1z"/></svg>
            <span style={{ fontSize:9, color:'#4a9a4a', letterSpacing:'0.06em', fontWeight:600 }}>ADMIN</span>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
