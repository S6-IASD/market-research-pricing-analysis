import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, theme } from 'antd';
import {
  LineChartOutlined,
  UserOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../assets/homepage.css';

const NAV_LINKS = [
  { label: 'Accueil', path: '/' },
  { label: 'Données', path: '/produits' },
  { label: 'Analyse', path: '/analyse' },
  { label: 'À propos', path: '/about' },
];

const SharedHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { token } = theme.useToken();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      height: 64,
      background: isDarkMode ? 'rgba(2, 11, 22, 0.97)' : 'rgba(255, 255, 255, 0.97)',
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
        <div
          onClick={() => navigate('/')}
          style={{ fontSize: 20, fontWeight: 800, color: token.colorTextHeading, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <LineChartOutlined style={{ color: token.colorPrimary }} />
          MarketMetrics
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 4 }}>
          {NAV_LINKS.map(({ label, path }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <Button
                key={path}
                type="text"
                onClick={() => navigate(path)}
                style={{
                  color: isActive ? token.colorPrimary : token.colorTextSecondary,
                  fontWeight: isActive ? 600 : 400,
                  borderBottom: isActive ? `2px solid ${token.colorPrimary}` : '2px solid transparent',
                  borderRadius: 0,
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button
          type="text"
          shape="circle"
          style={{ border: `1px solid ${token.colorBorder}`, color: token.colorText }}
          icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleDarkMode}
        />
        {isAuthenticated ? (
          <Button
            icon={<LogoutOutlined />}
            onClick={logout}
            style={{ borderRadius: 20, borderColor: token.colorError, color: token.colorError, background: 'transparent' }}
          >
            Déconnexion
          </Button>
        ) : (
          <>
            <Button
              type="link"
              onClick={() => navigate('/login')}
              style={{ color: token.colorText }}
            >
              Connexion
            </Button>
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={() => navigate('/register')}
              style={{ borderRadius: 20 }}
            >
              S'inscrire
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default SharedHeader;
