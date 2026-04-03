import React, { useState } from 'react';
import {
  Card,
  Tag,
  Typography,
  Row,
  Col,
  Space,
  Progress,
  Tabs,
  Spin,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from 'recharts';
import type { ResumeAnalysisResult } from '../api/jobs';

const { Title, Text, Paragraph } = Typography;

interface ResumeMatcherResultsProps {
  analysis: ResumeAnalysisResult;
  jobTitle: string;
  loading?: boolean;
}

/* ---------- Loading screen shown during analysis ---------- */
export const ResumeMatcherLoading: React.FC<{ jobTitle: string }> = ({
  jobTitle,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-8">
    <div className="relative mb-8">
      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
        <SearchOutlined className="text-white text-4xl" />
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center animate-bounce">
        <ThunderboltOutlined className="text-white text-sm" />
      </div>
    </div>
    <Title level={3} className="!mb-2 text-center">
      Analyzing Your Resume...
    </Title>
    <Text type="secondary" className="text-center text-base max-w-md">
      Our AI is matching your qualifications against the job requirements for{' '}
      <strong>{jobTitle}</strong>. This may take a moment.
    </Text>
    <div className="mt-8">
      <Spin size="large" />
    </div>
  </div>
);

/* ---------- Full results display ---------- */
const ResumeMatcherResults: React.FC<ResumeMatcherResultsProps> = ({
  analysis,
  jobTitle,
}) => {
  const [activeTab, setActiveTab] = useState('keywords');

  const scoreColor =
    analysis.match_score >= 75
      ? '#52c41a'
      : analysis.match_score >= 50
        ? '#faad14'
        : '#ff4d4f';

  // Radar chart data — communication style
  const radarData = [
    {
      subject: 'Analytical',
      candidate: analysis.communication_style?.analytical ?? 0,
      ideal: 80,
    },
    {
      subject: 'Creative',
      candidate: analysis.communication_style?.creative ?? 0,
      ideal: 70,
    },
    {
      subject: 'Collaborative',
      candidate: analysis.communication_style?.collaborative ?? 0,
      ideal: 85,
    },
    {
      subject: 'Data-Driven',
      candidate: analysis.communication_style?.data_driven ?? 0,
      ideal: 75,
    },
    {
      subject: 'Formal',
      candidate: analysis.communication_style?.formal ?? 0,
      ideal: 65,
    },
  ];

  // Professional journey chart data
  const journeyData = (analysis.professional_journey ?? []).map(
    (p: { year: number; seniority: number; milestone: string | null }) => ({
      year: p.year,
      seniority: p.seniority,
      milestone: p.milestone,
    })
  );

  const seniorityLabel = (value: number) => {
    const labels: Record<number, string> = {
      1: 'Entry',
      2: 'Junior',
      3: 'Mid',
      4: 'Senior',
      5: 'Lead',
      6: 'Principal',
      7: 'Director',
      8: 'Executive',
    };
    return labels[value] || '';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center mb-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <ThunderboltOutlined className="text-blue-600 text-xl" />
          <Title level={4} className="!m-0">
            Resume Matcher AI
          </Title>
        </div>
        <Text type="secondary">
          Applying for: <strong>{jobTitle}</strong>
        </Text>
      </div>

      {/* Candidate Info + Match Score */}
      <Card bordered className="!mb-0">
        <Row align="middle" gutter={24}>
          <Col flex="auto">
            <Title level={4} className="!mb-0">
              {analysis.candidate_name || 'Candidate'}
            </Title>
            <Text type="secondary">
              {analysis.candidate_title || 'Professional'}
            </Text>
          </Col>
          <Col>
            <Progress
              type="circle"
              percent={analysis.match_score}
              size={90}
              strokeColor={scoreColor}
              format={(p) => (
                <span style={{ color: scoreColor, fontWeight: 700 }}>{p}%</span>
              )}
            />
            <div className="text-center mt-1">
              <Text strong style={{ color: scoreColor }}>
                Match Score
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* AI First Impression */}
      <Card bordered>
        <Title level={5} className="!mb-2">
          AI First Impression
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          {analysis.ai_first_impression}
        </Paragraph>
      </Card>

      {/* Key Strengths */}
      <Card bordered>
        <Title level={5} className="!mb-3">
          Key Strengths
        </Title>
        <div className="space-y-2">
          {(analysis.key_strengths ?? []).map((strength: string, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircleOutlined className="text-green-500 mt-1 flex-shrink-0" />
              <Text>{strength}</Text>
            </div>
          ))}
        </div>
      </Card>

      {/* Potential Gaps */}
      <Card bordered>
        <Title level={5} className="!mb-3">
          Potential Gaps
        </Title>
        <div className="space-y-2">
          {(analysis.potential_gaps ?? []).map((gap: string, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <ExclamationCircleOutlined className="text-red-500 mt-1 flex-shrink-0" />
              <Text>{gap}</Text>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabbed Section: Keyword Analysis | Quantifiable Impact | Clear Explanation */}
      <Card bordered>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'keywords',
              label: 'Keyword Analysis',
              children: (
                <div className="space-y-4">
                  {analysis.keyword_analysis?.matched?.length > 0 && (
                    <div>
                      <Text strong className="block mb-2">
                        Matched Keywords
                      </Text>
                      <Space wrap>
                        {analysis.keyword_analysis.matched.map(
                          (kw: string, i: number) => (
                            <Tag key={i} color="green">
                              {kw}
                            </Tag>
                          )
                        )}
                      </Space>
                    </div>
                  )}
                  {analysis.keyword_analysis?.missing?.length > 0 && (
                    <div>
                      <Text strong className="block mb-2">
                        Missing Keywords
                      </Text>
                      <Space wrap>
                        {analysis.keyword_analysis.missing.map(
                          (kw: string, i: number) => (
                            <Tag key={i} color="red">
                              {kw}
                            </Tag>
                          )
                        )}
                      </Space>
                    </div>
                  )}
                  {analysis.keyword_analysis?.additional?.length > 0 && (
                    <div>
                      <Text strong className="block mb-2">
                        Additional Skills
                      </Text>
                      <Space wrap>
                        {analysis.keyword_analysis.additional.map(
                          (kw: string, i: number) => (
                            <Tag key={i} color="blue">
                              {kw}
                            </Tag>
                          )
                        )}
                      </Space>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'impact',
              label: 'Quantifiable Impact',
              children: (
                <Row gutter={[12, 12]}>
                  {[
                    {
                      label: 'Team Size Led',
                      value: analysis.quantifiable_impact?.team_size,
                    },
                    {
                      label: 'Performance',
                      value: analysis.quantifiable_impact?.performance,
                    },
                    {
                      label: 'Cost Reduction',
                      value: analysis.quantifiable_impact?.cost_reduction,
                    },
                    {
                      label: 'Projects Delivered',
                      value: analysis.quantifiable_impact?.projects_delivered,
                    },
                  ].map((m, i) => (
                    <Col span={12} key={i}>
                      <Card
                        bordered={false}
                        className="bg-blue-50 rounded-xl text-center p-4"
                      >
                        <Text type="secondary" className="block text-xs mb-1">
                          {m.label}
                        </Text>
                        <Text strong className="text-blue-700 block">
                          {m.value || 'N/A'}
                        </Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ),
            },
            {
              key: 'explanation',
              label: 'Clear Explanation',
              children: (
                <Paragraph type="secondary">
                  {analysis.clear_explanation}
                </Paragraph>
              ),
            },
          ]}
        />
      </Card>

      {/* Missing Keywords from Job Description */}
      {analysis.missing_keywords?.length > 0 && (
        <Card bordered>
          <Title level={5} className="!mb-3">
            Missing Keywords from Job Description
          </Title>
          <Space wrap>
            {analysis.missing_keywords.map((kw: string, i: number) => (
              <Tag key={i} color="red">
                {kw}
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* Inferred Communication Style — Radar Chart */}
      {analysis.communication_style && (
        <Card bordered>
          <Title level={5} className="!mb-1">
            Inferred Communication Style
          </Title>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar
                  name="Applicant Profile"
                  dataKey="candidate"
                  stroke="#7C3AED"
                  fill="#7C3AED"
                  fillOpacity={0.4}
                />
                <Radar
                  name="Ideal Profile"
                  dataKey="ideal"
                  stroke="#D94F3D"
                  fill="#D94F3D"
                  fillOpacity={0.15}
                  strokeDasharray="5 5"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mb-2">
            <Space>
              <div className="w-3 h-3 rounded-full bg-purple-600" />
              <Text type="secondary" className="text-xs">
                Applicant Profile
              </Text>
            </Space>
            <Space>
              <div className="w-3 h-3 rounded-full bg-blue-600 opacity-40" />
              <Text type="secondary" className="text-xs">
                Ideal Profile
              </Text>
            </Space>
          </div>
          {analysis.communication_style.description && (
            <Paragraph type="secondary" className="!mb-0 mt-2">
              {analysis.communication_style.description}
            </Paragraph>
          )}
        </Card>
      )}

      {/* Professional Journey — Area Chart */}
      {journeyData.length > 0 && (
        <Card bordered>
          <Title level={5} className="!mb-1">
            Professional Journey
          </Title>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={journeyData}>
                <defs>
                  <linearGradient
                    id="seniorityGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis
                  domain={[0, 8]}
                  tickFormatter={seniorityLabel}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: any) => [
                    seniorityLabel(value as number),
                    'Seniority Level',
                  ]}
                  labelFormatter={(label: any) => `Year: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="seniority"
                  stroke="#7C3AED"
                  fill="url(#seniorityGrad)"
                  strokeWidth={2}
                />
                {journeyData
                  .filter((p: { milestone: string | null }) => p.milestone)
                  .map(
                    (
                      p: {
                        year: number;
                        seniority: number;
                        milestone: string | null;
                      },
                      i: number
                    ) => (
                      <ReferenceDot
                        key={i}
                        x={p.year}
                        y={p.seniority}
                        r={6}
                        fill="#7C3AED"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    )
                  )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Milestone labels */}
          <div className="flex flex-wrap gap-3 mt-2">
            {journeyData
              .filter((p: { milestone: string | null }) => p.milestone)
              .map((p: { milestone: string | null }, i: number) => (
                <Tag key={i} color="purple">
                  {p.milestone}
                </Tag>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResumeMatcherResults;
