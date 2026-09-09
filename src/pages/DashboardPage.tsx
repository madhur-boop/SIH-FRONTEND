import React, { useState, useEffect, useRef, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { PageType, BackendStats } from '../types'
import { getDashboardStats } from '../services/adminApi'

interface Props { onNavigate: (p: PageType, nav?: string, filterState?: any) => void }

const KpiCard = ({
  label,
  value,
  trend,
  icon,
  color,
  badge,
  onClick,
}: {
  label: string
  value: string | number
  trend: string
  icon: React.ReactElement
  color: string
  badge?: string
  onClick?: () => void
}) => (
  <div
    className="card-kpi"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick?.()
      }
    }}
    style={{
      borderRadius: 8,
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
      border: '1px solid rgba(74,90,42,0.25)',
      userSelect: 'none',
      outline: 'none',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = `0 8px 24px ${color}1c`
      e.currentTarget.style.borderColor = `${color}70`
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'none'
      e.currentTarget.style.boxShadow = 'none'
      e.currentTarget.style.borderColor = 'rgba(74,90,42,0.25)'
    }}
    onFocus={(e) => {
      e.currentTarget.style.boxShadow = `0 0 0 2px ${color}80`
    }}
    onBlur={(e) => {
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <div style={{ position:'absolute', top:-16, right:-16, width:72, height:72, background:`radial-gradient(${color}20,transparent 70%)`, pointerEvents:'none' }}/>
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
      <div style={{ width:34, height:34, borderRadius:7, background:`${color}20`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', color, boxShadow:`0 2px 8px ${color}18` }}>
        {icon}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        {badge && <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:3, background:`${color}20`, color, border:`1px solid ${color}40`, letterSpacing:'0.06em' }}>{badge}</span>}
        <span style={{ fontSize:10, color:'#5a6a40', opacity:0.8 }}>↗</span>
      </div>
    </div>
    <div style={{ fontSize:26, fontWeight:800, color:'#e8e0d0', letterSpacing:'-0.02em', lineHeight:1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
    <div style={{ fontSize:11, color:'#5a6a48', marginTop:4, letterSpacing:'0.02em' }}>{label}</div>
    <div style={{ fontSize:10, color, marginTop:8, display:'flex', alignItems:'center', gap:4 }}>
      <svg width="9" height="9" viewBox="0 0 9 9" fill={color}><polygon points="4.5,1 8.5,8 0.5,8"/></svg>
      {trend} · Click to view
    </div>
  </div>
)

const KpiCardSkeleton = () => (
  <div
    className="card-kpi"
    style={{
      borderRadius: 8,
      padding: '16px 18px',
      border: '1px solid rgba(74,90,42,0.18)',
      background: 'rgba(26,30,18,0.4)',
      minHeight: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <div style={{ width:34, height:34, borderRadius:7, background:'rgba(74,90,42,0.18)', animation:'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ width:42, height:14, borderRadius:3, background:'rgba(74,90,42,0.12)', animation:'pulse 1.5s ease-in-out infinite' }} />
    </div>
    <div>
      <div style={{ width:50, height:24, borderRadius:4, background:'rgba(74,90,42,0.22)', marginBottom:6, animation:'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ width:120, height:12, borderRadius:3, background:'rgba(74,90,42,0.14)', animation:'pulse 1.5s ease-in-out infinite' }} />
    </div>
    <div style={{ width:90, height:10, borderRadius:3, background:'rgba(74,90,42,0.1)', marginTop:6, animation:'pulse 1.5s ease-in-out infinite' }} />
  </div>
)

const displayStatus = (s: string) => s === 'Rejected' ? 'Suspicious' : s

const badgeCls = (s: string) => {
  const n = displayStatus(s)
  if (n === 'Verified' || n === 'VALIDATED') return 'badge-verified'
  if (n === 'Suspicious' || n === 'REJECTED') return 'badge-rejected'
  if (n === 'Pending' || n === 'PENDING') return 'badge-pending'
  return 'badge-review'
}

const PIE_COLORS = ['#68c87a','#7899cc','#c87878','#cc9944']

export default function DashboardPage({ onNavigate }: Props) {
  const [stats, setStats] = useState<BackendStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const mountedRef = useRef(true)

  const loadStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const data = await getDashboardStats()
      if (!mountedRef.current) return
      if (data && data.success) {
        setStats(data)
        setError(null)
      } else {
        throw new Error(data?.message || 'Failed to retrieve dashboard statistics from backend.')
      }
    } catch (err: any) {
      if (!mountedRef.current) return
      const errMsg = err?.message || err?.data?.message || 'Failed to load dashboard data. Please check backend connection.'
      setError(errMsg)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadStats()
    return () => {
      mountedRef.current = false
    }
  }, [loadStats])

  // Loading Skeleton State
  if (loading && !stats) {
    return (
      <div style={{ padding:'22px', display:'flex', flexDirection:'column', gap:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontSize:19, fontWeight:700, color:'#e8e0d0', margin:0, letterSpacing:'0.02em' }}>Command Center</h1>
            <p style={{ fontSize:11, color:'#5a6a40', margin:'4px 0 0' }}>Initializing dashboard metrics…</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#7a8a58' }}>
            <div style={{ width:14, height:14, border:'2px solid rgba(122,138,88,0.2)', borderTopColor:'#b5c070', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            <span>Loading live metrics…</span>
          </div>
        </div>

        {/* 4 Top KPI Skeletons */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>

        {/* 3 Bottom KPI Skeletons */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>

        {/* Chart Skeletons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
          <div className="card-2" style={{ borderRadius:8, padding:'18px', minHeight:260, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', color:'#5a6a40', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(74,90,42,0.15)', animation:'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width:140, height:12, borderRadius:4, background:'rgba(74,90,42,0.15)', animation:'pulse 1.5s ease-in-out infinite' }} />
          </div>
          <div className="card-2" style={{ borderRadius:8, padding:'18px', minHeight:260, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', color:'#5a6a40', gap:10 }}>
            <div style={{ width:100, height:100, borderRadius:'50%', background:'rgba(74,90,42,0.15)', animation:'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width:100, height:12, borderRadius:4, background:'rgba(74,90,42,0.15)', animation:'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    )
  }

  // Error State with Actionable Retry
  if (error && !stats) {
    return (
      <div style={{ padding:'40px 24px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', textAlign:'center' }}>
        <div style={{ width:48, height:48, borderRadius:12, background:'rgba(200,120,120,0.15)', border:'1px solid rgba(200,120,120,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#c87878', marginBottom:16 }}>
          ⚠️
        </div>
        <h2 style={{ fontSize:18, fontWeight:700, color:'#e8e0d0', margin:0 }}>Unable to Load Dashboard Data</h2>
        <p style={{ fontSize:12, color:'#8a9a68', maxWidth:420, margin:'8px 0 20px', lineHeight:1.5 }}>
          {error}
        </p>
        <button
          className="btn-primary"
          onClick={() => loadStats(false)}
          style={{ padding:'10px 22px', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
          </svg>
          Retry Loading Dashboard
        </button>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const pieData = [
    { name:'Validated', value: stats.stats?.documents?.approved || 0 },
    { name:'Pending', value: stats.stats?.documents?.pendingReview || 0 },
    { name:'Rejected', value: stats.stats?.documents?.rejected || 0 },
    { name:'Suspicious', value: stats.stats?.documents?.suspicious || 0 },
  ]
  const totalDocs = stats.stats?.documents?.total || 1

  return (
    <div style={{ padding:'22px', display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:19, fontWeight:700, color:'#e8e0d0', margin:0, letterSpacing:'0.02em' }}>Command Center</h1>
          <p style={{ fontSize:11, color:'#5a6a40', margin:'4px 0 0' }}>Live Overview</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {isRefreshing && (
            <span style={{ fontSize:11, color:'#7a8a58', display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:10, height:10, border:'2px solid rgba(122,138,88,0.2)', borderTopColor:'#b5c070', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              Syncing…
            </span>
          )}
          <button
            className="btn-ghost"
            style={{ padding:'7px 12px', borderRadius:6, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
            onClick={() => loadStats(true)}
            title="Refresh dashboard statistics"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
            Refresh
          </button>
          <button
            className="btn-primary"
            style={{ padding:'7px 13px', borderRadius:6, fontSize:12, cursor:'pointer' }}
            onClick={() => onNavigate('documents', 'verification', { statusFilter: 'PENDING', sourceMetric: 'Review Queue' })}
          >
            Review Queue ({stats.stats?.documents?.pendingReview || 0})
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        <KpiCard
          label="Total Users"
          value={stats.stats?.users?.total || 0}
          trend="Real-time"
          color="#b5c070"
          onClick={() => onNavigate('users', 'users')}
          icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="currentColor"><circle cx="6" cy="5.5" r="3"/><path d="M1 15c0-3 2.5-5.5 5-5.5s5 2.5 5 5.5"/><circle cx="13" cy="5.5" r="2.2" opacity=".55"/><path d="M13 10.5c1.5 0 3 1.2 3 3" opacity=".55"/></svg>}
        />
        <KpiCard
          label="Total Documents"
          value={stats.stats?.documents?.total || 0}
          trend="Real-time"
          color="#7899cc"
          onClick={() => onNavigate('documents', 'documents', { statusFilter: 'ALL', sourceMetric: 'Total Documents' })}
          icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="currentColor"><path d="M3 1.5h8l4 4v10H3V1.5z" opacity=".8"/><path d="M11 1.5v4h4" fill="none" stroke="currentColor" strokeWidth="1"/><line x1="5.5" y1="9" x2="11.5" y2="9" stroke="currentColor" strokeWidth="1.2" fill="none"/><line x1="5.5" y1="11.5" x2="11.5" y2="11.5" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>}
        />
        <KpiCard
          label="Pending Verification"
          value={stats.stats?.documents?.pendingReview || 0}
          trend="Action required"
          color="#cc9944"
          badge="ACTION"
          onClick={() => onNavigate('documents', 'documents', { statusFilter: 'PENDING', sourceMetric: 'Pending Verification' })}
          icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8.5" cy="8.5" r="6.5"/><polyline points="8.5,5 8.5,8.5 11,10.5"/></svg>}
        />
        <KpiCard
          label="Validated Documents"
          value={stats.stats?.documents?.approved || 0}
          trend="Real-time"
          color="#68c87a"
          onClick={() => onNavigate('documents', 'documents', { statusFilter: 'APPROVED', sourceMetric: 'Validated Documents' })}
          icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="2.5,9 6.5,13 14.5,5"/></svg>}
        />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        <KpiCard
          label="Suspicious Documents"
          value={stats.stats?.documents?.suspicious || 0}
          trend="Rejected"
          color="#c87878"
          badge="RISK"
          onClick={() => onNavigate('documents', 'documents', { statusFilter: 'SUSPICIOUS', sourceMetric: 'Suspicious Documents' })}
          icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8.5 2L10.5 7.5H16L11.5 10.5L13 16L8.5 13L4 16L5.5 10.5L1 7.5H6.5L8.5 2Z"/></svg>}
        />
        <KpiCard
          label="Needs Review"
          value={stats.stats?.documents?.pendingReview || 0}
          trend="Flagged"
          color="#FF9933"
          badge="FLAG"
          onClick={() => onNavigate('documents', 'verification', { statusFilter: 'PENDING', sourceMetric: 'Needs Review' })}
          icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8.5 2.5v0"/><circle cx="8.5" cy="8.5" r="6.5"/><line x1="8.5" y1="5.5" x2="8.5" y2="9.5"/><circle cx="8.5" cy="12" r="0.7" fill="currentColor"/></svg>}
        />
        <KpiCard
          label="Critical Risk (Fake Detection)"
          value={stats.stats?.risk?.critical || 0}
          trend="Alert"
          color="#e06030"
          badge="ALERT"
          onClick={() => onNavigate('documents', 'documents', { statusFilter: 'CRITICAL', sourceMetric: 'Critical Risk (Fake Detection)' })}
          icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8.5 1.5L15.5 13.5H1.5L8.5 1.5Z"/><line x1="8.5" y1="6.5" x2="8.5" y2="10"/><circle cx="8.5" cy="12" r="0.7" fill="currentColor"/></svg>}
        />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        <div className="card-2" style={{ borderRadius:8, padding:'18px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0' }}>Historical Trends</div>
              <div style={{ fontSize:11, color:'#5a6a40', marginTop:2 }}>Month-by-month data is unavailable in the backend.</div>
            </div>
          </div>
          <div style={{ height: 210, display:'flex', alignItems:'center', justifyContent:'center', color:'#5a6a40', fontSize: 12 }}>
            (Chart unavailable - historical aggregate endpoint required)
          </div>
        </div>

        <div className="card-2" style={{ borderRadius:8, padding:'18px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0', marginBottom:3 }}>Document Status</div>
          <div style={{ fontSize:11, color:'#5a6a40', marginBottom:14 }}>All-time breakdown</div>
          <ResponsiveContainer width="100%" height={155}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                {pieData.map((e,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} stroke="rgba(255,255,255,0.05)"/>)}
              </Pie>
              <Tooltip contentStyle={{ background:'#1d2113', border:'1px solid rgba(74,90,42,0.35)', borderRadius:6, fontSize:12, color:'#e8e0d0' }} itemStyle={{ color:'#e8e0d0' }}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
            {pieData.map((d,i) => (
              <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:PIE_COLORS[i%PIE_COLORS.length] }}/>
                  <span style={{ fontSize:11, color:'#7a8a58' }}>{d.name}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:'#b5c070' }}>{d.value}</span>
                  <span style={{ fontSize:10, color:'#4a5a30' }}>{((d.value/totalDocs)*100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="card-2" style={{ borderRadius:8, padding:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:12, borderBottom:'1px solid rgba(74,90,42,0.2)', marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#e8e0d0', letterSpacing:'0.04em' }}>RECENT AUDIT LOGS</div>
            <button className="btn-ghost" style={{ fontSize:11, padding:'4px 8px', borderRadius:4, cursor:'pointer' }} onClick={() => onNavigate('history')}>View All</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {(stats.recentAuditLogs || []).slice(0,6).map(a => (
              <div key={a._id} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#5a6a40', marginTop:6, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:11, color:'#b5c070', lineHeight:1.4 }}>
                    <span style={{ fontWeight:600, color:'#e8e0d0' }}>{a.actorEmail}</span> {a.action} on {a.resource} ({a.status})
                  </div>
                  <div style={{ fontSize:10, color:'#4a5a30', marginTop:2 }}>{new Date(a.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

