import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '@ant-design/pro-components';
import { Row, Col, Card, Statistic, Button, Progress, List, Alert, Spin, Result, Badge, Typography, Tag, theme, Modal, Descriptions, Image as AntImage } from 'antd';
import {
  PrinterOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  DashOutlined,
  FunctionOutlined,
  WarningOutlined,
  AlertOutlined,
  LinkOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  ComposedChart, Scatter
} from 'recharts';
import { apiFetch } from '../api/client';
import SharedHeader from '../components/SharedHeader';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;

// Mock interfaces
interface AnalysisResult {
  stats: {
    min: number; max: number; median: number;
    std: number; q1: number; q3: number;
    count: number; anomaly_count: number;
  };
  cluster_counts: { bas: number; milieu: number; haut: number };
  offers: Array<{
    id: number; title: string; platform: string;
    price: number; cluster_label: string; is_anomaly: boolean; score: number;
  }>;
  best_offer: { id?: number; title: string; price: number; platform: string; score: number; image?: string; url?: string };
  barData: Array<{ name: string; count: number }>;
  boxPlotData: Array<{ platform: string; min: number; max: number; q1: number; median: number; q3: number }>;
  rules: Array<{ antecedents: string[]; consequents: string[]; confidence: number; lift: number }>;
  cached: boolean;
  computed_at: string;
}

const COLORS = {
  primary: '#1677ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  purple: '#722ed1',
};

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const PLATFORM_COLORS: Record<string, string> = {
  jumia: '#f68b1e',
  ebay: '#e53238',
  aliexpress: '#ff4747'
};

const PLATFORM_LABELS: Record<string, string> = {
  jumia: 'Jumia',
  ebay: 'eBay',
  aliexpress: 'AliExpress'
};

const ProductDetailModal: React.FC<{ product: any | null; open: boolean; onClose: () => void }> = ({ product, open, onClose }) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { token } = theme.useToken();

  useEffect(() => {
    if (open && product && product.id) {
      setLoading(true);
      apiFetch(`/products/${product.id}/`).then(d => { setDetail(d); setLoading(false); }).catch(() => setLoading(false));
    } else { setDetail(null); }
  }, [open, product]);

  const d = detail || product;
  if (!d) return null;
  const pc = PLATFORM_COLORS[d.platform] || '#999';

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={640} centered
      styles={{ content: { borderRadius: 16 } }}
    >
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div> : (
        <div style={{ padding: 8 }}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
            <AntImage src={d.image} fallback="https://via.placeholder.com/120" width={120} style={{ borderRadius: 12, objectFit: 'contain', background: token.colorBgLayout }} preview={false} />
            <div style={{ flex: 1 }}>
              <Text style={{ color: token.colorTextHeading, fontSize: 18, fontWeight: 700, display: 'block', marginBottom: 8 }}>{d.title}</Text>
              <Badge color={pc} text={<span style={{ color: token.colorText }}>{PLATFORM_LABELS[d.platform] || d.platform}</span>} />
              {d.cluster_label && <Tag color="blue" style={{ marginLeft: 8 }}>{d.cluster_label}</Tag>}
              {d.is_anomaly && <Tag color="red" style={{ marginLeft: 4 }}>⚠ Anomalie</Tag>}
            </div>
          </div>
          <Descriptions column={2} size="small" style={{ marginBottom: 20 }}>
            <Descriptions.Item label="Prix">{d.price != null ? `${(d.price_usd ? d.price_usd * 10 : d.price).toLocaleString()} MAD` : '—'}</Descriptions.Item>
            <Descriptions.Item label="Prix USD">{d.price_usd != null ? `$${d.price_usd.toLocaleString()}` : '—'}</Descriptions.Item>
            <Descriptions.Item label="Vendeur">{d.seller || '—'}</Descriptions.Item>
            <Descriptions.Item label="Catégorie">{d.category || '—'}</Descriptions.Item>
            <Descriptions.Item label="Note">{d.rating != null ? `${d.rating} ⭐` : '—'}</Descriptions.Item>
            <Descriptions.Item label="Avis">{d.reviews_count ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Première collecte">{d.first_seen ? dayjs(d.first_seen).format('DD/MM/YYYY HH:mm') : '—'}</Descriptions.Item>
            <Descriptions.Item label="Dernière MàJ">{d.scraped_at ? dayjs(d.scraped_at).format('DD/MM/YYYY HH:mm') : '—'}</Descriptions.Item>
          </Descriptions>
          {d.url && (
            <Button type="primary" icon={<LinkOutlined />} href={d.url} target="_blank" block style={{ borderRadius: 10, height: 44, background: 'linear-gradient(90deg, #3884ff, #624aff)', border: 'none' }}>
              Voir sur {PLATFORM_LABELS[d.platform] || d.platform}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
};

const AnalysisPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [loading, setLoading] = useState(!!query);
  const [error, setError] = useState(false);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAnomaliesModal, setShowAnomaliesModal] = useState(false);
  const { isDarkMode } = useTheme();
  const { token } = theme.useToken();

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    apiFetch(`/search/analyze/?q=${encodeURIComponent(query)}`)
      .then((resData) => {
        const { stats, offers } = resData;
        
        // Calcul des clusters
        const cluster_counts = { bas: 0, milieu: 0, haut: 0 };
        offers.forEach((o: any) => {
          if (o.cluster_label === 'Entrée de gamme') cluster_counts.bas++;
          else if (o.cluster_label === 'Milieu de gamme') cluster_counts.milieu++;
          else if (o.cluster_label === 'Haut de gamme') cluster_counts.haut++;
        });

        // Calcul de la meilleure offre
        let best_offer: any = { title: "N/A", price: 0, platform: "N/A", score: 0 };
        const validOffers = offers.filter((o: any) => !o.is_anomaly);
        if (validOffers.length > 0) {
          const medianPrice = stats.median;
          const std = stats.std || 1;

          const scoredOffers = validOffers.map((o: any) => {
            let score = 50;
            
            // Privilégier le "Milieu de gamme" pour éviter les accessoires ou PC sans composants
            if (o.cluster_label === 'Milieu de gamme') score += 25;
            else if (o.cluster_label === 'Haut de gamme') score += 10;
            else if (o.cluster_label === 'Entrée de gamme') score -= 15;

            // Favoriser les prix proches de la médiane (bon rapport qualité/prix)
            const distanceToMedian = (o.price - medianPrice) / std;
            if (distanceToMedian < 0 && distanceToMedian >= -1) {
              score += 15; // Bon deal (moins cher que la médiane, mais raisonnable)
            } else if (distanceToMedian >= 0 && distanceToMedian <= 1) {
              score += 10; // Prix standard
            } else if (distanceToMedian < -1) {
              score -= 15; // Trop peu cher (suspect d'être un accessoire)
            }

            if (o.rating) {
              score += (o.rating / 5) * 15;
            }

            return { ...o, score: Math.min(99, Math.max(10, Math.round(score))) };
          });

          const sorted = scoredOffers.sort((a: any, b: any) => b.score - a.score);
          best_offer = sorted[0];
        }

        setData({ 
          stats, 
          cluster_counts, 
          best_offer, 
          offers,
          barData: resData.barData || [],
          boxPlotData: resData.boxPlotData || [],
          rules: resData.rules || [],
          cached: resData.cached || false,
          computed_at: resData.computed_at || ''
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, [query]);

  // ── Empty query: show search prompt ──
  if (!query) {
    return (
      <div style={{ minHeight: '100vh', background: token.colorBgLayout }}>
        <SharedHeader />
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '88px 24px 24px',
          background: isDarkMode ? 'radial-gradient(ellipse at 50% 30%, rgba(77,161,255,0.06) 0%, transparent 60%)' : 'radial-gradient(ellipse at 50% 30%, rgba(77,161,255,0.15) 0%, transparent 60%)',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', maxWidth: 540 }}
          >
            <div style={{ fontSize: 72, marginBottom: 24 }}>🔍</div>
            <Title style={{ color: token.colorTextHeading, fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
              Que souhaitez-vous analyser ?
            </Title>
            <Text style={{ color: token.colorTextSecondary, fontSize: 16, display: 'block', marginBottom: 40 }}>
              Entrez le nom d'un produit pour lancer l'analyse des prix sur Jumia, AliExpress et eBay.
            </Text>
            <div style={{ display: 'flex', gap: 12, maxWidth: 480, margin: '0 auto' }}>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchInput.trim()) {
                    navigate(`/analyse?q=${encodeURIComponent(searchInput.trim())}`);
                  }
                }}
                placeholder="Ex: iPhone 15, Laptop Gaming..."
                style={{
                  flex: 1,
                  height: 50,
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorPrimary}`,
                  borderRadius: 12,
                  padding: '0 16px',
                  color: token.colorText,
                  fontSize: 15,
                  outline: 'none',
                }}
              />
              <Button
                type="primary"
                size="large"
                disabled={!searchInput.trim()}
                onClick={() => {
                  if (searchInput.trim()) navigate(`/analyse?q=${encodeURIComponent(searchInput.trim())}`);
                }}
                style={{ height: 50, borderRadius: 12, padding: '0 24px', background: 'linear-gradient(90deg, #3884ff, #624aff)', border: 'none' }}
              >
                Analyser
              </Button>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['iPhone 15', 'Laptop Gaming', 'Samsung TV', 'AirPods'].map(s => (
                <Button
                  key={s}
                  size="small"
                  onClick={() => navigate(`/analyse?q=${encodeURIComponent(s)}`)}
                  style={{ borderRadius: 20, borderColor: token.colorBorder, color: token.colorTextSecondary, background: 'transparent', fontSize: 12 }}
                >
                  {s}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: token.colorBgLayout, display: 'flex', flexDirection: 'column' }}>
      <SharedHeader />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 16 }}>
        <Spin size="large" />
        <Text style={{ color: token.colorTextSecondary }}>Analyse en cours pour « {query} »…</Text>
      </div>
    </div>
  );

  if (error || !data) return (
    <div style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <SharedHeader />
      <div style={{ paddingTop: 88 }}>
        <Result
          status="error"
          title={<span style={{ color: token.colorTextHeading }}>Erreur lors de l'analyse</span>}
          subTitle={<span style={{ color: token.colorTextSecondary }}>Vérifiez votre connexion ou réessayez avec un autre produit.</span>}
          extra={[<Button type="primary" onClick={() => navigate('/analyse')}>Nouvelle recherche</Button>]}
        />
      </div>
    </div>
  );


  const { stats, cluster_counts, best_offer, offers, barData, boxPlotData, rules, cached, computed_at } = data;
  const anomalies = offers.filter(o => o.is_anomaly).slice(0, 5);

  const pieData = [
    { name: 'Bas de gamme', value: cluster_counts.bas, fill: COLORS.success },
    { name: 'Milieu', value: cluster_counts.milieu, fill: COLORS.primary },
    { name: 'Haut de gamme', value: cluster_counts.haut, fill: COLORS.purple },
  ];

  return (
    <div style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <SharedHeader />
      <div style={{ paddingTop: 64 }}>
    <PageContainer
      header={{
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            Analyse des prix — {query}
            {cached && (
              <Tag color="purple" style={{ fontSize: 12, fontWeight: 'normal', display: 'flex', alignItems: 'center', margin: 0 }}>
                Cache du {new Date(computed_at).toLocaleDateString()}
              </Tag>
            )}
          </div>
        ),
        breadcrumb: {
          items: [
            { title: 'Accueil', path: '/' },
            { title: 'Analyse' },
            { title: query },
          ],
        },
        extra: [
          <Button key="export" icon={<PrinterOutlined />} onClick={() => window.print()}>Exporter PDF</Button>,
          <Button key="new" type="primary" onClick={() => navigate('/analyse')}>Nouvelle recherche</Button>,
        ],
      }}
      style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}
    >
      <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
        {/* ROW 1: METRICS */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {[
            { title: 'Prix minimum', value: stats.min, suffix: ' MAD', prefix: <ArrowDownOutlined style={{ color: COLORS.success }} /> },
            { title: 'Prix maximum', value: stats.max, suffix: ' MAD', prefix: <ArrowUpOutlined style={{ color: COLORS.error }} /> },
            { title: 'Prix médian', value: stats.median, suffix: ' MAD', prefix: <DashOutlined /> },
            { title: 'Écart-type', value: Math.round(stats.std), prefix: <FunctionOutlined /> },
            { title: 'Anomalies', value: stats.anomaly_count, prefix: <WarningOutlined />, valueStyle: { color: COLORS.error } },
          ].map((item, i) => (
            <Col xs={24} sm={12} md={8} lg={4} key={i} style={{ flex: 1 }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card bordered={false}>
                  <Statistic
                    title={item.title}
                    value={item.value}
                    suffix={item.suffix}
                    prefix={item.prefix}
                    valueStyle={item.valueStyle}
                    formatter={(val) => Number(val).toLocaleString()}
                  />
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* ROW 2: CHARTS */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="Distribution des prix" bordered={false}>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" stroke={token.colorTextSecondary} />
                    <YAxis stroke={token.colorTextSecondary} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, background: token.colorBgElevated, border: 'none', color: token.colorText }} />
                    <ReferenceLine x="2.4k-2.8k" stroke={COLORS.error} label="Médiane" strokeDasharray="3 3" />
                    <Bar
                      dataKey="count"
                      fill={COLORS.primary}
                      activeBar={{ fill: '#0958d9' }}
                      animationBegin={300}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Répartition des clusters" bordered={false}>
              <div style={{ height: 300, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      isAnimationActive
                      animationBegin={0}
                      animationDuration={900}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: token.colorBgElevated, border: 'none', color: token.colorText }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: token.colorText }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)', textAlign: 'center', marginTop: '-18px'
                }}>
                  <Title level={4} style={{ margin: 0 }}>{stats.count}</Title>
                  <Text type="secondary">offres</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* ROW 3: RECOMMENDATION & ANOMALIES */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24, display: 'flex', alignItems: 'stretch' }}>
          <Col xs={24} lg={12} style={{ display: 'flex', flexDirection: 'column' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <style>{`
                  .ant-ribbon-wrapper {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                  }
                `}</style>
                <Badge.Ribbon text="Recommandée" color="green">
                  <Card title="Meilleure offre recommandée" bordered={false} style={{ borderLeft: `4px solid ${COLORS.success}`, flex: 1, height: '100%' }} bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    {best_offer.image && (
                      <AntImage src={best_offer.image} fallback="https://via.placeholder.com/100" width={100} height={100} style={{ objectFit: 'contain', borderRadius: 8, background: token.colorBgLayout }} preview={false} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Title level={5} ellipsis={{ tooltip: best_offer.title }} style={{ margin: 0, marginBottom: 8 }}>{best_offer.title}</Title>
                      <Badge color="blue" text={best_offer.platform?.toUpperCase() || 'N/A'} style={{ marginBottom: 16 }} />
                      <div>
                        <Text style={{ fontSize: 24, color: COLORS.success, fontWeight: 'bold' }}>
                          {best_offer.price?.toLocaleString()} MAD
                        </Text>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Text type="secondary">Score de recommandation</Text>
                    <Progress percent={best_offer.score} strokeColor={COLORS.success} />
                    <div style={{ padding: '16px', background: token.colorBgLayout, borderRadius: 8, marginTop: 16 }}>
                      <Text strong style={{ display: 'block', marginBottom: 8, color: token.colorTextHeading }}>💡 Pourquoi cette offre ?</Text>
                      <ul style={{ paddingLeft: 20, margin: 0, color: token.colorTextSecondary }}>
                        <li style={{ marginBottom: 6 }}>Prix très compétitif parmi les offres fiables.</li>
                        <li style={{ marginBottom: 6 }}>Aucune anomalie détectée par notre algorithme (Isolation Forest).</li>
                        <li>Correspond parfaitement au marché actuel.</li>
                      </ul>
                    </div>
                  </div>
                  <Button type="primary" style={{ marginTop: 'auto', alignSelf: 'flex-start' }} onClick={() => setSelectedProduct(best_offer)}>Voir l'offre complet</Button>
                </Card>
                </Badge.Ribbon>
              </div>
            </motion.div>
          </Col>
          <Col xs={24} lg={12} style={{ display: 'flex', flexDirection: 'column' }}>
            <Card title="Liste des anomalies détectées" bordered={false} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1 }}>
              <Alert
                message="Prix suspects détectés"
                description="Ces offres ont été identifiées comme anormales par Isolation Forest"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <List
                itemLayout="horizontal"
                dataSource={anomalies}
                renderItem={(item, index) => (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.05 }}>
                    <List.Item actions={[<Button type="link" size="small" onClick={() => setSelectedProduct(item)}>Voir</Button>]}>
                      <List.Item.Meta
                        avatar={<AlertOutlined style={{ color: COLORS.error, fontSize: 20 }} />}
                        title={<Text ellipsis style={{ width: '100%', display: 'inline-block' }}>{item.title}</Text>}
                        description={<Tag color="red">{item.platform}</Tag>}
                      />
                      <div style={{ color: COLORS.error, fontWeight: 'bold' }}>{item.price?.toLocaleString()} MAD</div>
                    </List.Item>
                  </motion.div>
                )}
              />
              {offers.filter(o => o.is_anomaly).length > 5 && (
                <Button type="link" onClick={() => setShowAnomaliesModal(true)}>
                  Voir toutes les {offers.filter(o => o.is_anomaly).length} anomalies
                </Button>
              )}
            </Card>
          </Col>
        </Row>

        {/* ROW 4: BOXPLOT COMPARATIF */}
        <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 24 }} viewport={{ once: true, margin: '-60px' }}>
          <Card title="Comparaison par plateforme (Distribution)" bordered={false}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={boxPlotData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis dataKey="platform" stroke={token.colorTextSecondary} />
                  <YAxis stroke={token.colorTextSecondary} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{ background: token.colorBgElevated, padding: 12, border: `1px solid ${token.colorBorder}`, borderRadius: 4, color: token.colorText }}>
                            <p><strong>{data.platform}</strong></p>
                            <p>Max: {data.max}</p>
                            <p>Q3: {data.q3}</p>
                            <p>Médiane: {data.median}</p>
                            <p>Q1: {data.q1}</p>
                            <p>Min: {data.min}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Visual hack for boxplot in Recharts: use transparent bar for min offset, then stacked bar for Q1-Q3 */}
                  <Bar dataKey="q1" stackId="a" fill="transparent" />
                  <Bar dataKey={(data) => data.q3 - data.q1} stackId="a" fill={COLORS.primary} animationDuration={800} />
                  <Scatter dataKey="median" fill={COLORS.error} shape="wye" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* ROW 5: RÈGLES D'ASSOCIATION */}
        {rules && rules.length > 0 && (
          <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 24 }} viewport={{ once: true, margin: '-60px' }}>
            <Card title="Insights (Règles d'association FP-Growth)" bordered={false} style={{ marginTop: 24 }}>
              <List
                dataSource={rules}
                renderItem={(rule) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<FunctionOutlined style={{ color: COLORS.purple, fontSize: 20 }} />}
                      title={
                        <Text>
                          Si <Tag color="blue">{rule.antecedents.join(', ').replace('Platform_', '').replace('Gamme_', '')}</Tag> 
                          alors souvent <Tag color="cyan">{rule.consequents.join(', ').replace('Platform_', '').replace('Gamme_', '')}</Tag>
                        </Text>
                      }
                      description={
                        <Text type="secondary">
                          Confiance: <strong style={{ color: COLORS.primary }}>{rule.confidence}%</strong> | 
                          Lift: <strong>{rule.lift}</strong>
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </motion.div>
        )}

      </motion.div>
      
      <ProductDetailModal product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
      
      <Modal 
        title="Toutes les anomalies détectées" 
        open={showAnomaliesModal} 
        onCancel={() => setShowAnomaliesModal(false)} 
        footer={null} 
        width={700}
      >
        <List
          itemLayout="horizontal"
          dataSource={offers.filter(o => o.is_anomaly)}
          style={{ maxHeight: 500, overflowY: 'auto' }}
          renderItem={(item) => (
            <List.Item actions={[<Button type="link" onClick={() => { setSelectedProduct(item); setShowAnomaliesModal(false); }}>Voir</Button>]}>
              <List.Item.Meta
                avatar={<AlertOutlined style={{ color: COLORS.error, fontSize: 20 }} />}
                title={<Text ellipsis>{item.title}</Text>}
                description={<Tag color="red">{item.platform}</Tag>}
              />
              <div style={{ color: COLORS.error, fontWeight: 'bold' }}>{item.price?.toLocaleString()} MAD</div>
            </List.Item>
          )}
        />
      </Modal>

    </PageContainer>
      </div>
    </div>
  );
};

export default AnalysisPage;
