import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, LineChartOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';

const { Title, Text } = Typography;

const RegisterPage: React.FC = () => {
  const { register, loading } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      await register(values);
      message.success('Inscription réussie ! Bienvenue sur MarketMetrics.');
      navigate('/');
    } catch (error: any) {
      message.error(error.message || "Échec de l'inscription. Veuillez réessayer.");
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020b16' }}>
      <SharedHeader />
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '88px 24px 24px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(162,97,255,0.08) 0%, transparent 60%)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 440 }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            padding: '44px 40px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 36, color: '#a261ff', marginBottom: 12 }}>
                <LineChartOutlined />
              </div>
              <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Créer un compte</Title>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                Rejoignez MarketMetrics gratuitement
              </Text>
            </div>

            <Form form={form} name="register" onFinish={onFinish} layout="vertical" requiredMark={false}>
              <Form.Item name="username" rules={[{ required: true, message: "Nom d'utilisateur requis" }]}>
                <Input
                  prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.35)' }} />}
                  placeholder="Nom d'utilisateur"
                  size="large"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item name="email" rules={[
                { required: true, message: 'Email requis' },
                { type: 'email', message: 'Adresse email invalide' }
              ]}>
                <Input
                  prefix={<MailOutlined style={{ color: 'rgba(255,255,255,0.35)' }} />}
                  placeholder="Adresse email"
                  size="large"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item name="password" rules={[
                { required: true, message: 'Mot de passe requis' },
                { min: 8, message: 'Minimum 8 caractères' }
              ]}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.35)' }} />}
                  placeholder="Mot de passe (min. 8 caractères)"
                  size="large"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 12 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  style={{
                    borderRadius: 10,
                    height: 48,
                    fontSize: 15,
                    background: 'linear-gradient(90deg, #a261ff 0%, #624aff 100%)',
                    border: 'none',
                  }}
                >
                  Créer mon compte
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                  Déjà un compte ?{' '}
                  <Link to="/login" style={{ color: '#a261ff', fontWeight: 600 }}>Se connecter</Link>
                </Text>
              </div>
            </Form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
