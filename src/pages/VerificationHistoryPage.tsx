import { useState, useEffect } from 'react'
import { getAuditLogs } from '../services/adminApi'
import type { BackendAuditLog } from '../types'

const STATUSES = ['All','LOGIN_SUCCESS','LOGIN_FAILED','DOCUMENT_UPLOADED','SCREENING_COMPLETED','REVIEW_COMPLETED']
const displayResult = (r: string) => r.replace(/_/g, ' ')
const resultBadgeCls = (r: string) => {
  if (r.includes('SUCCESS') || r.includes('COMPLETED') || r.includes('VERIFIED')) return 'badge-verified'
  if (r.includes('FAILED') || r.includes('REJECTED')) return 'badge-rejected'
  return 'badge-review'
}

export default function VerificationHistoryPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  
  const [logs, setLogs] = useState<BackendAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getAuditLogs(page, 50).then(data => {
      if (mounted && data.success) {
        setLogs(data.logs || [])
        setTotalPages(data.totalPages || 1)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { mounted = false }
  }, [page])

  const filtered = logs.filter(h => {
    const q = search.toLowerCase()
    const actorObj = typeof h.actor === 'object' && h.actor ? h.actor as any : null;
    const uName = actorObj?.name || h.actorEmail || ''
    const matchQ = !q || uName.toLowerCase().includes(q) || h.action.toLowerCase().includes(q)
    const matchS = statusFilter === 'All' || h.action === statusFilter
    return matchQ && matchS
  })

  const statusBadge = (r: string) => (
    <span className={resultBadgeCls(r)} style={{ fontSize:10, padding:'2px 8px', borderRadius:3, fontWeight:600, letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{displayResult(r)}</span>
  )

  const counts = {
    screenings: logs.filter(h=>h.action==='SCREENING_COMPLETED').length,
    reviews: logs.filter(h=>h.action==='REVIEW_COMPLETED').length,
    uploads: logs.filter(h=>h.action==='DOCUMENT_UPLOADED').length,
  }

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#e8e0d0', margin:0 }}>System Audit History</h1>
          <p style={{ fontSize:12, color:'#5a6a40', margin:'4px 0 0' }}>Complete audit trail of all system actions</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[['Screenings',counts.screenings,'#68c87a'],['Reviews',counts.reviews,'#cc9944'],['Uploads',counts.uploads,'#7899cc']].map(([l,v,c]) => (
            <div key={String(l)} style={{ padding:'7px 14px', background:`${c}12`, border:`1px solid ${c}30`, borderRadius:6, fontSize:12, color:String(c), display:'flex', gap:6 }}>
              {l}: <strong>{v}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="card-1" style={{ borderRadius:8, padding:'14px 16px', marginBottom:16 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', minWidth:220 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#3a4a22' }}>
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="8" y1="8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input className="admin-input" placeholder="Search user, action…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:'100%', padding:'7px 12px 7px 28px', fontSize:12 }}/>
          </div>
          <select className="admin-input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ padding:'7px 10px', fontSize:12, cursor:'pointer', minWidth:140 }}>
            {STATUSES.map(s => <option key={s} value={s} style={{ background:'#1d2113' }}>{s}</option>)}
          </select>
          {(search||statusFilter!=='All') && (
            <button className="btn-ghost" style={{ padding:'7px 12px', borderRadius:5, fontSize:11, cursor:'pointer' }} onClick={() => { setSearch(''); setStatusFilter('All'); }}>
              Clear Filters
            </button>
          )}
          <div style={{ marginLeft:'auto', fontSize:12, color:'#4a5a30' }}>{filtered.length} record{filtered.length!==1?'s':''} in current page</div>
        </div>
      </div>

      <div className="card-1" style={{ borderRadius:8, overflow:'hidden' }}>
        <table className="admin-table">
          <thead><tr>
            <th>Log ID</th><th>User</th><th>Action</th><th>Target</th><th>Date &amp; Time</th><th>Details</th><th>IP</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:'center', color:'#3a4a22', padding:32, fontSize:13 }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', color:'#3a4a22', padding:32, fontSize:13 }}>No records match the current filters.</td></tr>
            ) : filtered.map(h => (
              <tr key={h._id}>
                <td style={{ fontFamily:'monospace', fontSize:11, color:'#3a5018' }}>{h._id.substring(0,8)}...</td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,#4f6128,#2a3218)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#e8e0d0', flexShrink:0 }}>
                      {((typeof h.actor === 'object' && (h.actor as any)?.name) || h.actorEmail || '?').substring(0,2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight:500, color:'#d0c8b8' }}>{(typeof h.actor === 'object' && (h.actor as any)?.name) || h.actorEmail || 'System'}</span>
                  </div>
                </td>
                <td>{statusBadge(h.action)}</td>
                <td style={{ color:'#7a8a60' }}>{h.resource} {h.resourceId ? `(${h.resourceId.substring(0,6)}...)` : ''}</td>
                <td style={{ color:'#4a5a30', fontSize:11 }}>{new Date(h.createdAt).toLocaleString()}</td>
                <td style={{ color:'#b8b098', fontSize:11 }}>{h.metadata ? JSON.stringify(h.metadata).substring(0,40) + '...' : '-'}</td>
                <td style={{ color:'#5a6a40', fontSize:11 }}>{h.ipAddress || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(74,90,42,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(29,33,19,0.8)' }}>
          <div style={{ fontSize:11, color:'#5a6a40' }}>
            Page {page} of {totalPages}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-ghost" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ padding:'4px 10px', borderRadius:4, fontSize:11, cursor:page===1?'not-allowed':'pointer' }}>Previous</button>
            <button className="btn-ghost" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ padding:'4px 10px', borderRadius:4, fontSize:11, cursor:page===totalPages?'not-allowed':'pointer' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
