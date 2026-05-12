import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '@ant-design/pro-components';
import { Row, Col, Card, Statistic, Button, Progress, List, Alert, Spin, Result, Badge, Typography, Tag } from 'antd';
import {
  PrinterOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  DashOutlined,
  FunctionOutlined,
  WarningOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  ComposedChart, Scatter
} from 'recharts';
import { apiFetch } from '../api/client';
import SharedHeader from '../components/SharedHeader';

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
  best_offer: { title: string; price: number; platform: string; score: number };
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

const AnalysisPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [loading, setLoading] = useState(!!query);
  const [error, setError] = useState(false);
  const [data, setData] = useState<AnalysisResult | null>(null);

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
        let best_offer = { title: "N/A", price: 0, platform: "N/A", score: 0 };
        const validOffers = offers.filter((o: any) => !o.is_anomaly);
        if (validOffers.length > 0) {
          const sorted = validOffers.sort((a: any, b: any) => a.price - b.price);
          const best = sorted[0];
          best_offer = {
            title: best.title,
            price: best.price,
            platform: best.platform,
            score: 95 // Score factice en attendant une logique ML plus complexe
          };
        }

        setData({ stats, cluster_counts, best_offer, offers });
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
      <div style={{ minHeight: '100vh', background: '#020b16' }}>
        <SharedHeader />
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '88px 24px 24px',
          background: 'radial-gradient(ellipse at 50% 30%, rgba(77,161,255,0.06) 0%, transparent 60%)',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', maxWidth: 540 }}
          >
            <div style={{ fontSize: 72, marginBottom: 24 }}>🔍</div>
            <Title style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
              Que souhaitez-vous analyser ?
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, display: 'block', marginBottom: 40 }}>
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
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(77,161,255,0.4)',
                  borderRadius: 12,
                  padding: '0 16px',
                  color: '#fff',
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
                  style={{ borderRadius: 20, borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', background: 'transparent', fontSize: 12 }}
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
    <div style={{ minHeight: '100vh', background: '#020b16', display: 'flex', flexDirection: 'column' }}>
      <SharedHeader />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 16 }}>
        <Spin size="large" />
        <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Analyse en cours pour « {query} »…</Text>
      </div>
    </div>
  );

  if (error || !data) return (
    <div style={{ minHeight: '100vh', background: '#020b16' }}>
      <SharedHeader />
      <div style={{ paddingTop: 88 }}>
        <Result
          status="error"
          title={<span style={{ color: '#fff' }}>Erreur lors de l'analyse</span>}
          subTitle={<span style={{ color: 'rgba(255,255,255,0.55)' }}>Vérifiez votre connexion ou réessayez avec un autre produit.</span>}
          extra={[<Button type="primary" onClick={() => navigate('/analyse')}>Nouvelle recherche</Button>]}
        />
      </div>
    </div>
  );


  const { stats, cluster_counts, best_offer, offers } = data;
  const anomalies = offers.filter(o => o.is_anomaly).slice(0, 5);

  // Mock data for BarChart (Distribution)
  const barData = [
    { name: '1.2k-1.6k', count: 40 },
    { name: '1.6k-2.0k', count: 80 },
    { name: '2.0k-2.4k', count: 120 },
    { name: '2.4k-2.8k', count: 60 },
    { name: '2.8k-3.2k', count: 30 },
    { name: '3.2k-3.6k', count: 8 },
    { name: '3.6k-4.0k', count: 4 },
  ];

  const pieData = [
    { name: 'Bas de gamme', value: cluster_counts.bas, fill: COLORS.success },
    { name: 'Milieu', value: cluster_counts.milieu, fill: COLORS.primary },
    { name: 'Haut de gamme', value: cluster_counts.haut, fill: COLORS.purple },
  ];

  const boxPlotData = [
    { platform: 'Jumia', min: 1200, max: 3500, q1: 1500, median: 2100, q3: 2800 },
    { platform: 'Amazon', min: 1800, max: 4500, q1: 2200, median: 2900, q3: 3500 },
    { platform: 'Avito', min: 800, max: 3000, q1: 1100, median: 1600, q3: 2200 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#020b16' }}>
      <SharedHeader />
      <div style={{ paddingTop: 64 }}>
    <PageContainer
      header={{
        title: `Analyse des prix — ${query}`,
        breadcrumb: {
          items: [
            { title: 'Accueil', path: '/' },
            { title: 'Analyse' },
            { title: query },
          ],
        },
        extra: [
          <Button key="export" icon={<PrinterOutlined />}>Exporter PDF</Button>,
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
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8 }} />
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
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
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
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
              <Badge.Ribbon text="Recommandée" color="green">
                <Card title="Meilleure offre recommandée" bordered={false} style={{ borderLeft: `4px solid ${COLORS.success}` }}>
                  <Title level={5} ellipsis={{ tooltip: best_offer.title }}>{best_offer.title}</Title>
                  <Badge color="blue" text={best_offer.platform.toUpperCase()} style={{ marginBottom: 16 }} />
                  <div>
                    <Text style={{ fontSize: 32, color: COLORS.success, fontWeight: 'bold' }}>
                      {best_offer.price.toLocaleString()} MAD
                    </Text>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">Score de recommandation</Text>
                    <Progress percent={best_offer.score} strokeColor={COLORS.success} />
                  </div>
                  <Button type="primary" style={{ marginTop: 16 }}>Voir l'offre</Button>
                </Card>
              </Badge.Ribbon>
            </motion.div>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Liste des anomalies détectées" bordered={false}>
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
                    <List.Item>
                      <List.Item.Meta
                        avatar={<AlertOutlined style={{ color: COLORS.error, fontSize: 20 }} />}
                        title={<Text ellipsis style={{ width: '100%', display: 'inline-block' }}>{item.title}</Text>}
                        description={<Tag color="red">{item.platform}</Tag>}
                      />
                      <div style={{ color: COLORS.error, fontWeight: 'bold' }}>{item.price} MAD</div>
                    </List.Item>
                  </motion.div>
                )}
              />
              {anomalies.length > 0 && <Button type="link">Voir tout</Button>}
            </Card>
          </Col>
        </Row>

        {/* ROW 4: BOXPLOT COMPARATIF */}
        <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 24 }} viewport={{ once: true, margin: '-60px' }}>
          <Card title="Comparaison par plateforme (Distribution)" bordered={false}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={boxPlotData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{ background: '#fff', padding: 12, border: '1px solid #ccc', borderRadius: 4 }}>
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

      </motion.div>
    </PageContainer>
      </div>
    </div>
  );
};

export default AnalysisPage;
