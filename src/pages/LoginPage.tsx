import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, App } from 'antd';
import { login } from '../api/jobs';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const { message: msg } = App.useApp();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await login(values.email, values.password);
      setAuth(res.user, res.token);
      msg.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      msg.error(error.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '48px auto 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#f0a030' }}>MeghaX</span>
      </div>
      <Card style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          Sign In
        </Title>
        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input size="large" placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input.Password size="large" placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Text style={{ display: 'block', textAlign: 'center' }}>
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </Text>
      </Card>
    </div>
  );
}
