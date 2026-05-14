import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Button, Tag, Divider } from 'antd';
import {
  ApiOutlined,
  DatabaseOutlined,
  CodeOutlined,
  TeamOutlined,
  RocketOutlined,
  RadarChartOutlined,
  GithubOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import '../assets/homepage.css';
import SharedHeader from '../components/SharedHeader';

const { Title, Paragraph, Text } = Typography;

/* ─── Animation variants ─────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' } as const,
  transition: { duration: 0.55, delay } as const,
});

/* ─── Data ───────────────────────────────────────────── */
const teamMembers = [
  {
    name: 'Salmae EL ANGUI',
    role: 'Scraping & Extraction',
    color: '#4da1ff',
    icon: <ApiOutlined />,
    responsibilities: [
      'Développement des scrapers pour Jumia, AliExpress et eBay',
      'Gestion des sessions Playwright et BeautifulSoup',
      'Normalisation et nettoyage des données brutes',
      'Pipeline de persistance vers PostgreSQL via Django ORM',
    ],
    tags: ['Python', 'Playwright', 'BeautifulSoup', 'Celery'],
  },
  {
    name: 'Othmane Boulaarab',
    role: 'Data Mining & ML',
    color: '#a261ff',
    icon: <DatabaseOutlined />,
    responsibilities: [
      "Algorithme de clustering K-Means pour la segmentation des prix",
      "Détection d'anomalies avec Isolation Forest (Scikit-Learn)",
      'Calcul des statistiques descriptives (médiane, Q1, Q3, écart-type)',
      'Exposition des résultats via API REST',
    ],
    tags: ['Scikit-Learn', 'K-Means', 'Isolation Forest', 'Pandas'],
  },
  {
    name: 'Abderrahim Aamirro',
    role: 'Frontend & UI/UX',
    color: '#52c41a',
    icon: <CodeOutlined />,
    responsibilities: [
      'Dashboard interactif avec React + TypeScript + Ant Design Pro',
      'Visualisations de données avec Recharts (barres, camembert, boxplot)',
      'Intégration du système d\'authentification JWT',
      'Design responsive et animations Framer Motion',
    ],
    tags: ['React', 'TypeScript', 'Ant Design', 'Recharts', 'Framer Motion'],
  },
  {
    name: 'Kamal Bousebbat',
    role: 'Backend & Architecture',
    color: '#faad14',
    icon: <TeamOutlined />,
    responsibilities: [
      'Architecture Django REST Framework et gestion des modèles',
      'Intégration Celery + Redis pour le pipeline asynchrone',
      'Authentification JWT (SimpleJWT) et gestion des permissions',
      'Orchestration des 3 modules (Scraping, ML, Frontend)',
    ],
    tags: ['Django', 'DRF', 'Celery', 'Redis', 'PostgreSQL'],
  },
];

const techStack = [
  { category: 'Scraping', icon: <ApiOutlined />, color: '#4da1ff', items: ['Python', 'Playwright', 'BeautifulSoup', 'Celery', 'Redis'] },
  { category: 'Data Mining', icon: <RadarChartOutlined />, color: '#a261ff', items: ['Scikit-Learn', 'Pandas', 'NumPy', 'K-Means', 'Isolation Forest'] },
  { category: 'Backend', icon: <RocketOutlined />, color: '#faad14', items: ['Django', 'DRF', 'SimpleJWT', 'PostgreSQL', 'Docker'] },
  { category: 'Frontend', icon: <BarChartOutlined />, color: '#52c41a', items: ['React 18', 'TypeScript', 'Ant Design Pro', 'Recharts', 'Framer Motion'] },
];

const projectSteps = [
  { step: '01', title: 'Scraping Multi-Plateforme', desc: 'Extraction automatique des offres produits depuis Jumia, AliExpress et eBay en utilisant Playwright (JS rendering) et BeautifulSoup, orchestrée par Celery.', icon: <ApiOutlined />, color: '#4da1ff' },
  { step: '02', title: 'Traitement & Analyse', desc: 'Nettoyage, normalisation et analyse des prix via K-Means (segmentation en 3 gammes) et Isolation Forest (détection d\'anomalies). Statistiques descriptives calculées en temps réel.', icon: <BulbOutlined />, color: '#a261ff' },
  { step: '03', title: 'Visualisation Dashboard', desc: 'Affichage interactif des résultats : distribution des prix, répartition des clusters, liste des anomalies, et recommandation de la meilleure offre.', icon: <BarChartOutlined />, color: '#52c41a' },
];

/* ─── Component ──────────────────────────────────────── */
const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#020b16', color: '#fff' }}>
      <SharedHeader />

      {/* ── HERO BANNER ── */}
      <motion.div {...fadeUp()} style={{
        textAlign: 'center', padding: '120px 24px 60px',
        background: 'linear-gradient(180deg, rgba(77,161,255,0.08) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <Tag color="blue" style={{ marginBottom: 20, fontSize: 13, padding: '4px 16px', borderRadius: 20 }}>
          Projet Data Mining — 2025/2026
        </Tag>
        <Title style={{ fontSize: 52, color: '#fff', fontWeight: 800, marginBottom: 16, letterSpacing: '-1px' }}>
          À propos de{' '}
          <span className="hero-gradient-text">MarketMetrics</span>
        </Title>
        <Paragraph style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', maxWidth: 680, margin: '0 auto 40px' }}>
          Une plateforme de veille tarifaire intelligente combinant scraping web, data mining et visualisation
          interactive pour analyser les prix en temps réel sur les marchés e-commerce.
        </Paragraph>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {['K-Means Clustering', 'Isolation Forest', 'Scraping Multi-plateforme', 'Django REST', 'React Dashboard'].map(t => (
            <Tag key={t} style={{ background: 'rgba(77,161,255,0.12)', borderColor: 'rgba(77,161,255,0.3)', color: '#4da1ff', borderRadius: 16, padding: '4px 14px' }}>{t}</Tag>
          ))}
        </div>
      </motion.div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px' }}>

        {/* ── PROJECT OVERVIEW ── */}
        <motion.div {...fadeUp()} style={{ marginBottom: 80 }}>
          <Row gutter={[40, 40]} align="middle">
            <Col xs={24} lg={12}>
              <Title level={2} style={{ color: '#fff', marginBottom: 20 }}>
                <BulbOutlined style={{ color: '#4da1ff', marginRight: 12 }} />
                Objectif du Projet
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>
                MarketMetrics est une application de <strong style={{ color: '#4da1ff' }}>Market Research & Price Analysis</strong> développée
                dans le cadre d'un projet académique en Data Mining. Elle permet de collecter automatiquement des
                offres de produits sur plusieurs marketplaces et d'appliquer des algorithmes de Machine Learning
                pour analyser les tendances de prix.
              </Paragraph>
              <Paragraph style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.8 }}>
                L'objectif principal est de fournir aux consommateurs et aux entreprises une vision claire du marché :
                identifier les prix anormaux, segmenter les offres par gamme de prix, et recommander les meilleures opportunités d'achat.
              </Paragraph>
            </Col>
            <Col xs={24} lg={12}>
              <Row gutter={[16, 16]}>
                {[
                  { label: 'Plateformes scrapées', value: '3', sub: 'Jumia · AliExpress · eBay', color: '#4da1ff' },
                  { label: 'Algorithmes ML', value: '2', sub: 'K-Means + Isolation Forest', color: '#a261ff' },
                  { label: 'Produits indexés', value: '12K+', sub: 'En base de données', color: '#52c41a' },
                  { label: 'Membres équipe', value: '4', sub: 'Étudiants ingénieurs', color: '#faad14' },
                ].map((item, i) => (
                  <Col xs={12} key={i}>
                    <Card bordered={false} className="stat-card" bodyStyle={{ padding: 20 }}>
                      <div style={{ fontSize: 36, fontWeight: 800, color: item.color }}>{item.value}</div>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{item.sub}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </motion.div>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '0 0 80px' }} />

        {/* ── HOW IT WORKS ── */}
        <motion.div {...fadeUp()} style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <Title level={2} style={{ color: '#fff', marginBottom: 12 }}>Comment ça fonctionne ?</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
              Un pipeline de bout en bout de la collecte à la visualisation.
            </Paragraph>
          </div>
          <Row gutter={[24, 24]}>
            {projectSteps.map((step, idx) => (
              <Col xs={24} md={8} key={idx}>
                <motion.div {...fadeUp(idx * 0.1)}>
                  <Card bordered={false} style={{
                    height: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${step.color}25`,
                    borderTop: `3px solid ${step.color}`,
                    borderRadius: 16,
                  }} bodyStyle={{ padding: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <div style={{
                        fontSize: 42, fontWeight: 900, color: `${step.color}30`,
                        lineHeight: 1, fontFamily: 'monospace',
                      }}>{step.step}</div>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: `${step.color}15`, border: `2px solid ${step.color}`,
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        fontSize: 20, color: step.color,
                      }}>{step.icon}</div>
                    </div>
                    <Title level={4} style={{ color: '#fff', marginBottom: 12 }}>{step.title}</Title>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>{step.desc}</Paragraph>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '0 0 80px' }} />

        {/* ── TECH STACK ── */}
        <motion.div {...fadeUp()} style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Title level={2} style={{ color: '#fff', marginBottom: 12 }}>Stack Technologique</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
              Des outils modernes et éprouvés pour chaque couche du système.
            </Paragraph>
          </div>
          <Row gutter={[24, 24]}>
            {techStack.map((tech, idx) => (
              <Col xs={24} sm={12} md={6} key={idx}>
                <motion.div {...fadeUp(idx * 0.08)}>
                  <Card bordered={false} style={{
                    height: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${tech.color}20`,
                    borderRadius: 14,
                  }} bodyStyle={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: `${tech.color}18`, border: `1.5px solid ${tech.color}`,
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        fontSize: 18, color: tech.color,
                      }}>{tech.icon}</div>
                      <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{tech.category}</Text>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {tech.items.map(item => (
                        <Tag key={item} style={{
                          background: `${tech.color}12`,
                          borderColor: `${tech.color}35`,
                          color: tech.color,
                          borderRadius: 20, fontSize: 12,
                          padding: '2px 10px', margin: 0,
                        }}>{item}</Tag>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '0 0 80px' }} />

        {/* ── TEAM ── */}
        <motion.div {...fadeUp()} style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <Title level={2} style={{ color: '#fff', marginBottom: 12 }}>L'Équipe</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, maxWidth: 540, margin: '0 auto' }}>
              Quatre étudiants, quatre expertises complémentaires, un seul projet.
            </Paragraph>
          </div>
          <Row gutter={[24, 24]}>
            {teamMembers.map((member, idx) => (
              <Col xs={24} sm={12} key={idx}>
                <motion.div {...fadeUp(idx * 0.1)} whileHover={{ y: -4 }}>
                  <Card bordered={false} style={{
                    height: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${member.color}25`,
                    borderLeft: `4px solid ${member.color}`,
                    borderRadius: 14,
                  }} bodyStyle={{ padding: 28 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: `${member.color}18`, border: `2px solid ${member.color}`,
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        fontSize: 22, color: member.color, flexShrink: 0,
                      }}>{member.icon}</div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>{member.name}</div>
                        <div style={{ color: member.color, fontSize: 13, fontWeight: 500, marginTop: 3 }}>{member.role}</div>
                      </div>
                    </div>

                    {/* Responsibilities */}
                    <div style={{ marginBottom: 20 }}>
                      {member.responsibilities.map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                          <CheckCircleOutlined style={{ color: member.color, fontSize: 13, marginTop: 3, flexShrink: 0 }} />
                          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6 }}>{r}</Text>
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {member.tags.map(tag => (
                        <Tag key={tag} style={{
                          background: `${member.color}12`,
                          borderColor: `${member.color}35`,
                          color: member.color,
                          borderRadius: 16, fontSize: 11,
                          padding: '1px 10px', margin: 0,
                        }}>{tag}</Tag>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div {...fadeUp()} style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(77,161,255,0.06)', borderRadius: 20, border: '1px solid rgba(77,161,255,0.15)' }}>
          <GithubOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }} />
          <Title level={3} style={{ color: '#fff', marginBottom: 12 }}>Prêt à analyser le marché ?</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 28 }}>
            Lancez votre première recherche et découvrez les meilleures opportunités de prix.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            className="main-cta-btn"
            onClick={() => navigate('/')}
            style={{ height: 48, fontSize: 16, borderRadius: 24, padding: '0 36px' }}
          >
            <RocketOutlined /> Commencer l'analyse
          </Button>
        </motion.div>

      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '24px', textAlign: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
          MarketMetrics — Projet Data Mining · 2025/2026 · Tous droits réservés
        </Text>
      </div>
    </div>
  );
};

export default AboutPage;
