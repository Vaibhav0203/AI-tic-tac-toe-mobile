import React from 'react';
import { Palette, Gamepad2, Moon, Sparkles, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export type ThemeName = 'zen' | 'neon' | 'glass' | 'retro' | 'cosmic';

interface ThemeSwitcherProps {
  currentTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
}

const themes: { name: ThemeName; icon: React.FC<any>; label: string }[] = [
  { name: 'zen', icon: Palette, label: 'Zen' },
  { name: 'neon', icon: Cpu, label: 'Neon' },
  { name: 'glass', icon: Sparkles, label: 'Glass' },
  { name: 'retro', icon: Gamepad2, label: 'Retro' },
  { name: 'cosmic', icon: Moon, label: 'Cosmic' },
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange }) => {
  return (
    <div className="theme-switcher-container">
      {themes.map((theme) => {
        const Icon = theme.icon;
        const isActive = currentTheme === theme.name;
        
        return (
          <motion.button
            key={theme.name}
            onClick={() => onThemeChange(theme.name)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`glass-panel`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              border: isActive ? '2px solid var(--primary-color)' : '1px solid var(--board-border)',
              background: isActive ? 'var(--cell-hover)' : 'var(--cell-bg)',
              color: isActive ? 'var(--primary-color)' : 'var(--text-color)',
              opacity: isActive ? 1 : 0.7,
              transition: 'all 0.3s ease',
            }}
          >
            <Icon size={20} style={{ marginBottom: '4px' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{theme.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};
