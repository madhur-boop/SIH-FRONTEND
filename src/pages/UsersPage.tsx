import { useState, useEffect } from 'react'
import type { BackendUser, BackendDocument } from '../types'
import { getUsers, getAdminDocuments, createUser, deleteUser } from '../services/adminApi'

interface Props { onReview: (doc: any) => void }

export default function UsersPage({ onReview }: Props) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<BackendUser[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedUserId, setSelectedUserId] = useState<string|null>(null)
  const [drawerTab, setDrawerTab] = useState<'info'|'docs'>('info')
  const [userDocs, setUserDocs] = useState<BackendDocument[]>([])

  // Create User State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'USER' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  // Delete User State
  const [userToDelete, setUserToDelete] = useState<BackendUser | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers(1, 50, search)
      if (data.success) {
        setUsers(data.users)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [search])

  useEffect(() => {
    if (selectedUserId && drawerTab === 'docs') {
      getAdminDocuments(1, 100).then(data => {
        if (data.success) {
          setUserDocs(data.documents.filter((d: any) => 
            (typeof d.user === 'object' ? d.user._id : d.user) === selectedUserId
          ))
        }
      }).catch(console.error)
    }
  }, [selectedUserId, drawerTab])

  const selectedUser = users.find(u => u._id === selectedUserId) ?? null

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError('')
    try {
      const data = await createUser(createForm)
      if (data.success) {
        setShowCreateModal(false)
        setCreateForm({ name: '', email: '', password: '', role: 'USER' })
        loadUsers()
      } else {
        setCreateError(data.message || 'Failed to create user')
      }
    } catch (err: any) {
      setCreateError(err.message || 'Error creating user')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const data = await deleteUser(userToDelete._id)
      if (data.success) {
        setUserToDelete(null)
        if (selectedUserId === userToDelete._id) setSelectedUserId(null)
        loadUsers()
      } else {
        setDeleteError(data.message || 'Failed to deactivate user')
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error deactivating user')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div style={{ display:'flex', height:'100%', position:'relative' }}>
      <div style={{ flex:1, padding:'24px', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:19, fontWeight:700, color:'#e8e0d0', margin:0 }}>User Management</h1>
            <p style={{ fontSize:12, color:'#5a6a40', margin:'4px 0 0' }}>{users.length} users found</p>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <input className="admin-input" placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:220 }}/>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ padding:'7px 14px', borderRadius:6, fontSize:12, cursor:'pointer' }}>
              + Create User
            </button>
          </div>
        </div>

        <div className="card-2" style={{ borderRadius:8, overflow:'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign:'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:20, color:'#5a6a40' }}>Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:20, color:'#5a6a40' }}>No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u._id} style={{ background: selectedUserId === u._id ? 'rgba(74,90,42,0.1)' : 'transparent' }}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#3a4a22,#2a3a18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#e8e0d0' }}>
                        {u.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#e8e0d0' }}>{u.name}</div>
                        <div style={{ fontSize:10, color:'#5a6a40', marginTop:2 }}>ID: {u._id.substring(0,8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color:'#8b9a5a' }}>
                    <div>{u.email}</div>
                  </td>
                  <td style={{ color:'#b5c070', fontWeight:600 }}>{u.role}</td>
                  <td>
                    <span className={u.isActive ? 'badge-verified' : 'badge-rejected'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ color:'#5a6a40' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign:'right' }}>
                    <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                      <button className="btn-ghost" style={{ padding:'4px 9px', borderRadius:4, fontSize:11, cursor:'pointer' }} onClick={() => { setSelectedUserId(u._id); setDrawerTab('info') }}>View</button>
                      <button className="btn-ghost" style={{ padding:'4px 9px', borderRadius:4, fontSize:11, cursor:'pointer', color:'#c87878' }} onClick={() => setUserToDelete(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUserId && selectedUser && (
        <div style={{ width:340, background:'#11140c', borderLeft:'1px solid rgba(74,90,42,0.2)', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(74,90,42,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h2 style={{ margin:0, fontSize:15, color:'#e8e0d0' }}>User Details</h2>
            <button className="btn-ghost" onClick={()=>setSelectedUserId(null)} style={{ padding:4, borderRadius:4, cursor:'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l12 12M13 1L1 13"/></svg>
            </button>
          </div>
          
          <div style={{ padding:'16px 24px', display:'flex', gap:2 }}>
            {(['info','docs'] as const).map(t => (
              <button key={t} onClick={()=>setDrawerTab(t)} style={{ flex:1, padding:'8px 0', background:drawerTab===t ? 'rgba(74,90,42,0.15)' : 'transparent', border:'none', borderBottom: drawerTab===t ? '2px solid #FF9933' : '2px solid transparent', color:drawerTab===t ? '#FF9933' : '#6a7a48', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                {t==='info'?'Information':'Documents'}
              </button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
            {drawerTab === 'info' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#3a4a22,#2a3a18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#e8e0d0', boxShadow:'0 4px 12px rgba(0,0,0,0.3)' }}>
                    {selectedUser.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#e8e0d0' }}>{selectedUser.name}</div>
                    <div style={{ fontSize:11, color:'#5a6a40', marginTop:2 }}>{selectedUser.role}</div>
                  </div>
                </div>

                <div className="card-2" style={{ padding:16, borderRadius:8 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#5a6a40', marginBottom:12, letterSpacing:'0.06em' }}>CONTACT & STATUS</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#6a7a48' }}>Email</span><span style={{ color:'#e8e0d0' }}>{selectedUser.email}</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#6a7a48' }}>Status</span><span className={selectedUser.isActive ? 'badge-verified' : 'badge-rejected'}>{selectedUser.isActive ? 'Active' : 'Inactive'}</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#6a7a48' }}>Joined</span><span style={{ color:'#e8e0d0' }}>{new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'docs' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#8b9a5a', marginBottom:12, letterSpacing:'0.06em' }}>SUBMITTED DOCUMENTS</div>
                {userDocs.length === 0 ? <p style={{ color:'#3a4a22', fontSize:12 }}>No documents found in recent list.</p> : (
                  userDocs.map(d => (
                    <div key={d._id} className="card-2" style={{ padding:12, borderRadius:6, cursor:'pointer' }} onClick={() => onReview(d)}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'#c8c0b0' }}>{d.documentType}</span>
                        <span className={d.reviewStatus==='PENDING' ? 'badge-pending' : d.reviewStatus==='APPROVED' ? 'badge-verified' : 'badge-rejected'}>{d.reviewStatus}</span>
                      </div>
                      <div style={{ fontSize:10, color:'#5a6a40' }}>{new Date(d.uploadedAt).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div className="card-1" style={{ width:400, borderRadius:8, padding:24, background:'#11140c' }}>
            <h2 style={{ margin:'0 0 16px', fontSize:16, color:'#e8e0d0' }}>Create New User</h2>
            <form onSubmit={handleCreateUser} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ display:'block', fontSize:11, color:'#6b7a40', marginBottom:4 }}>Name</label>
                <input required className="admin-input" style={{ width:'100%', boxSizing:'border-box' }} value={createForm.name} onChange={e=>setCreateForm({...createForm, name: e.target.value})} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, color:'#6b7a40', marginBottom:4 }}>Email</label>
                <input required type="email" className="admin-input" style={{ width:'100%', boxSizing:'border-box' }} value={createForm.email} onChange={e=>setCreateForm({...createForm, email: e.target.value})} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, color:'#6b7a40', marginBottom:4 }}>Password</label>
                <input required type="password" minLength={6} className="admin-input" style={{ width:'100%', boxSizing:'border-box' }} value={createForm.password} onChange={e=>setCreateForm({...createForm, password: e.target.value})} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, color:'#6b7a40', marginBottom:4 }}>Role</label>
                <select className="admin-input" style={{ width:'100%', boxSizing:'border-box', background:'#1d2113' }} value={createForm.role} onChange={e=>setCreateForm({...createForm, role: e.target.value})}>
                  <option value="USER">USER</option>
                  <option value="OFFICER">OFFICER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              {createError && <div style={{ fontSize:12, color:'#c87878', marginTop:8 }}>{createError}</div>}
              <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={()=>setShowCreateModal(false)} style={{ padding:'8px 16px', borderRadius:6 }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createLoading} style={{ padding:'8px 16px', borderRadius:6 }}>
                  {createLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div className="card-1" style={{ width:400, borderRadius:8, padding:24, background:'#11140c' }}>
            <h2 style={{ margin:'0 0 16px', fontSize:16, color:'#c87878' }}>Deactivate User</h2>
            <p style={{ fontSize:13, color:'#b8b098', margin:'0 0 16px' }}>
              Are you sure you want to deactivate the user account for <strong>{userToDelete.name}</strong> ({userToDelete.email})?
            </p>
            <p style={{ fontSize:11, color:'#5a6a40', margin:'0 0 16px' }}>
              This will disable their access to the system. It does not delete their audit trail or submitted documents.
            </p>
            {deleteError && <div style={{ fontSize:12, color:'#c87878', marginBottom:16 }}>{deleteError}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={()=>{setUserToDelete(null); setDeleteError('')}} style={{ padding:'8px 16px', borderRadius:6 }}>Cancel</button>
              <button type="button" onClick={handleDeleteUser} disabled={deleteLoading} style={{ padding:'8px 16px', borderRadius:6, background:'#c87878', color:'#fff', border:'none', cursor:'pointer' }}>
                {deleteLoading ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
