import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, App } from 'antd';
import { register } from '../api/jobs';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuth();
  const { message: msg } = App.useApp();
  const emailFromUrl = searchParams.get('email') || '';

  const handleRegister = async (values: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => {
    setLoading(true);
    try {
      const res = await register(values);
      setAuth(res.user, res.token);
      msg.success('Account created!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        msg.error(firstError?.[0] ?? 'Registration failed');
      } else {
        msg.error(error.response?.data?.message ?? 'Registration failed');
      }
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
          Create Account
        </Title>
        <Form layout="vertical" onFinish={handleRegister} initialValues={{ email: emailFromUrl }}>
          <Form.Item
            name="first_name"
            label="First Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input size="large" placeholder="John" />
          </Form.Item>

          <Form.Item
            name="last_name"
            label="Last Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input size="large" placeholder="Doe" />
          </Form.Item>

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
            rules={[
              { required: true, message: 'Required' },
              { min: 8, message: 'At least 8 characters' },
            ]}
          >
            <Input.Password size="large" placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="password_confirmation"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Required' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password size="large" placeholder="Confirm password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Register
            </Button>
          </Form.Item>
        </Form>

        <Text style={{ display: 'block', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </Text>
      </Card>
    </div>
  );
}
