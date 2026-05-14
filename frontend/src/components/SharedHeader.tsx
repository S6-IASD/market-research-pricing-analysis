import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'antd';
import {
  LineChartOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      height: 64,
      background: 'rgba(2, 11, 22, 0.97)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
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
          style={{ fontSize: 20, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <LineChartOutlined style={{ color: '#4da1ff' }} />
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
                  color: isActive ? '#4da1ff' : 'rgba(255,255,255,0.65)',
                  fontWeight: isActive ? 600 : 400,
                  borderBottom: isActive ? '2px solid #4da1ff' : '2px solid transparent',
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

      {/* Auth Buttons */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {isAuthenticated ? (
          <Button
            icon={<LogoutOutlined />}
            onClick={logout}
            style={{ borderRadius: 20, borderColor: '#ff4d4f', color: '#ff4d4f', background: 'transparent' }}
          >
            Déconnexion
          </Button>
        ) : (
          <>
            <Button
              type="link"
              onClick={() => navigate('/login')}
              style={{ color: 'rgba(255,255,255,0.8)' }}
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
