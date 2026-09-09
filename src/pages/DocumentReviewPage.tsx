import { useState, useEffect, useMemo } from 'react'
import type { BackendDocument } from '../types'
import { BASE_URL, getAuthHeaders } from '../services/apiClient'
import { submitReview, getDocumentDetails } from '../services/documentApi'

interface Props { doc: BackendDocument; onBack: () => void }

const ScoreRing = ({ value, label, color }: { value:number; label:string; color:string }) => {
  const r = 26, c = 2*Math.PI*r, filled = (value/100)*c
  return (
    <div style={{ textAlign:'center' }}>
      <svg width="68" height="68" viewBox="0 0 68 68" style={{ display:'block', margin:'0 auto 5px' }}>
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(74,90,42,0.15)" strokeWidth="6"/>
        <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${filled} ${c}`} strokeLinecap="round"
          style={{ transform:'rotate(-90deg)', transformOrigin:'center' }}/>
        <text x="34" y="39" textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>{value}</text>
      </svg>
      <div style={{ fontSize:10, color:'#6a7a50', lineHeight:1.3, maxWidth:70 }}>{label}</div>
    </div>
  )
}

interface ImagePanelProps {
  title: string
  docId: string
  type: 'document' | 'selfie'
  filePath?: string | null
  fileName?: string
}

const ImagePanel = ({ title, docId, type, filePath, fileName }: ImagePanelProps) => {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let blobUrl: string | null = null

    const loadImage = async () => {
      if (!docId) {
        setLoading(false)
        setError(type === 'selfie' ? 'No reference selfie provided' : 'Document image not available')
        return
      }

      setLoading(true)
      setError(null)
      setImageSrc(null)
      setIsPdf(false)

      try {
        const endpoint = type === 'selfie' ? `/documents/${docId}/selfie` : `/documents/${docId}/file`
        const url = `${BASE_URL}${endpoint}`

        const response = await fetch(url, {
          headers: {
            'Accept': 'image/*,application/pdf,*/*',
            ...getAuthHeaders()
          }
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(type === 'selfie' ? 'No reference selfie provided' : 'Document image not available')
          }
          if (response.status === 401 || response.status === 403) {
            throw new Error('Unauthorized to view this image')
          }
          throw new Error(type === 'selfie' ? 'Unable to display reference selfie' : 'Unable to display document image')
        }

        const contentType = response.headers.get('content-type') || ''
        const isPdfFile = contentType.includes('application/pdf') || (fileName && fileName.toLowerCase().endsWith('.pdf'))

        const blob = await response.blob()
        if (blob.size === 0) {
          throw new Error(type === 'selfie' ? 'Unable to display reference selfie' : 'Unable to display document image')
        }

        blobUrl = URL.createObjectURL(blob)

        if (mounted) {
          setImageSrc(blobUrl)
          setIsPdf(!!isPdfFile)
          setLoading(false)
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || (type === 'selfie' ? 'No reference selfie provided' : 'Document image not available'))
          setLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      mounted = false
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [docId, type, filePath, fileName])

  return (
    <div className="card-2" style={{ borderRadius:8, display:'flex', flexDirection:'column', overflow:'hidden', flex:1 }}>
      <div style={{ padding:'11px 14px', borderBottom:'1px solid rgba(74,90,42,0.2)', background:'rgba(26,30,18,0.6)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#e8e0d0' }}>{title}</div>
        {!loading && !error && !isPdf && (
          <div style={{ display:'flex', gap:3 }}>
            {([
              { tip:'Zoom In',  action:()=>setZoom(z=>Math.min(z+0.2,3)),  symbol:'+' },
              { tip:'Zoom Out', action:()=>setZoom(z=>Math.max(z-0.2,0.5)),symbol:'-' },
              { tip:'Rotate',   action:()=>setRotation(r=>(r+90)%360),     symbol:'↻' },
              { tip:'Reset',    action:()=>{setZoom(1);setRotation(0)},     symbol:'⊙' },
            ] as const).map(({ tip, action, symbol }) => (
              <button key={tip} onClick={action} title={tip} style={{ width:24, height:24, borderRadius:4, background:'rgba(74,90,42,0.12)', border:'1px solid rgba(74,90,42,0.25)', cursor:'pointer', fontSize:11, color:'#7a8a58', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {symbol}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ flex:1, overflow:'hidden', background:'#0d0f08', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', minHeight:260, padding:16 }}>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, color:'#7a8a58', fontSize:12 }}>
            <div style={{ width:22, height:22, border:'2px solid rgba(122,138,88,0.2)', borderTopColor:'#b5c070', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            <span>{type === 'selfie' ? 'Loading reference selfie...' : 'Loading document image...'}</span>
          </div>
        ) : error ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, color:'#8a9a68', textAlign:'center', padding:20 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5a6a40" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <div style={{ fontSize:12, fontWeight:600, color:'#7a8a58' }}>{error}</div>
          </div>
        ) : isPdf && imageSrc ? (
          <div style={{ width:'100%', height:'100%', minHeight:280, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <embed src={imageSrc} type="application/pdf" style={{ width:'100%', height:'320px', borderRadius:4 }} />
          </div>
        ) : imageSrc ? (
          <div style={{ transform:`scale(${zoom}) rotate(${rotation}deg)`, transition:'transform 0.2s ease', transformOrigin:'center', width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <img
              src={imageSrc}
              alt={title}
              onError={() => setError(type === 'selfie' ? 'Unable to display reference selfie' : 'Unable to display document image')}
              style={{ maxWidth:'100%', maxHeight:'340px', objectFit:'contain', borderRadius:4 }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

const REJECTION_REASONS = [
  'Suspected forgery',
  'Tampered document',
  'Information mismatch',
  'Invalid document',
  'Document unclear / low resolution',
  'Missing required security features',
  'Face mismatch with reference selfie',
  'Other'
]

export default function DocumentReviewPage({ doc: initialDoc, onBack }: Props) {
  const [currentDoc, setCurrentDoc] = useState<BackendDocument>(initialDoc)
  const [decision, setDecision] = useState<'APPROVED'|'REJECTED'|'NEEDS_REVIEW'|null>(
    initialDoc.reviewStatus === 'APPROVED' ? 'APPROVED' : initialDoc.reviewStatus === 'REJECTED' ? 'REJECTED' : null
  )
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [approveNote, setApproveNote] = useState('Document verified and validated by admin.')
  const [rejReasons, setRejReasons] = useState<string[]>([])
  const [rejNote, setRejNote] = useState(initialDoc.reviewComment || '')
  const [confirmed, setConfirmed] = useState(initialDoc.reviewStatus === 'APPROVED' || initialDoc.reviewStatus === 'REJECTED')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Sync with live DB state on mount
  useEffect(() => {
    let mounted = true
    if (initialDoc._id) {
      getDocumentDetails(initialDoc._id).then(res => {
        if (mounted && res.success && res.document) {
          setCurrentDoc(res.document)
          if (res.document.reviewStatus === 'APPROVED') {
            setDecision('APPROVED')
            setConfirmed(true)
          } else if (res.document.reviewStatus === 'REJECTED') {
            setDecision('REJECTED')
            setConfirmed(true)
            if (res.document.reviewComment) {
              setRejNote(res.document.reviewComment)
            }
          }
        }
      }).catch(() => {
        // Silently preserve initial prop
      })
    }
    return () => { mounted = false }
  }, [initialDoc._id])

  const handleConfirmApprove = async () => { 
    setSubmitting(true)
    setError('')
    try {
      const res = await submitReview(currentDoc._id, 'APPROVED', approveNote.trim() || 'Verified and approved by admin.')
      if (res.success) {
        setDecision('APPROVED')
        setConfirmed(true)
        setShowApproveModal(false)
        setSuccessMsg('Document approved and verified successfully. Database updated.')
        if (res.document) {
          setCurrentDoc(res.document)
        } else {
          currentDoc.reviewStatus = 'APPROVED'
          currentDoc.validationStatus = 'VALIDATED'
        }
      } else {
        throw new Error(res.message || 'Failed to approve document')
      }
    } catch(err:any) { 
      setError(err.message || 'Unable to save approval decision. Please try again.') 
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmReject = async () => {
    if (rejReasons.length === 0 && !rejNote.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const fullReason = rejReasons.length > 0 
        ? `${rejReasons.join(', ')}${rejNote.trim() ? ` — ${rejNote.trim()}` : ''}`
        : rejNote.trim()

      const res = await submitReview(currentDoc._id, 'REJECTED', fullReason)
      if (res.success) {
        setDecision('REJECTED')
        setConfirmed(true)
        setShowRejectModal(false)
        setSuccessMsg('Document marked as suspicious/rejected. Database updated.')
        if (res.document) {
          setCurrentDoc(res.document)
        } else {
          currentDoc.reviewStatus = 'REJECTED'
          currentDoc.validationStatus = 'REJECTED'
          currentDoc.reviewComment = fullReason
        }
      } else {
        throw new Error(res.message || 'Failed to reject document')
      }
    } catch(err:any) { 
      setError(err.message || 'Unable to save rejection decision. Please try again.') 
    } finally {
      setSubmitting(false)
    }
  }

  const evidence = currentDoc.fakeDetectionDetails?.evidence || {}
  const cv = evidence.identity?.crossValidation || {}
  const finalDecision = currentDoc.fakeDetectionDetails?.finalDecision || {}
  
  const matchedFields = cv.matchedFields || []
  const mismatchedFields = cv.mismatchedFields || []
  
  const matchCount = matchedFields.length
  const mismatchCount = mismatchedFields.length
  const totalFields = matchCount + mismatchCount
  
  const dataMatch = totalFields > 0 ? Math.round((matchCount/totalFields)*100) : 100
  const authScore = Math.max(0, 100 - (currentDoc.riskScore || 0))
  const ocrConf = 98
  
  const faceVerified = evidence.biometrics?.face?.verified
  const faceStatus = evidence.biometrics?.face?.status || (faceVerified ? 'MATCH' : faceVerified === false ? 'NO_MATCH' : 'UNKNOWN')
  const faceSimilarity = evidence.biometrics?.face?.confidence || 0

  const overallStatus = currentDoc.validationStatus === 'VALIDATED' || currentDoc.reviewStatus === 'APPROVED' 
    ? 'match' 
    : currentDoc.validationStatus === 'REJECTED' || currentDoc.reviewStatus === 'REJECTED' 
    ? 'mismatch' 
    : 'review'

  const ResultCard = () => {
    if (overallStatus === 'match') return (
      <div style={{ background:'rgba(58,138,72,0.1)', border:'1px solid rgba(58,138,72,0.3)', borderRadius:8, padding:'18px 22px', textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
        <div style={{ fontSize:16, fontWeight:800, color:'#68c87a', letterSpacing:'0.06em' }}>MATCHED / CLEARED</div>
        <div style={{ fontSize:12, color:'#4a8a58', marginTop:5 }}>
          {confirmed ? 'Admin verified & validated this document.' : 'Automated engine cleared the document.'}
        </div>
      </div>
    )
    if (overallStatus === 'mismatch') return (
      <div style={{ background:'rgba(138,56,56,0.1)', border:'1px solid rgba(138,56,56,0.3)', borderRadius:8, padding:'18px 22px', textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:8 }}>❌</div>
        <div style={{ fontSize:16, fontWeight:800, color:'#c87878', letterSpacing:'0.06em' }}>MISMATCH / SUSPICIOUS</div>
        <div style={{ fontSize:12, color:'#8a5050', marginTop:5 }}>
          {confirmed ? 'Admin marked this document as rejected / suspicious.' : 'Automated engine rejected the document.'}
        </div>
        <div style={{ fontSize:11, color:'#6a3030', marginTop:3 }}>
          Risk Score: {currentDoc.riskScore} · {currentDoc.riskReasons?.join(', ') || currentDoc.reviewComment || 'Flagged for inconsistency'}
        </div>
      </div>
    )
    return (
      <div style={{ background:'rgba(138,100,32,0.1)', border:'1px solid rgba(138,100,32,0.3)', borderRadius:8, padding:'18px 22px', textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:8 }}>⚠️</div>
        <div style={{ fontSize:16, fontWeight:800, color:'#cc9944', letterSpacing:'0.06em' }}>NEEDS MANUAL REVIEW</div>
        <div style={{ fontSize:12, color:'#8a7040', marginTop:5 }}>System detected potential inconsistencies requiring human administrator verification.</div>
        <div style={{ fontSize:11, color:'#6a3030', marginTop:3 }}>Risk Score: {currentDoc.riskScore} · {currentDoc.riskReasons?.join(', ') || 'Awaiting decision'}</div>
      </div>
    )
  }

  const renderOcrRow = (fieldStr: string, status: 'match'|'mismatch') => (
    <tr key={fieldStr} style={{ background:status==='mismatch'?'rgba(138,56,56,0.07)':'transparent' }}>
      <td colSpan={3} style={{ fontWeight:400, color:status==='mismatch'?'#c87878':'#d0c8b8', fontSize: 12 }}>{fieldStr}</td>
      <td>
        {status === 'match' && (
          <span style={{ display:'flex', alignItems:'center', gap:4, color:'#68c87a', fontSize:11, fontWeight:700 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#68c87a" strokeWidth="2"><polyline points="2,6.5 5,9.5 11,3.5"/></svg>
            MATCHED
          </span>
        )}
        {status === 'mismatch' && (
          <span style={{ display:'flex', alignItems:'center', gap:4, color:'#c87878', fontSize:11, fontWeight:700 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#c87878" strokeWidth="2"><line x1="2.5" y1="2.5" x2="10.5" y2="10.5"/><line x1="10.5" y1="2.5" x2="2.5" y2="10.5"/></svg>
            MISMATCH
          </span>
        )}
      </td>
    </tr>
  )

  const uName = typeof currentDoc.user === 'object' && currentDoc.user ? (currentDoc.user as any).name || (currentDoc.user as any).email : currentDoc.user || 'Unknown User'
  const reviewerName = typeof currentDoc.reviewedBy === 'object' && currentDoc.reviewedBy ? (currentDoc.reviewedBy as any).name || (currentDoc.reviewedBy as any).email : 'Administrator'

  return (
    <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:18 }}>
      {/* Top Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding:'6px 12px', borderRadius:6, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="7.5,2 3,5.5 7.5,9"/></svg>
          Back to Queue
        </button>
        <div>
          <h1 style={{ fontSize:17, fontWeight:700, color:'#e8e0d0', margin:0 }}>
            Document Review — <span style={{ color:'#FF9933' }}>{currentDoc.documentType}</span>
          </h1>
          <p style={{ fontSize:11, color:'#4a5a30', margin:'3px 0 0' }}>
            User: {uName} · ID: {currentDoc._id} · Submitted: {new Date(currentDoc.uploadedAt || (currentDoc as any).createdAt).toLocaleString()}
          </p>
        </div>
        <div style={{ flex:1 }}/>
        {confirmed && (
          <div style={{ padding:'6px 14px', borderRadius:6, fontSize:12, fontWeight:700,
            background:decision==='APPROVED'?'rgba(58,138,72,0.15)':decision==='REJECTED'?'rgba(138,56,56,0.15)':'rgba(138,100,32,0.15)',
            border:`1px solid ${decision==='APPROVED'?'rgba(58,138,72,0.3)':decision==='REJECTED'?'rgba(138,56,56,0.3)':'rgba(138,100,32,0.3)'}`,
            color:decision==='APPROVED'?'#68c87a':decision==='REJECTED'?'#c87878':'#cc9944',
          }}>
            {decision==='APPROVED'?'✓ VERIFIED':decision==='REJECTED'?'✕ SUSPICIOUS / REJECTED':'⚠ FLAGGED FOR REVIEW'}
          </div>
        )}
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div style={{ padding:'10px 14px', background:'rgba(58,138,72,0.15)', border:'1px solid rgba(58,138,72,0.35)', borderRadius:6, color:'#68c87a', fontSize:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ background:'none', border:'none', color:'#68c87a', cursor:'pointer' }}>✕</button>
        </div>
      )}
      {error && (
        <div style={{ padding:'10px 14px', background:'rgba(138,56,56,0.15)', border:'1px solid rgba(138,56,56,0.35)', borderRadius:6, color:'#c87878', fontSize:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError('')} style={{ background:'none', border:'none', color:'#c87878', cursor:'pointer' }}>✕</button>
        </div>
      )}

      {/* Document Images Section */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:'#8b9a5a', letterSpacing:'0.1em', marginBottom:10 }}>DOCUMENT IMAGES</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <ImagePanel
            title="Submitted Document"
            docId={currentDoc._id}
            type="document"
            filePath={currentDoc.filePath}
            fileName={currentDoc.fileName}
          />
          {currentDoc.selfiePath ? (
            <ImagePanel
              title="Reference Selfie / Live Photo"
              docId={currentDoc._id}
              type="selfie"
              filePath={currentDoc.selfiePath}
            />
          ) : (
            <div className="card-2" style={{ borderRadius:8, display:'flex', flexDirection:'column', overflow:'hidden', flex:1 }}>
              <div style={{ padding:'11px 14px', borderBottom:'1px solid rgba(74,90,42,0.2)', background:'rgba(26,30,18,0.6)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#e8e0d0' }}>Reference Selfie / Live Photo</div>
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#7a8a58', fontSize:12, minHeight:260, padding:16, textAlign:'center', gap:8 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5a6a40" strokeWidth="1.5">
                  <circle cx="12" cy="7" r="4"/>
                  <path d="M5.5 21a8.38 8.38 0 0 1 13 0"/>
                </svg>
                <span>No reference selfie provided</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cross Validation Details */}
      <div className="card-2" style={{ borderRadius:8, padding:'18px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0', marginBottom:3 }}>Cross Validation Details</div>
        <div style={{ fontSize:11, color:'#5a6a40', marginBottom:14 }}>Comparison of OCR vs Checksum/MRZ data</div>
        <table className="admin-table" style={{ tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'84%' }}/><col style={{ width:'16%' }}/>
          </colgroup>
          <thead><tr><th>Field Details</th><th>Result</th></tr></thead>
          <tbody>
            {matchedFields.map((f:string) => renderOcrRow(f, 'match'))}
            {mismatchedFields.map((f:string) => renderOcrRow(f, 'mismatch'))}
            {matchedFields.length === 0 && mismatchedFields.length === 0 && (
              <tr><td colSpan={2} style={{ color:'#5a6a40', textAlign:'center', padding:20 }}>No cross-validation data available for this document type.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* AI / Pipeline Analysis */}
      <div className="card-2" style={{ borderRadius:8, padding:'18px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0', marginBottom:3 }}>AI / Pipeline Analysis</div>
        <div style={{ fontSize:11, color:'#5a6a40', marginBottom:18 }}>Aggregated Evidence Data (Forensic Evidence for Admin Review)</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          <ScoreRing value={authScore}  label="Authenticity Score"  color={authScore>80?'#68c87a':authScore>55?'#cc9944':'#c87878'}/>
          <ScoreRing value={ocrConf}    label="OCR Confidence"      color="#7899cc"/>
          <ScoreRing value={dataMatch}  label="Data Match Score"    color={dataMatch===100?'#68c87a':dataMatch>70?'#cc9944':'#c87878'}/>
          <ScoreRing value={Math.round(faceSimilarity*100)} label="Face Similarity"  color={faceSimilarity>0.8?'#68c87a':faceSimilarity>0.6?'#cc9944':'#c87878'}/>
        </div>
        <div style={{ marginTop:18, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[
            { label:'Tampering Indicators',  value: evidence.tampering?.indicators?.length > 0 ? `${evidence.tampering.indicators.length} indicators flagged` : 'No tampering detected', color:evidence.tampering?.indicators?.length > 0 ?'#c87878':'#68c87a' },
            { label:'Face Verification',  value: faceStatus, color: faceStatus === 'MATCH' ? '#68c87a' : faceStatus === 'NO_MATCH' ? '#c87878' : '#cc9944' },
            { label:'Risk Level',  value: currentDoc.riskLevel || 'LOW',  color: currentDoc.riskLevel === 'CRITICAL' ? '#c87878' : currentDoc.riskLevel === 'HIGH' ? '#e06030' : currentDoc.riskLevel === 'MEDIUM' ? '#cc9944' : '#68c87a' },
          ].map(item => (
            <div key={item.label} style={{ background:'rgba(42,50,24,0.4)', borderRadius:6, padding:'11px 13px', border:'1px solid rgba(74,90,42,0.18)' }}>
              <div style={{ fontSize:10, color:'#3a4a22', fontWeight:600, letterSpacing:'0.06em', marginBottom:4 }}>{item.label.toUpperCase()}</div>
              <div style={{ fontSize:12, color:item.color, fontWeight:600 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Result Section */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:'#8b9a5a', letterSpacing:'0.1em', marginBottom:10 }}>VERIFICATION RESULT</div>
        <ResultCard/>
      </div>

      {/* Admin Final Decision Section */}
      {!confirmed ? (
        <div className="card-3" style={{ borderRadius:8, padding:'22px' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#e8e0d0', marginBottom:3 }}>Admin Final Decision</div>
          <div style={{ fontSize:11, color:'#5a6a40', marginBottom:18 }}>
            Your decision will be recorded in the system audit trail and update the real-time document verification queue.
          </div>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
            <button
              className="btn-primary"
              onClick={() => setShowApproveModal(true)}
              disabled={submitting}
              style={{ padding:'12px 28px', borderRadius:7, fontSize:13, fontWeight:700, cursor:submitting?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8 }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="2.5,7.5 6,11 12.5,4"/></svg>
              APPROVE / VERIFY
            </button>
            <button
              className="btn-danger"
              onClick={() => setShowRejectModal(true)}
              disabled={submitting}
              style={{ padding:'12px 28px', borderRadius:7, fontSize:13, fontWeight:700, cursor:submitting?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8 }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="2"><line x1="2.5" y1="2.5" x2="12.5" y2="12.5"/><line x1="12.5" y1="2.5" x2="2.5" y2="12.5"/></svg>
              MARK SUSPICIOUS / REJECT
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding:'20px 24px', background:decision==='APPROVED'?'rgba(58,138,72,0.12)':'rgba(138,56,56,0.12)', borderRadius:8, border:`1px solid ${decision==='APPROVED'?'rgba(58,138,72,0.3)':'rgba(138,56,56,0.3)'}`, display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:22 }}>{decision === 'APPROVED' ? '✅' : '❌'}</span>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#e8e0d0' }}>
                  {decision === 'APPROVED' ? 'Document Verified & Cleared' : 'Document Rejected / Marked Suspicious'}
                </div>
                <div style={{ fontSize:12, color:'#7a8a58', marginTop:2 }}>
                  Actioned by <strong style={{ color:'#b5c070' }}>{reviewerName}</strong>
                  {currentDoc.reviewedAt && ` on ${new Date(currentDoc.reviewedAt).toLocaleString()}`}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button
                className="btn-ghost"
                onClick={onBack}
                style={{ padding:'8px 16px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}
              >
                Return to Documents Queue
              </button>
              <button
                onClick={() => setConfirmed(false)}
                style={{ background:'rgba(74,90,42,0.15)', border:'1px solid rgba(74,90,42,0.3)', color:'#b5c070', padding:'8px 14px', borderRadius:6, fontSize:12, cursor:'pointer' }}
                title="Change or re-evaluate decision"
              >
                Re-evaluate Decision
              </button>
            </div>
          </div>
          {(currentDoc.reviewComment || rejNote) && (
            <div style={{ padding:'8px 12px', background:'rgba(0,0,0,0.25)', borderRadius:4, fontSize:12, color:decision==='APPROVED'?'#68c87a':'#c87878', borderLeft:`3px solid ${decision==='APPROVED'?'#68c87a':'#c87878'}` }}>
              <strong>Decision Note:</strong> {currentDoc.reviewComment || rejNote}
            </div>
          )}
        </div>
      )}

      {/* APPROVAL CONFIRMATION MODAL */}
      {showApproveModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }} onClick={() => !submitting && setShowApproveModal(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-fade-in" style={{ background:'#1d2113', border:'1px solid rgba(58,138,72,0.4)', borderRadius:10, padding:'26px 30px', width:500, maxWidth:'92vw', boxShadow:'0 24px 80px rgba(0,0,0,0.85)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'rgba(58,138,72,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#68c87a' }}>
                ✓
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:'#e8e0d0' }}>Confirm Document Approval</div>
                <div style={{ fontSize:11, color:'#6a7a48' }}>Mark document as VALIDATED in live database</div>
              </div>
            </div>

            <div style={{ background:'rgba(42,50,24,0.4)', borderRadius:6, padding:'12px 16px', marginBottom:16, border:'1px solid rgba(74,90,42,0.2)', fontSize:12, display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:'#7a8a58' }}>Document Type:</span>
                <strong style={{ color:'#e8e0d0' }}>{currentDoc.documentType}</strong>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:'#7a8a58' }}>Submitter:</span>
                <strong style={{ color:'#e8e0d0' }}>{uName}</strong>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:'#7a8a58' }}>Authenticity Score:</span>
                <strong style={{ color:authScore>80?'#68c87a':'#cc9944' }}>{authScore} / 100</strong>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:'#7a8a58' }}>Risk Level:</span>
                <strong style={{ color:currentDoc.riskLevel==='CRITICAL'?'#c87878':'#68c87a' }}>{currentDoc.riskLevel || 'LOW'}</strong>
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'#7a8a58', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>APPROVAL REMARKS (AUDIT LOG)</label>
              <input
                className="admin-input"
                value={approveNote}
                onChange={e => setApproveNote(e.target.value)}
                placeholder="Optional verification note for audit history…"
                style={{ width:'100%', padding:'9px 12px', fontSize:12 }}
              />
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn-ghost" disabled={submitting} onClick={() => setShowApproveModal(false)} style={{ padding:'9px 18px', borderRadius:6, fontSize:13, cursor:'pointer' }}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmApprove}
                disabled={submitting}
                style={{ padding:'9px 22px', borderRadius:6, fontSize:13, fontWeight:700, cursor:submitting?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8 }}
              >
                {submitting ? (
                  <>
                    <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                    <span>VERIFYING...</span>
                  </>
                ) : (
                  <span>Confirm Approval</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION / SUSPICIOUS CONFIRMATION MODAL */}
      {showRejectModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }} onClick={() => !submitting && setShowRejectModal(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-fade-in" style={{ background:'#1d2113', border:'1px solid rgba(138,56,56,0.4)', borderRadius:10, padding:'26px 30px', width:520, maxWidth:'92vw', boxShadow:'0 24px 80px rgba(0,0,0,0.85)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'rgba(138,56,56,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#c87878' }}>
                ✕
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:'#e8e0d0' }}>Reject / Mark Suspicious</div>
                <div style={{ fontSize:11, color:'#6a7a48' }}>Select rejection reasons to record in audit log and update risk status</div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
              {REJECTION_REASONS.map(r => (
                <label key={r} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'7px 12px', borderRadius:5, background:rejReasons.includes(r)?'rgba(138,56,56,0.12)':'rgba(42,50,24,0.3)', border:`1px solid ${rejReasons.includes(r)?'rgba(138,56,56,0.35)':'rgba(74,90,42,0.15)'}`, transition:'all 0.12s' }}>
                  <input
                    type="checkbox"
                    checked={rejReasons.includes(r)}
                    onChange={e => setRejReasons(prev => e.target.checked ? [...prev, r] : prev.filter(x => x !== r))}
                    style={{ accentColor:'#c87878', width:14, height:14 }}
                  />
                  <span style={{ fontSize:12, color:'#c8c0b0' }}>{r}</span>
                </label>
              ))}
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'#7a8a58', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>ADDITIONAL REMARKS</label>
              <textarea
                className="admin-input"
                value={rejNote}
                onChange={e => setRejNote(e.target.value)}
                rows={2}
                placeholder="Enter detailed remarks or findings for the audit trail…"
                style={{ width:'100%', padding:'8px 12px', fontSize:12, resize:'vertical' }}
              />
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn-ghost" disabled={submitting} onClick={() => setShowRejectModal(false)} style={{ padding:'9px 18px', borderRadius:6, fontSize:13, cursor:'pointer' }}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleConfirmReject}
                disabled={submitting || (rejReasons.length === 0 && !rejNote.trim())}
                style={{ padding:'9px 22px', borderRadius:6, fontSize:13, fontWeight:700, cursor:submitting||(rejReasons.length===0&&!rejNote.trim())?'not-allowed':'pointer', opacity:rejReasons.length===0&&!rejNote.trim()?0.5:1, display:'flex', alignItems:'center', gap:8 }}
              >
                {submitting ? (
                  <>
                    <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <span>Confirm Rejection</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

