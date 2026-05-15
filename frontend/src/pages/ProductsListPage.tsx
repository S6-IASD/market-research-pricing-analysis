import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  Input, Segmented, Radio, Switch, Button, Badge, Tag, Image,
  Typography, Space, Empty, Card, Row, Col, ConfigProvider,
  Modal, Descriptions, Spin, notification, theme, Progress
} from 'antd';
import {
  AppstoreOutlined, LinkOutlined, LoadingOutlined, SearchOutlined,
  CheckCircleOutlined, LineChartOutlined, ReloadOutlined, UnorderedListOutlined, DownloadOutlined, GlobalOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import Papa from 'papaparse';
import { apiFetch } from '../api/client';
import SharedHeader from '../components/SharedHeader';

const { Text, Paragraph } = Typography;

export interface Product {
  id: number; title: string; platform: string; url?: string;
  price: number | null; image: string; seller: string;
  search_query: string; first_seen: string; last_seen?: string;
  category?: string; subcategory?: string;
  price_usd?: number; currency?: string; rating?: number;
  reviews_count?: number; scraped_at?: string;
  cluster_label?: string | null; is_anomaly?: boolean;
}

const PLATFORM_COLORS: Record<string, string> = { jumia: '#52c41a', aliexpress: '#ff6a00', ebay: '#e6162d' };
const PLATFORM_LABELS: Record<string, string> = { jumia: 'Jumia', aliexpress: 'AliExpress', ebay: 'eBay' };

const fetchProducts = async (params: any) => {
  const { current, pageSize, query, platform } = params;
  let url = `/products/?page=${current || 1}&page_size=${pageSize || 20}`;
  if (query) url += `&query=${encodeURIComponent(query)}`;
  if (platform && platform !== 'all') url += `&platform=${encodeURIComponent(platform)}`;
  try {
    const response = await apiFetch(url);
    return { data: response.results || [], success: true, total: response.count || 0 };
  } catch (error) {
    console.error('Fetch error:', error);
    return { data: [], success: false, total: 0 };
  }
};

/* ── Product Card ── */
const ProductCard: React.FC<{ product: Product; onView: (p: Product) => void }> = ({ product, onView }) => {
  const pc = PLATFORM_COLORS[product.platform] || '#999';
  const pl = PLATFORM_LABELS[product.platform] || product.platform;
  const { token } = theme.useToken();
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} whileHover={{ y: -4 }}>
      <Card variant="borderless" style={{ background: token.colorBgContainer, border: product.is_anomaly ? `1px solid ${token.colorError}` : `1px solid ${token.colorBorderSecondary}`, borderRadius: 14, height: '100%', overflow: 'hidden', cursor: 'pointer' }} styles={{ body: { padding: 0 } }} onClick={() => onView(product)}>
        <div style={{ height: 160, background: token.colorBgLayout, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
          <Image src={product.image} fallback="https://via.placeholder.com/160x160?text=No+Image" alt={product.title} style={{ maxHeight: 150, objectFit: 'contain' }} preview={false} />
          <div style={{ position: 'absolute', top: 8, left: 8, background: `${pc}20`, border: `1px solid ${pc}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, color: pc }}>{pl}</div>
          {product.is_anomaly && <div style={{ position: 'absolute', top: 8, right: 8, background: `${token.colorError}20`, border: `1px solid ${token.colorError}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, color: token.colorError }}>⚠ Suspect</div>}
        </div>
        <div style={{ padding: 16 }}>
          <Paragraph ellipsis={{ rows: 2 }} style={{ color: token.colorTextHeading, fontWeight: 600, fontSize: 14, marginBottom: 8, lineHeight: 1.4 }}>{product.title}</Paragraph>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: token.colorPrimary, fontSize: 20, fontWeight: 700 }}>{product.price !== null ? `${(product.price_usd ? product.price_usd * 10 : product.price)?.toLocaleString()} MAD` : '—'}</Text>
            {product.cluster_label && <Tag color={product.cluster_label === 'Entrée de gamme' ? 'green' : product.cluster_label === 'Milieu de gamme' ? 'blue' : 'purple'} style={{ margin: 0, borderRadius: 10, fontSize: 11 }}>{product.cluster_label}</Tag>}
          </div>
          <Text style={{ color: token.colorTextSecondary, fontSize: 11 }}>{dayjs(product.first_seen).format('DD/MM/YYYY')}</Text>
        </div>
      </Card>
    </motion.div>
  );
};

/* ── Product Detail Modal ── */
const ProductDetailModal: React.FC<{ product: Product | null; open: boolean; onClose: () => void }> = ({ product, open, onClose }) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { token } = theme.useToken();

  useEffect(() => {
    if (open && product) {
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
            <Image src={d.image} fallback="https://via.placeholder.com/120" width={120} style={{ borderRadius: 12, objectFit: 'contain', background: token.colorBgLayout }} preview={false} />
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

/* ── Main Page ── */
const ProductsListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const { token } = theme.useToken();

  // Read URL params
  const urlParams = new URLSearchParams(location.search);
  const initialQuery = urlParams.get('q') || '';
  const initialDeep = urlParams.get('deep') === '1';

  const [query, setQuery] = useState(initialQuery);
  const queryRef = useRef(initialQuery); // Always holds latest query to avoid stale closure
  const [platform, setPlatform] = useState<string>('all');
  const [cluster, setCluster] = useState<string>('all');
  const [hideAnomalies, setHideAnomalies] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Card view state
  const [cardData, setCardData] = useState<Product[]>([]);
  const [cardTotal, setCardTotal] = useState(0);
  const [cardPage, setCardPage] = useState(1);
  const [cardLoading, setCardLoading] = useState(false);

  // Analysis enrichment
  const [analysisMap, setAnalysisMap] = useState<Map<number, { cluster_label: string; is_anomaly: boolean }>>(new Map());

  // Detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Deep search state
  const [scrapingTaskId, setScrapingTaskId] = useState<string | null>(null);
  const [scrapingFinished, setScrapingFinished] = useState(false);
  const [isStartingDeepSearch, setIsStartingDeepSearch] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => { return () => { if (pollingRef.current) clearInterval(pollingRef.current); }; }, []);

  useEffect(() => { actionRef.current?.reload(true); }, [platform, cluster, hideAnomalies]);

  // Auto-analyze when query changes
  const runAnalysis = useCallback(async (q: string) => {
    if (!q.trim()) return;
    try {
      const res = await apiFetch(`/search/analyze/?q=${encodeURIComponent(q)}`);
      if (res.offers) {
        const map = new Map<number, { cluster_label: string; is_anomaly: boolean }>();
        res.offers.forEach((o: any) => map.set(o.id, { cluster_label: o.cluster_label || '', is_anomaly: !!o.is_anomaly }));
        setAnalysisMap(map);
      }
    } catch { /* analysis optional */ }
  }, []);

  // Deep search
  const triggerDeepSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setIsStartingDeepSearch(true);
    try {
      const res = await apiFetch('/search/', {
        method: 'POST',
        body: JSON.stringify({ query: q, deep_search: true }),
      });
      if (res.task_id) {
        setScrapingTaskId(res.task_id);
        setScrapingFinished(false);
        setScrapingProgress(0);
        notification.info({ message: 'Scraping lancé', description: 'Collecte en cours sur les 3 plateformes…', icon: <LoadingOutlined style={{ color: '#4da1ff' }} /> });
        
        // Poll status
        pollingRef.current = setInterval(async () => {
          try {
            const status = await apiFetch(`/search/${res.task_id}/status/`);
            
            // Simuler l'avancement
            setScrapingProgress(prev => Math.min(prev + 3 + Math.floor(Math.random() * 5), 90));
            
            // Rafraîchir les données en temps réel
            setRefreshTrigger(prev => prev + 1);
            if (actionRef.current) actionRef.current.reload(false);

            if (status.status === 'done' || status.status === 'completed' || status.status === 'failed') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              pollingRef.current = null;
              setScrapingProgress(100);
              
              if (status.status !== 'failed') {
                notification.success({ message: 'Scraping terminé !', description: `${status.result_count || 0} nouveaux produits collectés.`, icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> });
                setScrapingFinished(true);
              } else {
                notification.error({ message: 'Scraping échoué', description: 'Une erreur est survenue lors de la collecte.' });
              }
              
              setTimeout(() => setScrapingTaskId(null), 2500); // Laisser le temps de voir les 100%
            }
          } catch { /* continue polling */ }
        }, 4000);
      }
    } catch (err: any) {
      notification.warning({ message: 'Deep Search', description: err.message || 'Erreur lors du lancement du scraping' });
    } finally {
      setIsStartingDeepSearch(false);
    }
  }, []);

  // Unified search handler
  const handleSearch = useCallback((value: string) => {
    const trimmed = value.trim();
    setQuery(trimmed);
    queryRef.current = trimmed;
    if (viewMode === 'table') {
      // Small timeout to ensure state is set before reload
      setTimeout(() => actionRef.current?.reload(true), 0);
    } else {
      setCardPage(1);
    }
    // Auto-analyze
    if (trimmed) runAnalysis(trimmed);
  }, [viewMode, runAnalysis]);

  // Keep queryRef in sync when query changes from onChange
  useEffect(() => { queryRef.current = query; }, [query]);

  // Auto-trigger on mount if URL has ?q=
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current && initialQuery) {
      mountedRef.current = true;
      runAnalysis(initialQuery);
      if (initialDeep) triggerDeepSearch(initialQuery);
    }
  }, [initialQuery, initialDeep, runAnalysis, triggerDeepSearch]);

  // Card view fetch
  useEffect(() => {
    if (viewMode === 'cards') {
      setCardLoading(true);
      fetchProducts({ current: cardPage, pageSize: 20, query, platform }).then(res => {
        let filtered = res.data.map((p: Product) => {
          const a = analysisMap.get(p.id);
          return a ? { ...p, cluster_label: a.cluster_label, is_anomaly: a.is_anomaly } : p;
        });
        
        if (cluster !== 'all') {
          filtered = filtered.filter((p: Product) => {
            if (cluster === 'bas') return p.cluster_label === 'Entrée de gamme';
            if (cluster === 'milieu') return p.cluster_label === 'Milieu de gamme';
            if (cluster === 'haut') return p.cluster_label === 'Haut de gamme';
            return true;
          });
        }
        if (hideAnomalies) {
          filtered = filtered.filter((p: Product) => !p.is_anomaly);
        }
        
        setCardData(filtered);
        setCardTotal(res.total);
        setCardLoading(false);
      });
    }
  }, [viewMode, cardPage, query, platform, cluster, hideAnomalies, analysisMap, refreshTrigger]);

  // Enrich product with analysis data
  const enrich = (p: Product): Product => {
    const a = analysisMap.get(p.id);
    if (a) return { ...p, cluster_label: a.cluster_label, is_anomaly: a.is_anomaly };
    return p;
  };

  const handleExportCSV = async () => {
    const csv = Papa.unparse([{ info: 'Exportez depuis la base complète' }]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `export_produits_${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const openDetail = (p: Product) => { setSelectedProduct(p); setModalOpen(true); };

  const columns: ProColumns<Product>[] = [
    { title: 'Image', dataIndex: 'image', width: 60, render: (_, r) => <Image width={48} src={r.image} fallback="https://via.placeholder.com/48" preview={false} /> },
    { title: 'Produit', dataIndex: 'title', width: 280, ellipsis: true },
    { title: 'Plateforme', dataIndex: 'platform', width: 120, render: (_, r) => <Badge color={PLATFORM_COLORS[r.platform] || '#d9d9d9'} text={<span style={{ color: token.colorText }}>{PLATFORM_LABELS[r.platform] || r.platform}</span>} /> },
    { title: 'Prix (MAD)', dataIndex: 'price', width: 110, sorter: true, render: (_, r) => r.price != null ? <Text strong style={{ color: token.colorPrimary }}>{(r.price_usd ? r.price_usd * 10 : r.price)?.toLocaleString()}</Text> : '—' },
    { title: 'Cluster', dataIndex: 'cluster_label', width: 120, render: (_, r) => { const e = enrich(r); return e.cluster_label ? <Tag color={e.cluster_label.includes('Entrée') ? 'green' : e.cluster_label.includes('Milieu') ? 'blue' : 'purple'}>{e.cluster_label}</Tag> : '—'; } },
    { title: 'Anomalie', dataIndex: 'is_anomaly', width: 90, render: (_, r) => { const e = enrich(r); return e.is_anomaly ? <Tag color="red">⚠ Suspect</Tag> : <Tag color="green">OK</Tag>; } },
    { title: 'Date', dataIndex: 'first_seen', width: 130, render: (_, r) => <span style={{ color: token.colorTextSecondary }}>{dayjs(r.first_seen).format('DD/MM/YYYY')}</span> },
    { title: 'Actions', valueType: 'option', width: 80, render: (_, r) => <Button type="link" size="small" style={{ color: token.colorPrimary }} onClick={() => openDetail(r)}>Voir</Button> },
  ];

  return (
    <ConfigProvider locale={{ locale: 'fr', Pagination: { items_per_page: '/ page', jump_to: 'Aller à', page: 'Page', prev_page: 'Précédente', next_page: 'Suivante', prev_5: '5 précédentes', next_5: '5 suivantes', prev_3: '3 précédentes', next_3: '3 suivantes' }, Table: { filterReset: 'Réinitialiser', filterConfirm: 'OK', emptyText: 'Aucune donnée', sortTitle: 'Trier', triggerDesc: 'Tri descendant', triggerAsc: 'Tri ascendant', cancelSort: 'Annuler le tri' } } as any}>
      <div style={{ minHeight: '100vh', background: token.colorBgLayout }}>
        <SharedHeader />
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '80px 24px 24px' }}>

          {/* TITLE */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ color: token.colorTextHeading, fontSize: 28, fontWeight: 800, margin: 0 }}>Base de Données Produits</h1>
                <Text style={{ color: token.colorTextSecondary, fontSize: 14 }}>Parcourez et filtrez les produits collectés depuis Jumia, AliExpress et eBay.</Text>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {scrapingTaskId && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12, background: `${token.colorPrimary}10`,
                      border: `1px solid ${token.colorPrimary}30`, padding: '6px 20px', borderRadius: 30,
                      boxShadow: `0 0 10px ${token.colorPrimary}20`, width: 300
                    }}>
                      <span style={{ color: token.colorPrimary, fontSize: 13, fontWeight: 600, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        SCRAPING
                      </span>
                      <Progress percent={scrapingProgress} size="small" status="active" strokeColor={token.colorPrimary} style={{ margin: 0 }} />
                    </div>
                  </motion.div>
                )}
                {scrapingFinished && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Button
                      type="primary"
                      icon={<ReloadOutlined />}
                      onClick={() => { setScrapingFinished(false); handleSearch(query); }}
                      style={{
                        background: 'linear-gradient(90deg, #52c41a, #389e0d)', border: 'none',
                        borderRadius: 30, height: 34, fontWeight: 600, boxShadow: '0 2px 8px rgba(82,196,26,0.3)'
                      }}
                    >
                      Actualiser les résultats
                    </Button>
                  </motion.div>
                )}
                <Segmented value={viewMode} onChange={(v) => setViewMode(v as any)} options={[
                  { label: 'Tableau', value: 'table', icon: <UnorderedListOutlined /> },
                  { label: 'Cartes', value: 'cards', icon: <AppstoreOutlined /> },
                ]} />
              </div>
            </div>
          </motion.div>

          {/* FILTERS */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            style={{ marginBottom: 24, padding: 20, background: token.colorBgContainer, borderRadius: 14, border: `1px solid ${token.colorBorderSecondary}` }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Input.Search
                    placeholder="Rechercher un produit..."
                    allowClear
                    value={query}
                    onChange={(e) => {
                      // Update query on every keystroke so Enter/search button captures it
                      setQuery(e.target.value);
                    }}
                    onSearch={(val) => handleSearch(val)}
                    onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
                    style={{ width: 320 }}
                    enterButton={<><SearchOutlined /> Rechercher</>}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  {query && (
                    <Button
                      type="primary"
                      icon={<LineChartOutlined />}
                      onClick={() => navigate(`/analyse?q=${encodeURIComponent(query)}`)}
                      style={{
                        borderRadius: 10,
                        background: 'rgba(162, 97, 255, 0.15)',
                        borderColor: '#a261ff',
                        color: '#a261ff',
                        fontWeight: 500
                      }}
                    >
                      Voir l'analyse
                    </Button>
                  )}
                  <Button icon={<DownloadOutlined />} onClick={handleExportCSV} style={{ borderRadius: 10 }}>Exporter CSV</Button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                <Segmented value={platform} onChange={v => { setPlatform(v as string); if (viewMode === 'cards') setCardPage(1); }} options={[
                  { label: 'Tous', value: 'all', icon: <GlobalOutlined /> },
                  { label: 'Jumia', value: 'jumia', icon: <span style={{ color: PLATFORM_COLORS.jumia }}>●</span> },
                  { label: 'AliExpress', value: 'aliexpress', icon: <span style={{ color: PLATFORM_COLORS.aliexpress }}>●</span> },
                  { label: 'eBay', value: 'ebay', icon: <span style={{ color: PLATFORM_COLORS.ebay }}>●</span> },
                ]} />
                <Radio.Group value={cluster} onChange={e => setCluster(e.target.value)}>
                  <Radio.Button value="all">Tous</Radio.Button>
                  <Radio.Button value="bas">Entrée</Radio.Button>
                  <Radio.Button value="milieu">Milieu</Radio.Button>
                  <Radio.Button value="haut">Haut</Radio.Button>
                </Radio.Group>
                <Space>
                  <Switch checked={hideAnomalies} onChange={setHideAnomalies} />
                  <Text style={{ color: token.colorTextSecondary }}>Masquer anomalies</Text>
                </Space>
              </div>
            </Space>
          </motion.div>

          {/* CONTENT */}
          {viewMode === 'table' ? (
            <ProTable<Product> columns={columns} actionRef={actionRef} rowKey="id" search={false} scroll={{ x: 1000 }}
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t, r) => `${r[0]}-${r[1]} sur ${t} produits` }}
              rowClassName={(r) => enrich(r).is_anomaly ? 'row-anomaly' : ''}
              request={async (params = {}, sort) => {
                const res = await fetchProducts({ ...params, query: queryRef.current, platform, sort });
                let filtered = res.data.map((p: Product) => {
                  const a = analysisMap.get(p.id);
                  return a ? { ...p, cluster_label: a.cluster_label, is_anomaly: a.is_anomaly } : p;
                });

                if (cluster !== 'all') {
                  filtered = filtered.filter((p: Product) => {
                    if (cluster === 'bas') return p.cluster_label === 'Entrée de gamme';
                    if (cluster === 'milieu') return p.cluster_label === 'Milieu de gamme';
                    if (cluster === 'haut') return p.cluster_label === 'Haut de gamme';
                    return true;
                  });
                }
                if (hideAnomalies) {
                  filtered = filtered.filter((p: Product) => !p.is_anomaly);
                }

                return {
                  data: filtered,
                  success: true,
                  total: res.total,
                };
              }}
              locale={{
                emptyText: (
                  <Empty description={<span style={{ color: token.colorTextSecondary }}>Aucun produit trouvé pour l'instant. {scrapingTaskId ? "Les produits apparaîtront ici d'une seconde à l'autre..." : ""}</span>} image={Empty.PRESENTED_IMAGE_SIMPLE}>
                    {!scrapingTaskId && <Button type="primary" onClick={() => navigate('/')}>Modifier la recherche</Button>}
                  </Empty>
                )
              }}
            />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {cardLoading ? <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
                : cardData.length === 0 ? <div style={{ textAlign: 'center', padding: 80 }}><Empty description={<span style={{ color: token.colorTextSecondary }}>Aucun produit trouvé pour l'instant. {scrapingTaskId ? "Les produits apparaîtront ici d'une seconde à l'autre..." : ""}</span>} /></div>
                : <>
                    <Row gutter={[20, 20]}>
                      {cardData.map(p => <Col xs={24} sm={12} md={8} lg={6} key={p.id}><ProductCard product={enrich(p)} onView={openDetail} /></Col>)}
                    </Row>
                    <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
                      <Button disabled={cardPage <= 1} onClick={() => setCardPage(p => p - 1)} style={{ borderRadius: 10 }}>← Précédent</Button>
                      <Text style={{ color: token.colorTextSecondary }}>Page {cardPage} / {Math.ceil(cardTotal / 20) || 1} — {cardTotal} produits</Text>
                      <Button disabled={cardPage >= Math.ceil(cardTotal / 20)} onClick={() => setCardPage(p => p + 1)} style={{ borderRadius: 10 }}>Suivant →</Button>
                    </div>
                  </>}
            </motion.div>
          )}
        </div>

        {/* DETAIL MODAL */}
        <ProductDetailModal product={selectedProduct} open={modalOpen} onClose={() => setModalOpen(false)} />

        <style>{`
          .row-anomaly { background-color: ${token.colorErrorBg} !important; }
        `}</style>
      </div>
    </ConfigProvider>
  );
};

export default ProductsListPage;
