import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { verifyAdminCredentials } from '../utils/auth';
import { useAds, AdConfig } from '../hooks/useAds';
import { Lock, LogOut, Plus, Trash2, Globe, Layout, Image as ImageIcon, Link as LinkIcon, Edit3 } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const { ads, adsEnabled, addAd, deleteAd, toggleAds } = useAds();

  // Form state
  const [newAd, setNewAd] = useState<Omit<AdConfig, 'id'>>({
    placement: 'left',
    size: 'small',
    name: '',
    link: '',
    imageUrl: ''
  });

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
        style={{...modalStyle, maxWidth: '600px', width: '90%'}}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--board-border)', paddingBottom: '1rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Globe size={20} /> Ads Configuration
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => setIsAuthenticated(false)} style={{...closeBtnStyle, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
              <LogOut size={16} /> Logout
            </button>
            <button onClick={onClose} style={closeBtnStyle}>×</button>
          </div>
        </div>

        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cell-bg)', padding: '1rem', borderRadius: 'var(--radius)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Global Ads Toggle</h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Turn ads on or off across the entire site.</p>
          </div>
          <button 
            onClick={toggleAds}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              background: adsEnabled ? '#10b981' : '#ef4444',
              color: 'white'
            }}
          >
            {adsEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Add New Ad Form */}
          <div>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Add New Advertisement
            </h3>
            <form onSubmit={handleAddAd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--cell-bg)', padding: '1rem', borderRadius: 'var(--radius)' }}>
              
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
                <input required type="text" value={newAd.name} onChange={e => setNewAd({...newAd, name: e.target.value})} style={inputStyle} placeholder="e.g. Download 1080p" />
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

          {/* Existing Ads List */}
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Configured Ads ({ads.length})</h3>
            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
  padding: '2rem', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto',
  backgroundColor: 'var(--board-bg)'
};

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-color)', opacity: 0.8
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)',
  border: '1px solid var(--board-border)', background: 'var(--cell-bg)', color: 'var(--text-color)',
  fontSize: '1rem', outline: 'none'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: '1.5rem', cursor: 'pointer'
};

const submitBtnStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--primary-color)',
  color: '#fff', fontSize: '1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer'
};
