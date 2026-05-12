import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, LineChartOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const onFinish = async (values: any) => {
    try {
      await login(values);
      message.success('Connexion réussie !');
      navigate(from, { replace: true });
    } catch (error: any) {
      message.error(error.message || 'Identifiants incorrects. Veuillez réessayer.');
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
        background: 'radial-gradient(ellipse at 50% 0%, rgba(77,161,255,0.08) 0%, transparent 60%)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            padding: '44px 40px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 36, color: '#4da1ff', marginBottom: 12 }}>
                <LineChartOutlined />
              </div>
              <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Connexion</Title>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                Connectez-vous pour accéder à vos analyses
              </Text>
            </div>

            <Form form={form} name="login" onFinish={onFinish} layout="vertical" requiredMark={false}>
              <Form.Item name="username" rules={[{ required: true, message: "Nom d'utilisateur requis" }]}>
                <Input
                  prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.35)' }} />}
                  placeholder="Nom d'utilisateur"
                  size="large"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: 'Mot de passe requis' }]}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.35)' }} />}
                  placeholder="Mot de passe"
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
                    background: 'linear-gradient(90deg, #3884ff 0%, #624aff 100%)',
                    border: 'none',
                  }}
                >
                  Se connecter
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                  Pas encore de compte ?{' '}
                  <Link to="/register" style={{ color: '#4da1ff', fontWeight: 600 }}>Créer un compte</Link>
                </Text>
              </div>
            </Form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
