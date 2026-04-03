import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Layout, Button, Space, Typography, Avatar, Popover, Switch } from 'antd';
import { UserOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function MainLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const { themeMode, switchMode } = useTheme();
  const navigate = useNavigate();
  const isDark = themeMode === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenu = (
    <div style={{ minWidth: 180 }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${isDark ? '#2A1F1E' : '#EDE7E4'}` }}>
        <Text strong style={{ display: 'block' }}>{user?.first_name} {user?.last_name}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>{user?.email}</Text>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space size={8}>
          {isDark ? <MoonOutlined style={{ color: '#E8724A' }} /> : <SunOutlined style={{ color: '#B8620A' }} />}
          <Text style={{ fontSize: 13 }}>{isDark ? 'Dark' : 'Light'}</Text>
        </Space>
        <Switch
          size="small"
          checked={isDark}
          onChange={(checked) => switchMode(checked ? 'dark' : 'light')}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
        />
      </div>
      <div style={{ padding: '4px 12px 8px' }}>
        <Button block size="small" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isDark
            ? 'linear-gradient(135deg, #0C0A0A 0%, #1A1110 100%)'
            : 'linear-gradient(135deg, #1A1210 0%, #2A1F1E 100%)',
          boxShadow: '0 2px 8px rgba(12,10,10,0.3)',
          padding: '0 48px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 56,
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(217,79,61,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#fff',
              fontSize: 16,
            }}
          >
            M
          </div>
          <Title level={5} style={{ margin: 0, color: '#E8724A', letterSpacing: -0.5 }}>
            MeghaX Jobs
          </Title>
        </Link>

        <Space size={12}>
          {isAuthenticated ? (
            <>
              <Button
                type="text"
                onClick={() => navigate('/dashboard')}
                style={{ color: '#fff' }}
              >
                Dashboard
              </Button>
              <Popover content={userMenu} trigger="click" placement="bottomRight" arrow={false}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    style={{ background: 'rgba(217,79,61,0.4)' }}
                  />
                  <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {user?.first_name}
                  </Text>
                </div>
              </Popover>
            </>
          ) : (
            <>
              <Button
                type="text"
                onClick={() => navigate('/login')}
                style={{ color: '#fff' }}
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate('/register')}
                style={{
                  background: '#D94F3D',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                Register
              </Button>
            </>
          )}
        </Space>
      </Header>

      <Content style={{ padding: '32px 48px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center', color: '#9C8480', background: 'transparent', fontSize: 13 }}>
        MeghaX Job Board &copy; {new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}
