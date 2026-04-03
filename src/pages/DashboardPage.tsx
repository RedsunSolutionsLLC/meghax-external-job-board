import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tabs,
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Row,
  Col,
  Input,
  Select,
  Pagination,
  Spin,
  Empty,
} from 'antd';
import {
  EnvironmentFilled,
  ClockCircleFilled,
  SearchOutlined,
  AppstoreOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { fetchMyApplications, fetchExternalJobs } from '../api/jobs';
import type { MyApplication, Job } from '../api/types';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  submitted: 'blue',
  applied: 'blue',
  applying: 'blue',
  rejected: 'red',
  interview: 'purple',
  offer_pending: 'orange',
  offer_withdrawn: 'orange',
  accepted: 'green',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      {/* Welcome banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1A1210 0%, #2A1F1E 100%)',
          borderRadius: 12,
          padding: '28px 32px',
          marginBottom: 28,
          color: '#fff',
        }}
      >
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          Welcome back, {user?.first_name}!
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
          Track your applications and discover new opportunities.
        </Text>
      </div>

      <Tabs
        defaultActiveKey="applications"
        items={[
          {
            key: 'applications',
            label: (
              <span><FileTextOutlined style={{ marginRight: 6 }} />My Applications</span>
            ),
            children: <MyApplicationsTab />,
          },
          {
            key: 'jobs',
            label: (
              <span><AppstoreOutlined style={{ marginRight: 6 }} />All Jobs</span>
            ),
            children: <AllJobsTab navigate={navigate} />,
          },
        ]}
      />
    </div>
  );
}

function MyApplicationsTab() {
  const [data, setData] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchMyApplications({ page, per_page: 10 })
      .then((res) => {
        setData(res.applications);
        setTotal(res.pagination.total);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [page]);

  const columns: ColumnsType<MyApplication> = [
    {
      title: 'Job Title',
      dataIndex: ['job', 'title'],
      key: 'title',
      render: (title: string, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/applications/${record.uuid}`)}
          style={{ padding: 0 }}
        >
          {title}
        </Button>
      ),
    },
    {
      title: 'Company',
      key: 'company',
      render: (_: unknown, record: MyApplication) => record.job?.company?.name ?? '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] ?? 'default'}>
          {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </Tag>
      ),
    },
    {
      title: 'Applied',
      key: 'applied_at',
      render: (_: unknown, record: MyApplication) => {
        const d = record.submitted_at || record.created_at;
        return d ? new Date(d).toLocaleDateString() : '—';
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="uuid"
      loading={loading}
      pagination={{
        current: page,
        total,
        pageSize: 10,
        onChange: setPage,
      }}
      locale={{ emptyText: <Empty description="No applications yet" /> }}
    />
  );
}

function AllJobsTab({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchExternalJobs({
        page,
        per_page: 12,
        search: search || undefined,
        location: location || undefined,
      });
      setJobs(res.jobs);
      setTotal(res.pagination.total);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, location]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const formatLocation = (job: Job) => {
    if (job.job_location?.city) {
      return `${job.job_location.city}${job.job_location.state ? `, ${job.job_location.state}` : ''}`;
    }
    return job.location.charAt(0).toUpperCase() + job.location.slice(1);
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Input
            placeholder="Search jobs..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
        <Col xs={24} md={6}>
          <Select
            placeholder="Location"
            style={{ width: '100%' }}
            value={location || undefined}
            onChange={(val) => {
              setLocation(val || '');
              setPage(1);
            }}
            allowClear
            options={[
              { label: 'Remote', value: 'remote' },
              { label: 'Onsite', value: 'onsite' },
              { label: 'Hybrid', value: 'hybrid' },
            ]}
          />
        </Col>
      </Row>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : jobs.length === 0 ? (
        <Empty description="No jobs found" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {jobs.map((job) => (
              <Col xs={24} sm={12} lg={8} key={job.uuid}>
                <Card
                  hoverable
                  onClick={() => navigate(`/jobs/${job.uuid}`)}
                  style={{
                    height: '100%',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '';
                    (e.currentTarget as HTMLElement).style.transform = '';
                  }}
                >
                  <Title level={5} style={{ marginBottom: 4 }}>
                    {job.title}
                  </Title>
                  {job.company?.name && (
                    <Text type="secondary">{job.company.name}</Text>
                  )}
                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    <Tag icon={<EnvironmentFilled />} color="blue">
                      {formatLocation(job)}
                    </Tag>
                    {job.employment_type && (
                      <Tag color="green">{job.employment_type}</Tag>
                    )}
                    {job.is_applied && <Tag color="orange">Applied</Tag>}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <ClockCircleFilled style={{ color: '#999', marginRight: 4 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {job.created_at
                        ? new Date(job.created_at).toLocaleDateString()
                        : ''}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          {total > 12 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination
                current={page}
                total={total}
                pageSize={12}
                onChange={setPage}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
