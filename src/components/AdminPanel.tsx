import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { verifyAdminCredentials } from '../utils/auth';
import { useAds, AdConfig } from '../hooks/useAds';
import { 
  Lock, LogOut, Plus, Trash2, Globe, Layout, 
  Image as ImageIcon, Link as LinkIcon, Edit3, 
  Settings, Mail, Send, CheckCircle2, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { sendEmail } from '../utils/emailService';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Dashboard navigation
  const [activeTab, setActiveTab] = useState<'ads' | 'newsletter' | 'email-settings'>('ads');

  const { ads, adsEnabled, addAd, deleteAd, toggleAds } = useAds();

  // Ads Form state
  const [newAd, setNewAd] = useState<Omit<AdConfig, 'id'>>({
    placement: 'left',
    size: 'small',
    name: '',
    link: '',
    imageUrl: ''
  });

  // Newsletter states
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterBody, setNewsletterBody] = useState('');
  const [subscribedCount, setSubscribedCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastTotal, setBroadcastTotal] = useState(0);
  const [broadcastStatus, setBroadcastStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [broadcastResultText, setBroadcastResultText] = useState('');

  // EmailJS credential states
  const [serviceId, setServiceId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [settingsStatus, setSettingsStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Load subscribers count
  const loadSubscribedCount = async () => {
    setLoadingCount(true);
    try {
      const q = query(collection(db, 'users'), where('subscribedToNewsletter', '==', true));
      const snap = await getDocs(q);
      setSubscribedCount(snap.size);
    } catch (err) {
      console.error("Error loading subscribers count:", err);
    } finally {
      setLoadingCount(false);
    }
  };

  // Load EmailJS configuration
  const loadEmailSettings = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'config', 'emailjs'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setServiceId(data.serviceId || '');
        setTemplateId(data.templateId || '');
        setPublicKey(data.publicKey || '');
      }
    } catch (err) {
      console.error("Error loading email credentials:", err);
    }
  };

  // Effect to load DB dependencies when admin logs in successfully
  useEffect(() => {
    if (isAuthenticated) {
      loadSubscribedCount();
      loadEmailSettings();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await verifyAdminCredentials(username, password);
    if (isValid) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleAddAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.name || !newAd.link) return;
    addAd(newAd);
    setNewAd({ placement: 'left', size: 'small', name: '', link: '', imageUrl: '' });
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsStatus('saving');
    try {
      await setDoc(doc(db, 'config', 'emailjs'), {
        serviceId: serviceId.trim(),
        templateId: templateId.trim(),
        publicKey: publicKey.trim(),
        updatedAt: serverTimestamp()
      });
      setSettingsStatus('success');
      setTimeout(() => setSettingsStatus('idle'), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setSettingsStatus('error');
      setTimeout(() => setSettingsStatus('idle'), 4000);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterSubject || !newsletterBody) return;

    setSendingBroadcast(true);
    setBroadcastStatus('sending');
    setBroadcastProgress(0);

    try {
      // 1. Fetch subscribed users
      const q = query(collection(db, 'users'), where('subscribedToNewsletter', '==', true));
      const snap = await getDocs(q);

      if (snap.empty) {
        setBroadcastStatus('error');
        setBroadcastResultText('No subscribed users found to broadcast to.');
        setSendingBroadcast(false);
        return;
      }

      const subscribedUsers = snap.docs.map(doc => doc.data());
      setBroadcastTotal(subscribedUsers.length);

      let sentCount = 0;
      let usedMode: 'real' | 'sandbox' = 'sandbox';

      // 2. Broadcast sequentially to allow visual progressive bar and prevent browser rate limits
      for (let i = 0; i < subscribedUsers.length; i++) {
        const player = subscribedUsers[i];
        if (player.email) {
          const res = await sendEmail({
            to: player.email,
            subject: newsletterSubject,
            body: newsletterBody,
            username: player.username,
            type: 'newsletter'
          });
          if (res.success) {
            sentCount++;
          }
          usedMode = res.mode;
        }
        setBroadcastProgress(i + 1);
      }

      setBroadcastStatus('success');
      setBroadcastResultText(
        `Newsletter broadcast completed! Successfully sent ${sentCount} of ${subscribedUsers.length} emails. ` + 
        `(Delivery Mode: ${usedMode === 'real' ? 'Real EmailJS Mailers' : 'Firestore Sandbox Simulation'})`
      );
      setNewsletterSubject('');
      setNewsletterBody('');
      loadSubscribedCount(); // Refresh count
    } catch (err: any) {
      console.error("Broadcast execution error:", err);
      setBroadcastStatus('error');
      setBroadcastResultText(err.message || 'An unexpected error occurred during email dispatching.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="modal-overlay" style={overlayStyle}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel" 
          style={modalStyle}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Lock size={20} /> Admin Login
            </h2>
            <button onClick={onClose} style={closeBtnStyle}>×</button>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loginError && <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>{loginError}</div>}
            <div>
              <label style={labelStyle}>Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
            <button type="submit" className="play-button" style={{ ...submitBtnStyle, marginTop: '1rem' }}>
              Login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel" 
        style={{...modalStyle, maxWidth: '650px', width: '95%'}}
      >
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Settings size={22} /> Admin Dashboard
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => setIsAuthenticated(false)} style={{...closeBtnStyle, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
              <LogOut size={16} /> Logout
            </button>
            <button onClick={onClose} style={closeBtnStyle}>×</button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--board-border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          <button 
            onClick={() => setActiveTab('ads')} 
            style={{
              padding: '0.5rem 0.85rem',
              background: activeTab === 'ads' ? 'var(--primary-color)' : 'transparent',
              color: activeTab === 'ads' ? 'white' : 'var(--text-color)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Globe size={15} /> Ads Configuration
          </button>
          <button 
            onClick={() => setActiveTab('newsletter')} 
            style={{
              padding: '0.5rem 0.85rem',
              background: activeTab === 'newsletter' ? 'var(--primary-color)' : 'transparent',
              color: activeTab === 'newsletter' ? 'white' : 'var(--text-color)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Mail size={15} /> Newsletter Broadcast
          </button>
          <button 
            onClick={() => setActiveTab('email-settings')} 
            style={{
              padding: '0.5rem 0.85rem',
              background: activeTab === 'email-settings' ? 'var(--primary-color)' : 'transparent',
              color: activeTab === 'email-settings' ? 'white' : 'var(--text-color)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Settings size={15} /> Email Credentials
          </button>
        </div>

        {/* Tab Contents */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          
          {/* TAB 1: ADS CONFIGURATION */}
          {activeTab === 'ads' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cell-bg)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Global Ads Toggle</h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Turn ads on or off across the entire site.</p>
                </div>
                <button 
                  onClick={toggleAds}
                  style={{
                    padding: '0.5rem 1.2rem',
                    borderRadius: '20px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: adsEnabled ? '#10b981' : '#ef4444',
                    color: 'white',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {adsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div>
                <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} /> Add New Advertisement
                </h3>
                <form onSubmit={handleAddAd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--cell-bg)', padding: '1.25rem', borderRadius: 'var(--radius)' }}>
                  <div>
                    <label style={labelStyle}><Layout size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> Placement</label>
                    <select value={newAd.placement} onChange={e => setNewAd({...newAd, placement: e.target.value as any})} style={inputStyle}>
                      <option value="left">Left Sidebar (Desktop)</option>
                      <option value="right">Right Sidebar (Desktop)</option>
                      <option value="mobile_bottom">Bottom (Mobile)</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Size</label>
                    <select value={newAd.size} onChange={e => setNewAd({...newAd, size: e.target.value as any})} style={inputStyle}>
                      <option value="small">Small Box</option>
                      <option value="big">Big Box</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}><Edit3 size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> Name / Text (Displayed if no image)</label>
                    <input required type="text" value={newAd.name} onChange={e => setNewAd({...newAd, name: e.target.value})} style={inputStyle} placeholder="e.g. Play Premium Tic Tac Toe" />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}><LinkIcon size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> Target Link (URL)</label>
                    <input required type="url" value={newAd.link} onChange={e => setNewAd({...newAd, link: e.target.value})} style={inputStyle} placeholder="https://example.com" />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}><ImageIcon size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> Image URL (Optional)</label>
                    <input type="url" value={newAd.imageUrl} onChange={e => setNewAd({...newAd, imageUrl: e.target.value})} style={inputStyle} placeholder="https://example.com/image.jpg" />
                  </div>

                  <button type="submit" className="play-button" style={{ ...submitBtnStyle, gridColumn: '1 / -1' }}>
                    Add Ad
                  </button>
                </form>
              </div>

              <div>
                <h3 style={{ marginBottom: '0.75rem' }}>Configured Ads ({ads.length})</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ads.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center' }}>No ads configured.</p>}
                  {ads.map(ad => (
                    <div key={ad.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cell-bg)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{ad.name}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{ad.placement} - {ad.size}</div>
                      </div>
                      <button onClick={() => deleteAd(ad.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEWSLETTER BROADCASTER */}
          {activeTab === 'newsletter' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Stats and count summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cell-bg)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--board-border)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', opacity: 0.7 }}>Marketing Analytics</h4>
                  <h3 style={{ margin: '0.15rem 0 0 0', fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                    {subscribedCount} Subscribed Player{subscribedCount !== 1 ? 's' : ''}
                  </h3>
                </div>
                <button 
                  onClick={loadSubscribedCount} 
                  disabled={loadingCount}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--board-border)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-color)'
                  }}
                >
                  <RefreshCw size={15} className={loadingCount ? 'spin-animation' : ''} style={{ animation: loadingCount ? 'spin 1s linear infinite' : '' }} />
                </button>
              </div>

              {/* Composer Form */}
              <div>
                <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Edit3 size={18} /> Compose Newsletter Updates
                </h3>
                <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--cell-bg)', padding: '1.25rem', borderRadius: 'var(--radius)' }}>
                  <div>
                    <label style={labelStyle}>Broadcast Subject / Topic</label>
                    <input 
                      required 
                      type="text" 
                      value={newsletterSubject} 
                      onChange={e => setNewsletterSubject(e.target.value)} 
                      disabled={sendingBroadcast}
                      style={inputStyle} 
                      placeholder="e.g. Exciting New Game Modes & General Server Patches!" 
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Email Message Body (Plain Text or HTML)</label>
                    <textarea 
                      required 
                      value={newsletterBody} 
                      onChange={e => setNewsletterBody(e.target.value)} 
                      disabled={sendingBroadcast}
                      style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }} 
                      placeholder="Type details of your game patch, news, or newsletter blog post here..."
                    />
                  </div>

                  {sendingBroadcast ? (
                    /* Progress Bar Container */
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--board-border)', borderRadius: 'var(--radius)', padding: '1rem', marginTop: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        <span>📬 Mailing Players...</span>
                        <span>{Math.round((broadcastProgress / broadcastTotal) * 100)}%</span>
                      </div>
                      <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${(broadcastProgress / broadcastTotal) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))', transition: 'width 0.25s' }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.4rem', textAlign: 'center' }}>
                        Processing subscriber email {broadcastProgress} of {broadcastTotal}...
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="submit" 
                      disabled={subscribedCount === 0}
                      className="play-button" 
                      style={{ ...submitBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: subscribedCount === 0 ? 0.6 : 1 }}
                    >
                      <Send size={16} /> Send Broadcast to Subscribers
                    </button>
                  )}
                </form>
              </div>

              {/* Broadcast Result Banner */}
              {broadcastStatus !== 'idle' && broadcastStatus !== 'sending' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius)',
                  border: broadcastStatus === 'success' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                  background: broadcastStatus === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: broadcastStatus === 'success' ? '#6ee7b7' : '#fca5a5',
                  fontSize: '0.9rem',
                  lineHeight: 1.4
                }}>
                  {broadcastStatus === 'success' ? <CheckCircle2 size={20} style={{ flexShrink: 0 }} /> : <AlertTriangle size={20} style={{ flexShrink: 0 }} />}
                  <div>{broadcastResultText}</div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EMAIL CREDENTIALS (EMAILJS) */}
          {activeTab === 'email-settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Settings Form */}
              <div>
                <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Settings size={18} /> Configure EmailJS Service
                </h3>
                <form onSubmit={handleSaveEmailSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--cell-bg)', padding: '1.25rem', borderRadius: 'var(--radius)' }}>
                  <div>
                    <label style={labelStyle}>EmailJS Service ID</label>
                    <input 
                      required 
                      type="text" 
                      value={serviceId} 
                      onChange={e => setServiceId(e.target.value)} 
                      style={inputStyle} 
                      placeholder="e.g. service_g4pxr2m" 
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>EmailJS Template ID</label>
                    <input 
                      required 
                      type="text" 
                      value={templateId} 
                      onChange={e => setTemplateId(e.target.value)} 
                      style={inputStyle} 
                      placeholder="e.g. template_o68l2s5" 
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>EmailJS Public Key</label>
                    <input 
                      required 
                      type="text" 
                      value={publicKey} 
                      onChange={e => setPublicKey(e.target.value)} 
                      style={inputStyle} 
                      placeholder="e.g. u1W_k1B9g8LopX4e5" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={settingsStatus === 'saving'}
                    className="play-button" 
                    style={submitBtnStyle}
                  >
                    {settingsStatus === 'saving' ? 'Saving Config...' : settingsStatus === 'success' ? '✓ Saved Successfully!' : 'Save Credentials'}
                  </button>
                </form>
              </div>

              {/* Instructions Panel */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--board-border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.95rem' }}>
                  <AlertTriangle size={15} color="var(--primary-color)" /> EmailJS Setup Instructions
                </h4>
                <ol style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '0.45rem', lineHeight: 1.45 }}>
                  <li>Create a free developer account at <strong><a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)' }}>emailjs.com</a></strong>.</li>
                  <li>Link your official delivery mailbox (Gmail, Outlook, etc.) in the Admin panel to generate a <strong>Service ID</strong>.</li>
                  <li>Under Email Templates, construct a template using the following exact variables:
                    <ul style={{ paddingLeft: '1rem', marginTop: '0.25rem', listStyleType: 'circle' }}>
                      <li><code>{"{{to_email}}"}</code> (Recipient player address)</li>
                      <li><code>{"{{subject}}"}</code> (Mailing Subject)</li>
                      <li><code>{"{{message}}"}</code> (Email Main Text / Newsletter Body)</li>
                      <li><code>{"{{username}}"}</code> (Player's custom Username)</li>
                    </ul>
                  </li>
                  <li>Save the Template to retrieve your <strong>Template ID</strong>.</li>
                  <li>Open Account Security on EmailJS to obtain your <strong>Public Key</strong>.</li>
                  <li>Save these keys here. If keys are missing, the system will fall back automatically to the <strong>Sandbox Mode</strong>, logging all outgoing mails inside the <code>system_emails</code> Firestore collection!</li>
                </ol>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

// Inline styles for the modal
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', 
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  backdropFilter: 'blur(4px)'
};

const modalStyle: React.CSSProperties = {
  padding: '2rem', width: '90%', maxHeight: '90vh', overflowY: 'auto',
  backgroundColor: 'var(--board-bg)', borderRadius: 'var(--radius)',
  border: '1px solid var(--board-border)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
};

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-color)', opacity: 0.8
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)',
  border: '1px solid var(--board-border)', background: 'var(--cell-bg)', color: 'var(--text-color)',
  fontSize: '1rem', outline: 'none', boxSizing: 'border-box'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: '1.5rem', cursor: 'pointer'
};

const submitBtnStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--primary-color)',
  color: '#fff', fontSize: '1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer'
};

