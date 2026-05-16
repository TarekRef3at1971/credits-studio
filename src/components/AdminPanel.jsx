import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, MessageSquare, Database, LogOut, RefreshCw, Trash2, CheckCircle, XCircle, Download, Search, Shield } from 'lucide-react';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
function authHeaders() { return { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }; }

const TABS = [
  { id: 'users', label: 'ACCOUNTS', icon: Users },
  { id: 'subscriptions', label: 'SUBSCRIPTIONS', icon: CreditCard },
  { id: 'support', label: 'SUPPORT', icon: MessageSquare },
  { id: 'backup', label: 'BACKUP', icon: Database },
];

const badge = (text, color) => (
  <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.08em', background: `${color}22`, color, border: `1px solid ${color}44` }}>{text}</span>
);

export default function AdminPanel() {
  const navigate = useNavigate();
  const [adminAuthed, setAdminAuthed] = useState(() => sessionStorage.getItem('adminAuthed') === '1');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const ADMIN_USER = 'antigravity';
  const ADMIN_PASS = 'AG@Studio2025';

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (loginUser === ADMIN_USER && loginPass === ADMIN_PASS) {
      sessionStorage.setItem('adminAuthed', '1');
      setAdminAuthed(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('adminAuthed');
    setAdminAuthed(false);
  };

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        fetch(`${BASE_URL}/admin/users`, { headers: authHeaders() }),
        fetch(`${BASE_URL}/projects/all`, { headers: authHeaders() }),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (pRes.ok) setProjects(await pRes.json());
      // Support tickets — best-effort
      const tRes = await fetch(`${BASE_URL}/admin/tickets`, { headers: authHeaders() }).catch(() => null);
      if (tRes && tRes.ok) setTickets(await tRes.json());
    } catch(e) { notify('Backend offline — showing cached data'); }
    setLoading(false);
  };

  useEffect(() => {
    if (adminAuthed) fetchAll();
  }, [adminAuthed]);

  // --- Login gate ---
  if (!adminAuthed) return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #1a1a1f 0%, #050505 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(212,175,55,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Shield size={40} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', letterSpacing: '0.2em', color: 'var(--accent-gold)', margin: 0 }}>ADMIN ACCESS</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Restricted area — authorised personnel only</p>
        </div>
        {loginError && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.2rem' }}>{loginError}</div>}
        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input autoFocus value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="Username" style={{ padding: '0.9rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '0.95rem', outline: 'none' }} />
          <div style={{ position: 'relative' }}>
            <input value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Password" type={showPass ? 'text' : 'password'} style={{ width: '100%', padding: '0.9rem 3rem 0.9rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem' }}>{showPass ? '🙈' : '👁'}</button>
          </div>
          <button type="submit" style={{ padding: '0.9rem', background: 'var(--accent-gold)', color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.95rem', letterSpacing: '0.1em', cursor: 'pointer', marginTop: '0.5rem' }}>ENTER PANEL</button>
        </form>
        <button onClick={() => navigate('/dashboard')} style={{ width: '100%', marginTop: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.1em' }}>← BACK TO DASHBOARD</button>
      </div>
    </div>
  );

  const deleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user and all their projects?')) return;
    await fetch(`${BASE_URL}/admin/users/${id}`, { method: 'DELETE', headers: authHeaders() });
    notify('User deleted'); fetchAll();
  };

  const toggleSub = async (id, current) => {
    await fetch(`${BASE_URL}/admin/users/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ subscription_status: current === 'active' ? 'inactive' : 'active' }) });
    notify('Subscription updated'); fetchAll();
  };

  const closeTicket = async (id) => {
    await fetch(`${BASE_URL}/admin/tickets/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status: 'closed' }) });
    notify('Ticket closed'); fetchAll();
  };

  const backupAll = () => {
    const blob = new Blob([JSON.stringify({ users, projects, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `credits_studio_backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
    notify('Backup downloaded!');
  };

  const filtered = users.filter(u => !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const cell = { padding: '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'white', verticalAlign: 'middle' };
  const th = { padding: '0.7rem 1rem', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--accent-gold)', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(212,175,55,0.2)', textAlign: 'left' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'white', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(212,175,55,0.2)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Shield size={22} color="var(--accent-gold)" />
        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '0.2em', color: 'var(--accent-gold)' }}>ADMIN PANEL</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={fetchAll} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}><RefreshCw size={14} /> REFRESH</button>
          <button onClick={handleAdminLogout} style={{ background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '6px' }}><LogOut size={14} /> LOCK PANEL</button>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}><LogOut size={14} /> DASHBOARD</button>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1.5rem', background: tab === t.id ? 'rgba(212,175,55,0.1)' : 'transparent', border: 'none', borderLeft: tab === t.id ? '3px solid var(--accent-gold)' : '3px solid transparent', color: tab === t.id ? 'var(--accent-gold)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem', letterSpacing: '0.12em', fontWeight: tab === t.id ? 'bold' : 'normal', textAlign: 'left', width: '100%' }}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
          <div style={{ marginTop: 'auto', padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>TOTAL USERS</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{users.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>ACTIVE SUBS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>{users.filter(u => u.subscription_status === 'active').length}</div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ padding: '2rem', overflowY: 'auto' }}>

          {/* ACCOUNTS TAB */}
          {tab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', letterSpacing: '0.15em' }}>USER ACCOUNTS</h2>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." style={{ padding: '0.5rem 0.8rem 0.5rem 2.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.85rem', outline: 'none', width: '220px' }} />
                </div>
              </div>
              {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading...</div> : (
                <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                      {['#', 'USERNAME', 'EMAIL', 'STATUS', 'PROJECTS', 'JOINED', 'ACTIONS'].map(h => <th key={h} style={th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={7} style={{ ...cell, textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>No users found</td></tr>
                      ) : filtered.map((u, i) => (
                        <tr key={u.id} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ ...cell, color: 'var(--text-secondary)' }}>{i + 1}</td>
                          <td style={cell}><strong>{u.username || '—'}</strong>{u.is_admin && <span style={{ marginLeft: '6px', fontSize: '0.6rem', color: 'var(--accent-gold)' }}>ADMIN</span>}</td>
                          <td style={{ ...cell, color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td style={cell}>{badge(u.subscription_status === 'active' ? 'ACTIVE' : 'INACTIVE', u.subscription_status === 'active' ? '#4ade80' : '#f87171')}</td>
                          <td style={{ ...cell, color: 'var(--text-secondary)' }}>{projects.filter(p => p.user_id === u.id).length}</td>
                          <td style={{ ...cell, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                          <td style={cell}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => toggleSub(u.id, u.subscription_status)} title="Toggle subscription" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: u.subscription_status === 'active' ? '#f87171' : '#4ade80', padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                                {u.subscription_status === 'active' ? 'DEACTIVATE' : 'ACTIVATE'}
                              </button>
                              {!u.is_admin && <button onClick={() => deleteUser(u.id)} style={{ background: 'transparent', border: '1px solid #f8717144', color: '#f87171', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={12} /></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SUBSCRIPTIONS TAB */}
          {tab === 'subscriptions' && (
            <div>
              <h2 style={{ fontSize: '1.3rem', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>SUBSCRIPTIONS</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Active', value: users.filter(u => u.subscription_status === 'active').length, color: '#4ade80' },
                  { label: 'Inactive', value: users.filter(u => u.subscription_status !== 'active').length, color: '#f87171' },
                  { label: 'Total Revenue Est.', value: `$${users.filter(u => u.subscription_status === 'active').length * 29}/mo`, color: 'var(--accent-gold)' },
                ].map(s => (
                  <div key={s.label} className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['USER', 'EMAIL', 'STATUS', 'JOINED', 'MANAGE'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={cell}>{u.username}</td>
                        <td style={{ ...cell, color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={cell}>{badge(u.subscription_status === 'active' ? 'ACTIVE' : 'INACTIVE', u.subscription_status === 'active' ? '#4ade80' : '#f87171')}</td>
                        <td style={{ ...cell, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                        <td style={cell}>
                          <button onClick={() => toggleSub(u.id, u.subscription_status)} style={{ background: 'transparent', border: `1px solid ${u.subscription_status === 'active' ? '#f8717144' : '#4ade8044'}`, color: u.subscription_status === 'active' ? '#f87171' : '#4ade80', padding: '0.25rem 0.7rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem' }}>
                            {u.subscription_status === 'active' ? 'REVOKE' : 'GRANT'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUPPORT TAB */}
          {tab === 'support' && (
            <div>
              <h2 style={{ fontSize: '1.3rem', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>SUPPORT TICKETS</h2>
              {tickets.length === 0 ? (
                <div className="glass" style={{ padding: '4rem', borderRadius: '12px', textAlign: 'center' }}>
                  <CheckCircle size={48} color="#4ade80" style={{ marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>No open support tickets</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Tickets will appear here when users submit support requests via the backend.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {tickets.map(t => (
                    <div key={t.id} className="glass" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: `3px solid ${t.status === 'open' ? 'var(--accent-gold)' : '#4ade80'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.4rem' }}>{t.subject}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{t.user_email} · {new Date(t.created_at).toLocaleString()}</div>
                          <div style={{ color: 'white', fontSize: '0.9rem' }}>{t.message}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }}>
                          {badge(t.status.toUpperCase(), t.status === 'open' ? 'var(--accent-gold)' : '#4ade80')}
                          {t.status === 'open' && <button onClick={() => closeTicket(t.id)} style={{ background: 'transparent', border: '1px solid #4ade8044', color: '#4ade80', padding: '0.25rem 0.7rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem' }}>CLOSE</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BACKUP TAB */}
          {tab === 'backup' && (
            <div>
              <h2 style={{ fontSize: '1.3rem', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>DATA BACKUP</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '2rem', borderRadius: '12px' }}>
                  <Database size={32} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ letterSpacing: '0.1em', marginBottom: '0.5rem' }}>FULL BACKUP</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>Downloads a complete JSON backup of all users and all project data. Store securely.</p>
                  <button onClick={backupAll} style={{ background: 'var(--accent-gold)', color: 'black', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16} /> DOWNLOAD BACKUP</button>
                </div>
                <div className="glass" style={{ padding: '2rem', borderRadius: '12px' }}>
                  <Users size={32} color="#31A8FF" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ letterSpacing: '0.1em', marginBottom: '0.5rem' }}>USERS ONLY</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>Downloads a JSON file containing only user account data, without project content.</p>
                  <button onClick={() => {
                    const blob = new Blob([JSON.stringify({ users, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                    a.download = `users_backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
                    notify('Users backup downloaded!');
                  }} style={{ background: '#31A8FF', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16} /> DOWNLOAD USERS</button>
                </div>
                <div className="glass" style={{ padding: '2rem', borderRadius: '12px', gridColumn: '1/-1' }}>
                  <h3 style={{ letterSpacing: '0.1em', marginBottom: '1rem' }}>BACKUP SUMMARY</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
                    {[
                      { label: 'Total Users', value: users.length },
                      { label: 'Total Projects', value: projects.length },
                      { label: 'Active Subs', value: users.filter(u=>u.subscription_status==='active').length },
                      { label: 'Open Tickets', value: tickets.filter(t=>t.status==='open').length },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{s.label.toUpperCase()}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#1a1a2e', border: '1px solid var(--accent-gold)', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem', zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
