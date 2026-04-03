import { useNavigate } from 'react-router-dom';
import { Button, Typography, Space } from 'antd';
import { RocketOutlined, SearchOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero */}
      <div
        style={{
          textAlign: 'center',
          padding: '80px 24px 60px',
          margin: '-32px -48px 0',
          background: 'linear-gradient(160deg, #FAF7F5 0%, #F2EDEA 50%, #FBEAE7 100%)',
          borderBottom: '1px solid #EDE7E4',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            background: '#fff',
            borderRadius: 20,
            marginBottom: 24,
            boxShadow: '0 1px 4px rgba(217,79,61,0.1)',
          }}
        >
          <RocketOutlined style={{ color: '#D94F3D' }} />
          <Text style={{ color: '#D94F3D', fontWeight: 600, fontSize: 13 }}>
            Your career starts here
          </Text>
        </div>

        <Title style={{ fontSize: 40, fontWeight: 800, color: '#1A1210', marginBottom: 16 }}>
          Find your next opportunity
        </Title>
        <Paragraph style={{ fontSize: 17, color: '#5C4A47', maxWidth: 520, margin: '0 auto 36px' }}>
          Browse curated positions, apply directly, and track your application
          status — all in one place.
        </Paragraph>
        <Space size="middle">
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/login')}
            style={{ height: 44, paddingInline: 32, fontWeight: 600 }}
          >
            Sign In
          </Button>
          <Button
            size="large"
            onClick={() => navigate('/register')}
            style={{ height: 44, paddingInline: 32, fontWeight: 600 }}
          >
            Create Account
          </Button>
        </Space>
      </div>

      {/* Feature pills */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 32,
          padding: '40px 24px 0',
          flexWrap: 'wrap',
        }}
      >
        {[
          { icon: <SearchOutlined />, text: 'Discover jobs tailored for you' },
          { icon: <RocketOutlined />, text: 'One-click applications' },
          { icon: <CheckCircleOutlined />, text: 'Track your progress' },
        ].map((f) => (
          <div
            key={f.text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 20px',
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            }}
          >
            <span style={{ color: '#D94F3D', fontSize: 18 }}>{f.icon}</span>
            <Text style={{ color: '#5C4A47', fontWeight: 500 }}>{f.text}</Text>
          </div>
        ))}
      </div>
    </>
  );
}
