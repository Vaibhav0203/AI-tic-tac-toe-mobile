import React, { useState } from 'react';
import { useAds, AdConfig } from '../hooks/useAds';
import { motion } from 'framer-motion';

interface AdsSidebarProps {
  placement: 'left' | 'right' | 'mobile_bottom';
}

const AdBlock: React.FC<{ ad: AdConfig }> = ({ ad }) => {
  const [imgError, setImgError] = useState(false);

  // If there's no image URL at all, or the image failed to load, show the glass box
  const showFallback = !ad.imageUrl || imgError;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', width: '100%' }}>
      {/* Clickable Link Area */}
      <motion.a
        href={ad.link}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'block',
          width: '100%',
          textDecoration: 'none',
        }}
      >
        {showFallback ? (
          <div className="glass-panel" style={{
            height: ad.size === 'big' ? '250px' : '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-color)',
            fontSize: ad.size === 'big' ? '1.5rem' : '1rem',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '1rem',
            borderRadius: 'var(--radius)',
            border: '2px solid var(--board-border)'
          }}>
            {ad.name || 'Ad Space'}
          </div>
        ) : (
          <img 
            src={ad.imageUrl} 
            alt={ad.name || 'Ad'} 
            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain', borderRadius: 'var(--radius)' }} 
            onError={() => setImgError(true)}
          />
        )}
      </motion.a>
    </div>
  );
};

export const AdsSidebar: React.FC<AdsSidebarProps> = ({ placement }) => {
  const { ads, adsEnabled } = useAds();

  if (!adsEnabled) {
    // Only show inquiry banner in the bottom placement to avoid duplicating it left/right/bottom
    if (placement === 'mobile_bottom') {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.8, fontSize: '0.9rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>For Ad inquiry: <strong>nimblelemons@gmail.com</strong></div>
          <div style={{ fontStyle: 'italic' }}>Price will be discussed according to ad type and time you want ads to run.</div>
        </div>
      );
    }
    return null;
  }

  const placementAds = ads.filter(ad => ad.placement === placement);

  if (placementAds.length === 0) return null;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: placement === 'mobile_bottom' ? 'row' : 'column',
      flexWrap: placement === 'mobile_bottom' ? 'wrap' : 'nowrap',
      gap: '1rem',
      width: '100%',
      justifyContent: 'center'
    }}>
      {placementAds.map(ad => (
        <div key={ad.id} style={{ 
          width: placement === 'mobile_bottom' ? (ad.size === 'big' ? 'calc(50% - 0.5rem)' : 'calc(25% - 0.75rem)') : '100%',
          minWidth: placement === 'mobile_bottom' && ad.size === 'small' ? '120px' : 'auto'
        }}>
          <AdBlock ad={ad} />
        </div>
      ))}
    </div>
  );
};
