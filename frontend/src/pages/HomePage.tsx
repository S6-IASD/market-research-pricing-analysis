import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-components';
import { Input, Checkbox, Button, Card, Row, Col, Typography, ConfigProvider, theme } from 'antd';
import {
  ShoppingOutlined,
  GlobalOutlined,
  LineChartOutlined,
  RadarChartOutlined,
  WarningOutlined,
  RocketOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  CodeOutlined,
  DatabaseOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import '../assets/homepage.css';
import heroBg from '../assets/hero-bg.png';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { isAuthenticated, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [platforms, setPlatforms] = useState(['jumia', 'aliexpress', 'ebay']);
  const [deepSearch, setDeepSearch] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const params = new URLSearchParams({ q: searchQuery.trim() });
      if (deepSearch) params.set('deep', '1');
      navigate(`/produits?${params.toString()}`);
    }
  };

  const platformOptions = [
    { label: 'Jumia', value: 'jumia' },
    { label: 'AliExpress', value: 'aliexpress' },
    { label: 'eBay', value: 'ebay' },
  ];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const headerRender = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 32px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
          <LineChartOutlined style={{ color: '#4da1ff' }} /> MarketMetrics
        </div>
        <nav style={{ display: 'flex', gap: '8px', height: '100%', alignItems: 'center' }}>
          <Button type="text" className="nav-link active" onClick={() => navigate('/')}>Accueil</Button>
          <Button type="text" className="nav-link" onClick={() => navigate('/produits')}>Données</Button>
          <Button type="text" className="nav-link" onClick={() => navigate('/analyse')}>Analyse</Button>
          <Button type="text" className="nav-link" onClick={() => navigate('/about')}>À propos</Button>
        </nav>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Button
          type="text"
          shape="circle"
          style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
          icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleDarkMode}
        />
        {isAuthenticated ? (
          <Button className="header-btn-logout" icon={<LogoutOutlined />} onClick={logout}>Déconnexion</Button>
        ) : (
          <>
            <Button type="link" style={{ color: 'rgba(255,255,255,0.85)' }} onClick={() => navigate('/login')}>Connexion</Button>
            <Button type="primary" icon={<UserOutlined />} onClick={() => navigate('/register')} style={{ borderRadius: 20 }}>S'inscrire</Button>
          </>
        )}
      </div>
    </div>
  );

  const teamMembers = [
    {
      name: 'Salmae EL ANGUI',
      role: 'Scraping & Extraction',
      desc: 'Développement des araignées de scraping distribuées pour extraire les données depuis Jumia, AliExpress et eBay.',
      icon: <ApiOutlined />,
      color: '#4da1ff',
    },
    {
      name: 'Othmane Boulaarab',
      role: 'Data Mining',
      desc: "Implémentation des algorithmes de Clustering K-Means et de détection d'anomalies avec Isolation Forest.",
      icon: <DatabaseOutlined />,
      color: '#a261ff',
    },
    {
      name: 'Abderrahim Aamirro',
      role: 'Frontend & UI/UX',
      desc: 'Création du Dashboard interactif, intégration des visualisations Recharts et du design moderne Ant Design.',
      icon: <CodeOutlined />,
      color: '#52c41a',
    },
    {
      name: 'Kamal Bousebbat',
      role: 'Backend & Architecture',
      desc: 'Logique applicative globale, combinaison des services (Celery, PostgreSQL), API REST et architecture Django.',
      icon: <TeamOutlined />,
      color: '#faad14',
    },
  ];

  return (
    <ConfigProvider theme={{ algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <ProLayout
        layout="top"
        title="MarketMetrics"
        logo={null}
        fixedHeader
        headerRender={headerRender}
        contentStyle={{ padding: 0, margin: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#020b16' }}
        token={{
          header: {
            colorBgHeader: 'rgba(2, 11, 22, 0.97)',
            colorHeaderTitle: '#fff',
            heightLayoutHeader: 72,
            colorTextMenu: '#fff',
          },
        }}
      >
        {/* ── HERO — full-width ── */}
        <section style={{
          minHeight: 620,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '100px 24px 80px',
          backgroundImage: `linear-gradient(to bottom, rgba(2,11,22,0.25) 0%, rgba(2,11,22,0.75) 65%, rgba(2,11,22,1) 100%), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}>
          <div style={{ maxWidth: 760, width: '100%', margin: '0 auto' }}>
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Title style={{ fontSize: '58px', marginBottom: 0, color: '#fff', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.15 }}>
                Analysez les prix du marché
              </Title>
              <Title style={{ fontSize: '58px', marginTop: 0, marginBottom: 24, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.15 }}>
                <span className="hero-gradient-text">en temps réel</span>
              </Title>
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            >
              <Paragraph style={{ fontSize: '18px', marginBottom: 48, color: 'rgba(255,255,255,0.75)' }}>
                Collecte automatique • Data Mining • Visualisation intelligente
              </Paragraph>
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
            >
              <div className="search-container">
                <Input
                  className="search-input"
                  placeholder="Ex: Laptop Gaming, iPhone 15..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onPressEnter={handleSearch}
                  prefix={<div style={{ padding: '0 8px', color: 'rgba(255,255,255,0.4)' }}>🔍</div>}
                />
                <Button type="primary" className="search-btn" onClick={handleSearch}>
                  Rechercher →
                </Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Checkbox.Group
                  className="custom-checkbox-group"
                  options={platformOptions}
                  value={platforms}
                  onChange={(list) => setPlatforms(list as string[])}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 16px', borderRadius: 20, background: deepSearch ? 'rgba(77,161,255,0.15)' : 'rgba(255,255,255,0.06)', border: deepSearch ? '1px solid rgba(77,161,255,0.5)' : '1px solid rgba(255,255,255,0.12)', transition: 'all 0.2s' }}>
                  <Checkbox checked={deepSearch} onChange={e => setDeepSearch(e.target.checked)} />
                  <span style={{ color: deepSearch ? '#4da1ff' : 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 500 }}>🔄 Deep Search <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>(scraping live)</span></span>
                </label>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── REMAINING CONTENT — 1200px container ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 24px', flex: 1 }}>

          {/* STATS ROW */}
          <section style={{ marginBottom: 64 }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="stat-card" bodyStyle={{ padding: 0 }}>
                  <div className="stat-icon-wrapper" style={{ border: '2px solid #1677ff' }}>
                    <ShoppingOutlined style={{ color: '#1677ff' }} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-title">Produits analysés</div>
                    <div className="stat-value">{(12847).toLocaleString()}</div>
                    <div className="stat-change positive">+12.5% ce mois ↗</div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="stat-card" bodyStyle={{ padding: 0 }}>
                  <div className="stat-icon-wrapper" style={{ border: '2px solid #52c41a' }}>
                    <GlobalOutlined style={{ color: '#52c41a' }} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-title">Plateformes</div>
                    <div className="stat-value">3</div>
                    <div className="stat-change" style={{ color: 'rgba(255,255,255,0.45)' }}>Jumia · AliExpress · eBay</div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="stat-card" bodyStyle={{ padding: 0 }}>
                  <div className="stat-icon-wrapper" style={{ border: '2px solid #722ed1' }}>
                    <LineChartOutlined style={{ color: '#722ed1' }} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-title">Prix surveillés</div>
                    <div className="stat-value">{(3240).toLocaleString()}</div>
                    <div className="stat-change positive">+8.3% ce mois ↗</div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="stat-card" bodyStyle={{ padding: 0 }}>
                  <div className="stat-icon-wrapper" style={{ border: '2px solid #ff4d4f' }}>
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-title">Anomalies détectées</div>
                    <div className="stat-value">128</div>
                    <div className="stat-change negative">-3.1% ce mois ↘</div>
                  </div>
                </Card>
              </Col>
            </Row>
          </section>

          {/* FEATURES SECTION */}
          <motion.section
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: 80 }}
          >
            <Title level={2} style={{ textAlign: 'center', marginBottom: 40, color: '#fff' }}>Technologies intégrées</Title>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <Card
                  hoverable
                  bordered={false}
                  style={{ height: '100%', transition: 'transform 0.3s', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  styles={{ body: { padding: 32, textAlign: 'center' } }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <RadarChartOutlined style={{ fontSize: 48, color: '#4096ff', marginBottom: 24 }} />
                  <Title level={4} style={{ color: '#fff' }}>Clustering intelligent</Title>
                  <Paragraph style={{ color: 'rgba(255,255,255,0.65)' }}>
                    Segmentation automatique des offres par gammes de prix en utilisant l'algorithme K-Means.
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  hoverable
                  bordered={false}
                  style={{ height: '100%', transition: 'transform 0.3s', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  styles={{ body: { padding: 32, textAlign: 'center' } }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <WarningOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 24 }} />
                  <Title level={4} style={{ color: '#fff' }}>Détection d'anomalies</Title>
                  <Paragraph style={{ color: 'rgba(255,255,255,0.65)' }}>
                    Identification des prix suspects grâce au modèle de Machine Learning Isolation Forest.
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  hoverable
                  bordered={false}
                  style={{ height: '100%', transition: 'transform 0.3s', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  styles={{ body: { padding: 32, textAlign: 'center' } }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <RocketOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 24 }} />
                  <Title level={4} style={{ color: '#fff' }}>Résultats instantanés</Title>
                  <Paragraph style={{ color: 'rgba(255,255,255,0.65)' }}>
                    Pipeline asynchrone avec Celery et PostgreSQL pour une recherche multi-plateforme rapide.
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </motion.section>

          {/* TEAM SECTION */}
          <motion.section
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: 60 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <Title level={2} style={{ color: '#fff', marginBottom: 12 }}>Équipe du Projet</Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, maxWidth: 560, margin: '0 auto' }}>
                Conçu et développé par une équipe passionnée d'étudiants en Data Science et Ingénierie logicielle.
              </Paragraph>
            </div>

            <Row gutter={[24, 24]}>
              {teamMembers.map((member, idx) => (
                <Col xs={24} sm={12} md={6} key={idx}>
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    whileHover={{ y: -6 }}
                  >
                    <Card
                      bordered={false}
                      style={{
                        height: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${member.color}30`,
                        borderTop: `3px solid ${member.color}`,
                      }}
                      bodyStyle={{ padding: 24 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: '50%',
                          background: `${member.color}20`,
                          border: `2px solid ${member.color}`,
                          display: 'flex', justifyContent: 'center', alignItems: 'center',
                          fontSize: 20, color: member.color, flexShrink: 0,
                        }}>
                          {member.icon}
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{member.name}</div>
                          <div style={{ color: member.color, fontSize: 12, fontWeight: 500, marginTop: 2 }}>{member.role}</div>
                        </div>
                      </div>
                      <Paragraph style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                        {member.desc}
                      </Paragraph>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.section>

        </div>
      </ProLayout>
    </ConfigProvider>
  );
};

export default HomePage;
