import { useState, useEffect } from 'react'
import type { BackendDocument } from '../types'
import { getAdminDocuments as getAdminDocs, DocumentFilters } from '../services/adminApi'
import { getPendingReviews as getPendingDocs } from '../services/documentApi'

export interface DocumentFilterState {
  statusFilter?: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW' | 'SUSPICIOUS' | 'CRITICAL'
  typeFilter?: string
  search?: string
  sourceMetric?: string
}

interface Props {
  onReview: (doc: any) => void
  mode?: 'all' | 'queue'
  initialFilter?: DocumentFilterState
  onClearFilter?: () => void
}

const displayStatus = (s: string) => {
  if (s === 'REJECTED') return 'Suspicious'
  if (s === 'APPROVED') return 'Verified'
  if (s === 'PENDING') return 'Pending'
  if (s === 'NEEDS_REVIEW') return 'Needs Review'
  return s || 'Pending'
}

const badgeCls = (s: string) => {
  if (s === 'APPROVED') return 'badge-verified'
  if (s === 'REJECTED') return 'badge-rejected'
  if (s === 'PENDING') return 'badge-pending'
  return 'badge-review'
}

const riskBadge = (doc: BackendDocument) => {
  if (doc.riskLevel === 'CRITICAL') {
    return <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'rgba(224,96,48,0.18)', color:'#ff6b4a', border:'1px solid rgba(224,96,48,0.35)' }}>CRITICAL</span>
  }
  if (doc.fakeDocumentStatus === 'SUSPICIOUS' || doc.riskLevel === 'HIGH') {
    return <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'rgba(200,120,120,0.18)', color:'#c87878', border:'1px solid rgba(200,120,120,0.35)' }}>SUSPICIOUS</span>
  }
  if (doc.riskLevel === 'MEDIUM') {
    return <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'rgba(204,153,68,0.18)', color:'#cc9944', border:'1px solid rgba(204,153,68,0.35)' }}>MEDIUM</span>
  }
  return <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4, background:'rgba(104,200,122,0.12)', color:'#68c87a', border:'1px solid rgba(104,200,122,0.25)' }}>LOW</span>
}

export default function DocumentsPage({ onReview, mode = 'all', initialFilter, onClearFilter }: Props) {
  const isQueue = mode === 'queue'
  
  const [documents, setDocuments] = useState<BackendDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  const [statusFilter, setStatusFilter] = useState<string>(
    initialFilter?.statusFilter || (isQueue ? 'PENDING' : 'ALL')
  )
  const [typeFilter, setTypeFilter] = useState<string>(initialFilter?.typeFilter || 'All')
  const [search, setSearch] = useState<string>(initialFilter?.search || '')
  const [sourceMetric, setSourceMetric] = useState<string | undefined>(
    initialFilter?.sourceMetric || (isQueue ? 'Review Queue' : undefined)
  )

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const PER_PAGE = 20

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const filters: DocumentFilters = {
      page,
      limit: PER_PAGE,
      typeFilter: typeFilter !== 'All' ? typeFilter : undefined,
      documentType: typeFilter !== 'All' ? typeFilter : undefined,
      search: search.trim() || undefined,
    }

    if (statusFilter === 'PENDING') {
      filters.reviewStatus = 'PENDING'
    } else if (statusFilter === 'APPROVED') {
      filters.reviewStatus = 'APPROVED'
    } else if (statusFilter === 'REJECTED') {
      filters.reviewStatus = 'REJECTED'
    } else if (statusFilter === 'SUSPICIOUS') {
      filters.fakeDocumentStatus = 'SUSPICIOUS'
    } else if (statusFilter === 'CRITICAL') {
      filters.riskLevel = 'CRITICAL'
    } else if (statusFilter === 'NEEDS_REVIEW') {
      filters.reviewStatus = 'PENDING'
    }

    const fetchPromise = (isQueue && statusFilter === 'PENDING' && typeFilter === 'All' && !search)
      ? getPendingDocs(page, PER_PAGE)
      : getAdminDocs(filters)

    fetchPromise.then(data => {
      if (mounted && data.success) {
        const docs = data.documents || data.data || []
        setDocuments(docs)
        const total = data.total !== undefined ? data.total : docs.length
        setTotalCount(total)
        setTotalPages(data.totalPages || Math.ceil(total / PER_PAGE) || 1)
      }
      if (mounted) setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })

    return () => { mounted = false }
  }, [mode, page, statusFilter, typeFilter, search])

  const handleClearFilters = () => {
    setStatusFilter('ALL')
    setTypeFilter('All')
    setSearch('')
    setSourceMetric(undefined)
    setPage(1)
    onClearFilter?.()
  }

  const isFiltered = statusFilter !== 'ALL' || typeFilter !== 'All' || search.trim() !== ''

  const getEmptyMessage = () => {
    if (statusFilter === 'CRITICAL') {
      return {
        title: 'No Critical Risk Documents Found',
        desc: 'All documents currently pass standard fraud and tampering detection thresholds (0 flagged critical).'
      }
    }
    if (statusFilter === 'SUSPICIOUS') {
      return {
        title: 'No Suspicious Documents Found',
        desc: 'No documents match the suspicious AI fake-detection criteria under the current filter.'
      }
    }
    if (statusFilter === 'PENDING' || statusFilter === 'NEEDS_REVIEW') {
      return {
        title: 'No Pending Documents in Queue',
        desc: 'All documents have been reviewed and resolved. Great job!'
      }
    }
    if (statusFilter === 'APPROVED') {
      return {
        title: 'No Validated Documents Found',
        desc: 'No verified documents found matching the current search parameters.'
      }
    }
    return {
      title: 'No Documents Found',
      desc: search ? `No document records match "${search}". Try adjusting your search query or filters.` : 'No document records currently exist in the database.'
    }
  }

  const emptyInfo = getEmptyMessage()

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'24px' }}>
      {/* Header section */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <h1 style={{ fontSize:19, fontWeight:700, color:'#e8e0d0', margin:0 }}>
              {sourceMetric ? sourceMetric : isQueue ? 'Review Queue' : 'All Documents'}
            </h1>
            <span style={{ fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(181,192,112,0.15)', color:'#b5c070', border:'1px solid rgba(181,192,112,0.3)' }}>
              {totalCount} {totalCount === 1 ? 'record' : 'records'}
            </span>
          </div>
          <p style={{ fontSize:12, color:'#5a6a40', margin:'4px 0 0' }}>
            {sourceMetric ? `Filtered view based on Dashboard metric "${sourceMetric}"` : isQueue ? 'Action required on pending verification items' : 'System-wide submitted documents and AI screening logs'}
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <input
              className="admin-input"
              placeholder="Search user, ID, type…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ width:210, paddingLeft:32 }}
            />
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#5a6a40" strokeWidth="1.5" style={{ position:'absolute', left:10, top:10 }}>
              <circle cx="5.5" cy="5.5" r="4"/><line x1="8.5" y1="8.5" x2="12" y2="12"/>
            </svg>
            {search && (
              <button onClick={() => setSearch('')} style={{ position:'absolute', right:8, top:8, background:'none', border:'none', color:'#7a8a58', cursor:'pointer', fontSize:12 }}>
                ✕
              </button>
            )}
          </div>

          <select
            className="admin-input"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setSourceMetric(undefined); setPage(1); }}
            style={{ width:180 }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Verified / Approved</option>
            <option value="SUSPICIOUS">Suspicious (Fake Detection)</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            className="admin-input"
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ width:160 }}
          >
            <option value="All">All Document Types</option>
            <option value="AADHAAR">Aadhaar Card</option>
            <option value="PAN">PAN Card</option>
            <option value="DRIVING_LICENSE">Driving License</option>
            <option value="PASSPORT">Passport</option>
          </select>
        </div>
      </div>

      {/* Active filter chip */}
      {isFiltered && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', background:'rgba(74,90,42,0.12)', border:'1px solid rgba(74,90,42,0.25)', borderRadius:6, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#b5c070' }}>
            <span style={{ fontSize:14 }}>⚡</span>
            <span>
              Active Filter: <strong style={{ color:'#e8e0d0' }}>{sourceMetric || (statusFilter !== 'ALL' ? statusFilter : typeFilter !== 'All' ? typeFilter : `Search "${search}"`)}</strong>
              {statusFilter !== 'ALL' && sourceMetric && <span style={{ color:'#7a8a58', marginLeft:6 }}>({statusFilter})</span>}
              {' · '}Showing {totalCount} matching {totalCount === 1 ? 'result' : 'results'}
            </span>
          </div>
          <button
            onClick={handleClearFilters}
            style={{ background:'rgba(200,120,120,0.12)', border:'1px solid rgba(200,120,120,0.3)', color:'#c87878', borderRadius:4, padding:'3px 10px', fontSize:11, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}
          >
            <span>✕</span> Reset Filters
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="card-2" style={{ flex:1, borderRadius:8, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ flex:1, overflowY:'auto' }}>
          <table className="admin-table">
            <thead style={{ position:'sticky', top:0, zIndex:10 }}>
              <tr>
                <th>Doc ID</th>
                <th>Submitter</th>
                <th>Document Type</th>
                <th>Review Status</th>
                <th>Risk / AI Flag</th>
                <th>Submission Date</th>
                <th style={{ textAlign:'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign:'center', padding:50, color:'#5a6a40' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                      <div className="spinner" style={{ width:24, height:24, border:'2px solid rgba(122,138,88,0.2)', borderTopColor:'#b5c070', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                      <span>Fetching documents from database...</span>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign:'center', padding:50 }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, maxWidth:420, margin:'0 auto' }}>
                      <div style={{ width:40, height:40, borderRadius:8, background:'rgba(74,90,42,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#7a8a58' }}>
                        📋
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#e8e0d0' }}>{emptyInfo.title}</div>
                      <div style={{ fontSize:12, color:'#6a7a48', lineHeight:1.4 }}>{emptyInfo.desc}</div>
                      {isFiltered && (
                        <button className="btn-ghost" onClick={handleClearFilters} style={{ marginTop:12, padding:'6px 14px', borderRadius:6, fontSize:12, cursor:'pointer' }}>
                          View All Documents
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : documents.map(d => {
                const uName = typeof d.user === 'object' && d.user ? (d.user as any).name || (d.user as any).email : d.user || 'Unknown'
                const uEmail = typeof d.user === 'object' && d.user ? (d.user as any).email : ''
                return (
                  <tr key={d._id}>
                    <td style={{ fontWeight:600, color:'#b5c070', fontSize:12, fontFamily:'monospace' }}>
                      {d._id.substring(0, 8)}...
                    </td>
                    <td>
                      <div style={{ fontWeight:600, color:'#e8e0d0', fontSize:12 }}>{uName}</div>
                      {uEmail && uEmail !== uName && <div style={{ fontSize:10, color:'#5a6a40' }}>{uEmail}</div>}
                    </td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:4, background:'rgba(74,90,42,0.15)', color:'#b5c070', border:'1px solid rgba(74,90,42,0.25)' }}>
                        {d.documentType}
                      </span>
                    </td>
                    <td>
                      <span className={badgeCls(d.reviewStatus)}>{displayStatus(d.reviewStatus)}</span>
                    </td>
                    <td>
                      {riskBadge(d)}
                    </td>
                    <td style={{ color:'#6a7a48', fontSize:11 }}>
                      {new Date(d.uploadedAt || (d as any).createdAt).toLocaleString()}
                    </td>
                    <td style={{ textAlign:'right' }}>
                      {isQueue || d.reviewStatus === 'PENDING' || d.reviewStatus === 'NEEDS_REVIEW' ? (
                        <button
                          className="btn-saffron"
                          style={{ padding:'5px 13px', borderRadius:4, fontSize:11, fontWeight:700, cursor:'pointer' }}
                          onClick={() => onReview(d)}
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          className="btn-ghost"
                          style={{ padding:'5px 13px', borderRadius:4, fontSize:11, cursor:'pointer' }}
                          onClick={() => onReview(d)}
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(74,90,42,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(29,33,19,0.8)' }}>
          <div style={{ fontSize:11, color:'#6a7a48' }}>
            {totalCount > 0 ? (
              <>Showing <strong style={{ color:'#e8e0d0' }}>{Math.min((page - 1) * PER_PAGE + 1, totalCount)}</strong> - <strong style={{ color:'#e8e0d0' }}>{Math.min(page * PER_PAGE, totalCount)}</strong> of <strong style={{ color:'#e8e0d0' }}>{totalCount}</strong> documents</>
            ) : (
              <>0 records</>
            )}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:11, color:'#5a6a40', marginRight:4 }}>
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              className="btn-ghost"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ padding:'4px 12px', borderRadius:4, fontSize:11, cursor:page===1?'not-allowed':'pointer', opacity:page===1?0.5:1 }}
            >
              Previous
            </button>
            <button
              className="btn-ghost"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{ padding:'4px 12px', borderRadius:4, fontSize:11, cursor:page>=totalPages?'not-allowed':'pointer', opacity:page>=totalPages?0.5:1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

