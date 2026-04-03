import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Card,
  Typography,
  Tag,
  Divider,
  Button,
  Alert,
  Row,
  Col,
  Space,
  Spin,
  Result,
  App,
  Checkbox,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import {
  fetchApplicationDetail,
  confirmInterviewSlot,
  cancelInterview as cancelInterviewApi,
} from '../api/jobs';
import type { ApplicationDetail, Interview, TimeSlot } from '../api/types';

const { Text } = Typography;

const STATUS_CONFIG: Record<string, { color: string; label: string; alertType: 'info' | 'success' | 'warning' | 'error' }> = {
  applied: { color: 'blue', label: 'Applied', alertType: 'info' },
  interview: { color: 'purple', label: 'Interview Date Confirmation Needed', alertType: 'warning' },
  offer_pending: { color: 'orange', label: 'Offer Pending', alertType: 'info' },
  accepted: { color: 'green', label: 'Accepted', alertType: 'success' },
  rejected: { color: 'red', label: 'Rejected', alertType: 'error' },
  offer_withdrawn: { color: 'orange', label: 'Offer Withdrawn', alertType: 'warning' },
};

const INTERVIEW_TYPE_COLOR: Record<string, string> = {
  'Screening Call': 'cyan',
  Interview: 'blue',
  'Final Interview': 'purple',
  'AI Interview': 'geekblue',
  Technical: 'volcano',
  'Phone Screening': 'lime',
  Behavioral: 'magenta',
};

interface SlotSelection {
  slotId: number | null;
  confirming: boolean;
  confirmed: boolean;
}

export default function ApplicationDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { message: msg } = App.useApp();

  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selections, setSelections] = useState<Record<string, SlotSelection>>({});

  const loadDetail = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const detail = await fetchApplicationDetail(uuid);
      setData(detail);

      // Initialize selections per interview type
      const sel: Record<string, SlotSelection> = {};
      for (const iv of detail.interviews) {
        const hasConfirmed = iv.time_slots.some((s) => s.is_selected);
        sel[iv.uuid] = {
          slotId: null,
          confirming: false,
          confirmed: hasConfirmed,
        };
      }
      setSelections(sel);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleConfirm = async (interview: Interview) => {
    const sel = selections[interview.uuid];
    if (!sel?.slotId) return;

    setSelections((prev) => {
      const cur = prev[interview.uuid] ?? { slotId: null, confirming: false, confirmed: false };
      return { ...prev, [interview.uuid]: { slotId: cur.slotId, confirming: true, confirmed: cur.confirmed } };
    });

    try {
      await confirmInterviewSlot(interview.uuid, sel.slotId);
      msg.success('Interview time slot confirmed!');
      await loadDetail(); // Refresh to get updated status
    } catch {
      msg.error('Failed to confirm time slot.');
    } finally {
      setSelections((prev) => {
        const cur = prev[interview.uuid] ?? { slotId: null, confirming: false, confirmed: false };
        return { ...prev, [interview.uuid]: { slotId: cur.slotId, confirming: false, confirmed: cur.confirmed } };
      });
    }
  };

  const handleCancel = async (interview: Interview) => {
    try {
      await cancelInterviewApi(interview.uuid);
      msg.success('Interview cancelled.');
      await loadDetail();
    } catch {
      msg.error('Failed to cancel interview.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <Result
        status="404"
        title="Application Not Found"
        subTitle="The application you are looking for does not exist."
        extra={<Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>}
      />
    );
  }

  const { application, job, interviews } = data;
  const statusConf = STATUS_CONFIG[application.status] ?? { color: 'default', label: application.status, alertType: 'info' as const };

  const formatSalary = (from?: number, to?: number) => {
    if (!from && !to) return '—';
    const fmt = (n: number) => `$${n.toLocaleString()}`;
    if (from && to) return `${fmt(from)} – ${fmt(to)}`;
    if (from) return `From ${fmt(from)}`;
    return `Up to ${fmt(to!)}`;
  };

  // Group interviews by type for display
  const interviewsByType = interviews.reduce<Record<string, { slots: TimeSlot[]; representative: Interview }>>((acc, iv) => {
    const key = iv.interview_type;
    if (!acc[key]) {
      acc[key] = { slots: [], representative: iv };
    }
    acc[key].slots.push(...iv.time_slots);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* Back button */}
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')}>
          Back
        </Button>

        {/* Status banner */}
        <Alert
          type={statusConf.alertType}
          showIcon
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <CalendarOutlined style={{ marginRight: 8 }} />
                {application.status === 'interview'
                  ? 'The client has requested you to confirm your availability for an interview. Please select a date and time below.'
                  : `Your application status: ${statusConf.label}`}
              </span>
              <Tag color={statusConf.color}>{statusConf.label}</Tag>
            </div>
          }
        />

        {/* Interview confirmation section */}
        {interviews.length > 0 && (
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <span>Confirm Interview Date</span>
              </Space>
            }
            bordered={false}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {Object.entries(interviewsByType).map(([type, { slots, representative }]) => {
                const sel = selections[representative.uuid];
                const color = INTERVIEW_TYPE_COLOR[type] ?? 'blue';
                const hasConfirmedSlot = slots.some((s) => s.is_selected);

                return (
                  <Card
                    key={type}
                    bordered
                    style={{ borderRadius: 8 }}
                    title={<Tag color={color}>{type}</Tag>}
                    extra={
                      sel?.confirmed || hasConfirmedSlot ? (
                        <Tag icon={<CheckCircleOutlined />} color="success">Confirmed</Tag>
                      ) : (
                        <Tag color="warning">{representative.status}</Tag>
                      )
                    }
                  >
                    {sel?.confirmed || hasConfirmedSlot ? (
                      <Alert
                        type="success"
                        showIcon
                        message="You have already confirmed a time slot for this interview."
                      />
                    ) : representative.interview_link ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <LinkOutlined style={{ color: '#8c8c8c' }} />
                          <Text
                            style={{ flex: 1, wordBreak: 'break-all' }}
                            copyable
                          >
                            {representative.interview_link}
                          </Text>
                        </div>
                        <Button
                          type="primary"
                          icon={<LinkOutlined />}
                          href={representative.interview_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Join Interview
                        </Button>
                      </div>
                    ) : slots.length === 0 ? (
                      <Text type="secondary">No available slots. Please contact the recruiter.</Text>
                    ) : (
                      <>
                        <div style={{ marginBottom: 12 }}>
                          <Text>
                            Select a time slot to schedule the <strong>{type}</strong> interview.
                          </Text>
                        </div>

                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          {slots.map((slot, idx) => {
                            const isChecked = sel?.slotId === slot.id;
                            const isSlotSelected = slot.is_selected;

                            return (
                              <div
                                key={idx}
                                style={{
                                  cursor: hasConfirmedSlot ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '10px 14px',
                                  border: `2px solid ${isSlotSelected || isChecked ? '#1677ff' : '#d9d9d9'}`,
                                  borderRadius: 8,
                                  backgroundColor: isSlotSelected || isChecked ? '#e6f4ff' : '#fff',
                                  transition: 'all 0.2s',
                                  opacity: hasConfirmedSlot && !isSlotSelected ? 0.5 : 1,
                                }}
                                onClick={() => {
                                  if (hasConfirmedSlot) return;
                                  setSelections((prev) => {
                                    const cur = prev[representative.uuid] ?? { slotId: null, confirming: false, confirmed: false };
                                    return { ...prev, [representative.uuid]: { slotId: isChecked ? null : slot.id, confirming: cur.confirming, confirmed: cur.confirmed } };
                                  });
                                }}
                              >
                                <Checkbox
                                  checked={isChecked || isSlotSelected}
                                  disabled={hasConfirmedSlot}
                                />
                                <CalendarOutlined
                                  style={{ color: isChecked || isSlotSelected ? '#1677ff' : '#999', fontSize: 15 }}
                                />
                                <Text style={{ color: isChecked || isSlotSelected ? '#1677ff' : undefined }}>
                                  {dayjs(slot.slot_date).format('MM/DD/YYYY')}, {slot.slot_time}
                                  {slot.duration_minutes && (
                                    <Text type="secondary"> · {slot.duration_minutes} min</Text>
                                  )}
                                  {slot.timezone && (
                                    <Text type="secondary"> · {slot.timezone}</Text>
                                  )}
                                  {isSlotSelected && (
                                    <Tag color="success" style={{ marginLeft: 8 }}>Confirmed</Tag>
                                  )}
                                </Text>
                              </div>
                            );
                          })}
                        </Space>

                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                          <Button
                            type="primary"
                            disabled={!sel?.slotId}
                            loading={sel?.confirming}
                            onClick={() => handleConfirm(representative)}
                          >
                            Confirm Interview
                          </Button>
                          <Button
                            danger
                            onClick={() => handleCancel(representative)}
                          >
                            Cancel Interview
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                );
              })}
            </Space>
          </Card>
        )}

        {/* Job Details */}
        {job && (
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>Job Details</span>
              </Space>
            }
            bordered={false}
          >
            <Row gutter={[16, 24]}>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <EnvironmentOutlined style={{ marginTop: 4 }} />
                  <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Location</Text>
                    <Text>
                      {job.job_location
                        ? [job.job_location.city, job.job_location.state, job.job_location.country]
                            .filter(Boolean)
                            .join(', ') || job.location || '—'
                        : job.location
                          ? job.location.charAt(0).toUpperCase() + job.location.slice(1)
                          : '—'}
                    </Text>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <FileTextOutlined style={{ marginTop: 4 }} />
                  <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Employment Type</Text>
                    <Text>{job.employment_type || '—'}</Text>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <DollarOutlined style={{ marginTop: 4 }} />
                  <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Salary Range</Text>
                    <Text>{formatSalary(job.pay_details?.pay_rate_from, job.pay_details?.pay_rate_to)}</Text>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CalendarOutlined style={{ marginTop: 4 }} />
                  <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Posted</Text>
                    <Text>{job.created_at ? dayjs(job.created_at).format('MM/DD/YYYY') : '—'}</Text>
                  </div>
                </div>
              </Col>

              <Divider style={{ margin: 0 }} />

              <Col span={24}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Job Description</Text>
                {job.job_description ? (
                  <div dangerouslySetInnerHTML={{ __html: job.job_description }} />
                ) : (
                  <Text>—</Text>
                )}
              </Col>

              <Divider style={{ margin: 0 }} />

              <Col span={24}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Required Skills</Text>
                <Space wrap>
                  {job.primary_skills?.map((skill) => (
                    <Tag key={skill}>{skill}</Tag>
                  ))}
                  {(!job.primary_skills || job.primary_skills.length === 0) && <Text>—</Text>}
                </Space>
              </Col>

              <Divider style={{ margin: 0 }} />

              <Col span={24}>
                <Space>
                  {job.tags?.map((tag) => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                  <Tag>{job.positions || 0} position{(job.positions || 0) !== 1 ? 's' : ''}</Tag>
                </Space>
              </Col>
            </Row>
          </Card>
        )}
      </Space>
    </div>
  );
}
