import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Tag,
  Typography,
  Spin,
  Empty,
  Pagination,
} from 'antd';
import {
  EnvironmentFilled,
  ClockCircleFilled,
  SearchOutlined,
} from '@ant-design/icons';
import { fetchExternalJobs } from '../api/jobs';
import type { Job } from '../api/types';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function JobListPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
      // If not authenticated, that's expected — show empty
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, location, isAuthenticated]);

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
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <Title level={2}>Find Your Next Opportunity</Title>
        <Text type="secondary">
          Browse open positions and apply directly
        </Text>
      </div>

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Input
            size="large"
            placeholder="Search jobs by title, skills..."
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
            size="large"
            placeholder="Location type"
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

      {/* Job Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : jobs.length === 0 ? (
        <Empty description="No jobs available right now" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {jobs.map((job) => (
              <Col xs={24} sm={12} lg={8} key={job.uuid}>
                <Card
                  hoverable
                  onClick={() => navigate(`/jobs/${job.uuid}`)}
                  style={{ height: '100%' }}
                >
                  <Title level={5} style={{ marginBottom: 4 }}>
                    {job.title}
                  </Title>
                  {job.company?.name && (
                    <Text type="secondary">{job.company.name}</Text>
                  )}

                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Tag icon={<EnvironmentFilled />} color="blue">
                      {formatLocation(job)}
                    </Tag>
                    {job.employment_type && (
                      <Tag color="green">{job.employment_type}</Tag>
                    )}
                    {job.is_applied && <Tag color="orange">Applied</Tag>}
                  </div>

                  {job.primary_skills && job.primary_skills.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {job.primary_skills.slice(0, 4).map((skill) => (
                        <Tag key={skill}>{skill}</Tag>
                      ))}
                      {job.primary_skills.length > 4 && (
                        <Tag>+{job.primary_skills.length - 4}</Tag>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ClockCircleFilled style={{ color: '#999' }} />
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
            <div style={{ textAlign: 'center', marginTop: 24 }}>
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
