import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
import {
  Card,
  Typography,
  Tag,
  Divider,
  Form,
  Input,
  Button,
  Radio,
  InputNumber,
  Select,
  Spin,
  Result,
  App,
  Upload,
  Row,
  Col,
  DatePicker,
  Checkbox,
  Space,
} from 'antd';
import {
  EnvironmentFilled,
  PlusOutlined,
  DeleteOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { fetchJobByUuid, applyToJob, uploadPublicAttachment, parseResumePublic } from '../api/jobs';
import type { ApplyPayload } from '../api/jobs';
import type { Job, ExperienceEntry, EducationEntry, CertificationEntry, UploadedAttachment } from '../api/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

function updateAt<T>(arr: T[], index: number, patch: Partial<T>): T[] {
  return arr.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

/** Parse a month string in either YYYY-MM or MM/YYYY format into a dayjs object */
function parseMonth(val?: string | null): ReturnType<typeof dayjs> | null {
  if (!val) return null;
  let d = dayjs(val, 'YYYY-MM');
  if (d.isValid()) return d;
  d = dayjs(val, 'MM/YYYY');
  if (d.isValid()) return d;
  return null;
}

/**
 * Transform raw <p>-only HTML from the backend into structured HTML.
 * Detects section headings, converts &nbsp;-prefixed paragraphs into <ul><li>,
 * and strips empty <p><br></p> spacers.
 */
function processJobDescription(raw: string): string {
  // Split into individual <p>...</p> blocks
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'text/html');
  const nodes = Array.from(doc.body.children) as HTMLElement[];

  let html = '';
  let inList = false;

  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i]!;
    const text = (el.textContent || '').trim();

    // Skip empty / whitespace-only / <br>-only paragraphs
    if (!text || text === '\u00a0') {
      if (inList) { html += '</ul>'; inList = false; }
      continue;
    }

    const startsWithNbsp = el.innerHTML.startsWith('&nbsp;') || el.innerHTML.startsWith('\u00a0');

    // Detect heading-like paragraphs: short, no &nbsp; prefix,
    // and next sibling is either empty or an &nbsp;-prefixed bullet item
    if (
      !startsWithNbsp &&
      text.length <= 80 &&
      !text.endsWith('.') &&
      !text.endsWith(':') ||
      // Also catch lines ending with colon that are short section titles
      (!startsWithNbsp && text.length <= 80 && text.endsWith(':') && !text.includes('. '))
    ) {
      // Look ahead: if next non-empty node starts with &nbsp; it's a heading
      let j = i + 1;
      while (j < nodes.length && !(nodes[j]!.textContent || '').trim()) j++;
      const nextText = j < nodes.length ? nodes[j]!.innerHTML : '';
      const nextIsItem = nextText.startsWith('&nbsp;') || nextText.startsWith('\u00a0');
      // Only treat as heading if it's clearly a section label
      const looksLikeHeading = text.split(' ').length <= 10 && (
        nextIsItem ||
        /^[A-Z]/.test(text) && !/^(We |You |In |The |Our |This |Join |Bachelor|Proficiency|Strong|Excellent|Familiarity|Experience|Knowledge|Developing|Collaborating|Troubleshooting|Keeping|Participating)/.test(text)
      );

      if (looksLikeHeading && i > 0) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h3>${text}</h3>`;
        continue;
      }
    }

    // Bullet item: starts with &nbsp;
    if (startsWithNbsp) {
      const content = el.innerHTML.replace(/^(&nbsp;|\u00a0)+/, '').trim();
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${content}</li>`;
      continue;
    }

    // Regular paragraph
    if (inList) { html += '</ul>'; inList = false; }
    html += `<p>${el.innerHTML}</p>`;
  }

  if (inList) html += '</ul>';
  return html;
}

export default function JobDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { message: msg } = App.useApp();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Resume & documents state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadedResumeId, setUploadedResumeId] = useState<number | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [additionalDocs, setAdditionalDocs] = useState<Array<{ file: File; name: string }>>([]);
  const [uploadedDocIds, setUploadedDocIds] = useState<UploadedAttachment[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);

  // Dynamic sections state
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);

  useEffect(() => {
    if (!uuid) return;
    setLoading(true);
    fetchJobByUuid(uuid)
      .then(setJob)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [uuid]);

  const handleResumeUpload = async (file: File) => {
    if (!uuid) return;
    const isValidType = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/rtf',
      'application/vnd.oasis.opendocument.text',
    ].includes(file.type);
    if (!isValidType) {
      msg.error('Allowed file types: PDF, DOC, DOCX, RTF, ODT');
      return;
    }
    if (file.size / 1024 / 1024 > 10) {
      msg.error('File must be smaller than 10MB');
      return;
    }
    setUploadingResume(true);
    try {
      const result = await uploadPublicAttachment(uuid, file);
      setUploadedResumeId(result.id);
      setResumeFile(file);
      msg.success('Resume uploaded successfully');

      // Parse resume with Claude AI to auto-fill the form
      setParsingResume(true);
      try {
        const parsed = await parseResumePublic(uuid, file);

        // Auto-fill personal info
        const profileFields: Record<string, string> = {};
        if (parsed.first_name) profileFields.first_name = parsed.first_name;
        if (parsed.last_name) profileFields.last_name = parsed.last_name;
        if (parsed.middle_name) profileFields.middle_name = parsed.middle_name;
        if (parsed.email) profileFields.email = parsed.email;
        if (parsed.mobile_phone) profileFields.mobile_phone = parsed.mobile_phone;
        if (parsed.country_code) profileFields.country_code = parsed.country_code;
        if (parsed.location) profileFields.location = parsed.location;
        if (Object.keys(profileFields).length > 0) {
          form.setFieldsValue(profileFields);
        }

        // Auto-fill experience
        if (parsed.experience?.length) {
          setExperience(
            parsed.experience.map((exp) => ({
              job_title: exp.job_title || '',
              company: exp.company_name || '',
              start_date: exp.start_date || '',
              end_date: exp.end_date || '',
              currently_working: exp.is_current || false,
              description: exp.description || '',
            }))
          );
        }

        // Auto-fill education
        if (parsed.education?.length) {
          setEducation(
            parsed.education.map((edu) => ({
              degree: edu.degree || '',
              institution: edu.institution || '',
              graduation_year: edu.graduation_year || '',
              gpa: edu.gpa || '',
            }))
          );
        }

        // Auto-fill skills
        if (parsed.skills?.length) {
          setSkills(parsed.skills);
        }

        // Auto-fill certifications
        if (parsed.certifications?.length) {
          setCertifications(
            parsed.certifications.map((cert) => ({
              name: cert.certification_name || '',
              issuing_org: cert.issuing_organization || '',
              date_obtained: cert.date_obtained || '',
              expiration_date: '',
            }))
          );
        }

        msg.success('Resume parsed — form auto-filled!');
      } catch {
        msg.warning('Could not auto-fill from resume. Please fill the form manually.');
      } finally {
        setParsingResume(false);
      }
    } catch {
      msg.error('Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDocUpload = async (file: File) => {
    if (!uuid) return;
    if (file.size / 1024 / 1024 > 10) {
      msg.error('File must be smaller than 10MB');
      return;
    }
    setUploadingDoc(true);
    try {
      const result = await uploadPublicAttachment(uuid, file);
      setUploadedDocIds((prev) => [...prev, { id: result.id, name: file.name, type: 'Other' }]);
      setAdditionalDocs((prev) => [...prev, { file, name: file.name }]);
      msg.success('Document uploaded');
    } catch {
      msg.error('Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleApply = async (values: Record<string, unknown>) => {
    if (!uuid) return;
    setSubmitting(true);
    try {
      // Build screening answers
      const screeningAnswers: { question_id: number; answer: string }[] = [];
      if (values.screening_answers && typeof values.screening_answers === 'object') {
        const answers = values.screening_answers as Record<string, string>;
        for (const [qId, answer] of Object.entries(answers)) {
          if (answer != null && answer !== '') {
            screeningAnswers.push({ question_id: Number(qId), answer: String(answer) });
          }
        }
      }

      // Build attachments array
      const attachments: ApplyPayload['job_application_attachments'] = [];
      if (uploadedResumeId) {
        attachments.push({ attachment_id: uploadedResumeId, type: 'Resume' });
      }
      for (const doc of uploadedDocIds) {
        attachments.push({ attachment_id: doc.id, type: 'Other' });
      }

      // Filter out incomplete entries that would fail backend validation
      const validExperience = experience.filter((exp) => exp.job_title && exp.company);
      const validEducation = education.filter((edu) => edu.degree && edu.institution);
      const validCertifications = certifications.filter((cert) => cert.name && cert.issuing_org);

      const payload: ApplyPayload = {
        profile: {
          first_name: values.first_name as string,
          last_name: values.last_name as string,
          middle_name: (values.middle_name as string) || undefined,
          email: values.email as string,
          mobile_phone: (values.mobile_phone as string) || '',
          country_code: (values.country_code as string) || '+1',
          location: (values.location as string) || undefined,
        },
        experience: validExperience.length > 0
          ? validExperience.map((exp) => ({
              job_title: exp.job_title,
              company_name: exp.company,
              start_date: exp.start_date || undefined,
              end_date: exp.end_date || undefined,
              is_current: exp.currently_working,
              description: exp.description || undefined,
            }))
          : undefined,
        education: validEducation.length > 0
          ? validEducation.map((edu) => ({
              degree: edu.degree,
              institution: edu.institution,
              year_of_graduation: edu.graduation_year || undefined,
              gpa: edu.gpa || undefined,
            }))
          : undefined,
        skills: skills.length > 0 ? skills : undefined,
        certifications: validCertifications.length > 0
          ? validCertifications.map((cert) => ({
              certification_name: cert.name,
              issuing_organization: cert.issuing_org,
              date_obtained: cert.date_obtained || undefined,
              expiration_date: cert.expiration_date || undefined,
            }))
          : undefined,
        job_application_attachments: attachments.length > 0 ? attachments : undefined,
        screening_answers: screeningAnswers.length > 0 ? screeningAnswers : undefined,
      };

      const res: any = await applyToJob(uuid, payload);
      navigate('/application-success', {
        state: { 
          jobTitle: job?.title, 
          company: job?.company?.name,
          uuid,
          applicationUuid: res?.data?.application_uuid || res?.application_uuid
        },
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; data?: Record<string, string[]> } } };
      const validationErrors = error.response?.data?.data;
      if (validationErrors && typeof validationErrors === 'object') {
        const firstError = Object.values(validationErrors)[0];
        msg.error(firstError?.[0] ?? 'Application failed');
      } else {
        msg.error(error.response?.data?.message ?? 'Failed to submit application');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <Result
        status="404"
        title="Job Not Found"
        subTitle="This job may no longer be available."
        extra={<Button onClick={() => navigate('/')}>Browse Jobs</Button>}
      />
    );
  }

  const formatLocation = () => {
    if (job.job_location?.city) {
      return `${job.job_location.city}${job.job_location.state ? `, ${job.job_location.state}` : ''}`;
    }
    return job.location.charAt(0).toUpperCase() + job.location.slice(1);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Job Header Card */}
      <Card>
        <Title level={3} style={{ marginBottom: 4 }}>{job.title}</Title>
        {job.company?.name && (
          <Text type="secondary" style={{ fontSize: 15 }}>{job.company.name}</Text>
        )}
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Tag icon={<EnvironmentFilled />}>{formatLocation()}</Tag>
          {job.employment_type && <Tag>{job.employment_type}</Tag>}
          {job.positions > 1 && <Tag>{job.positions} positions</Tag>}
        </div>

        {/* Quick info */}
        {(job.minimum_work_experience != null || job.pay_details?.pay_rate_from != null) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 16 }}>
            {job.minimum_work_experience != null && (
              <Text>Experience: <Text strong>{job.minimum_work_experience}+ years</Text></Text>
            )}
            {job.pay_details?.pay_rate_from != null && (
              <Text>
                Pay: <Text strong>
                  ${job.pay_details.pay_rate_from}
                  {job.pay_details.pay_rate_to ? ` – $${job.pay_details.pay_rate_to}` : '+'}
                  {job.pay_details.pay_type ? ` / ${job.pay_details.pay_type}` : ''}
                </Text>
              </Text>
            )}
          </div>
        )}

        {/* Required Skills */}
        {job.primary_skills && job.primary_skills.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>Required Skills: </Text>
            {job.primary_skills.map((s) => (
              <Tag key={s} color="blue" style={{ marginTop: 4 }}>{s}</Tag>
            ))}
          </div>
        )}

        {/* Job Description */}
        {job.job_description && (
          <>
            <Divider />
            <Title level={5} style={{ marginBottom: 16 }}>Description</Title>
            <div
              className="job-description-content"
              dangerouslySetInnerHTML={{ __html: processJobDescription(job.job_description) }}
            />
          </>
        )}
      </Card>

      {/* Application Form */}
      <Card title="Apply for this job" style={{ marginTop: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleApply}
          initialValues={{ country_code: '+1' }}
        >
          {/* ── Resume Upload ── */}
          <div
            style={{
              background: '#f5f5f5',
              border: '1px solid #d9d9d9',
              borderRadius: 8,
              padding: 24,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            <Upload
              beforeUpload={(file) => {
                handleResumeUpload(file);
                return false;
              }}
              showUploadList={false}
              maxCount={1}
              disabled={uploadingResume}
            >
              <Button type="link" loading={uploadingResume || parsingResume} style={{ fontSize: 16, padding: 0 }}>
                {parsingResume ? 'Parsing resume...' : uploadedResumeId ? 'Replace resume' : 'Upload resume'}
              </Button>
            </Upload>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                This will be attached to your application. 10MB max file size (Allowed file types: .doc, .pdf, .docx, .rtf, .odt)
              </Text>
            </div>
            {parsingResume && (
              <div style={{ marginTop: 8 }}>
                <Spin size="small" /> <Text type="secondary">Analyzing your resume with AI to auto-fill the form...</Text>
              </div>
            )}
            {resumeFile && !parsingResume && (
              <div style={{ marginTop: 8 }}>
                <FileOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                <Text style={{ color: '#52c41a' }}>{resumeFile.name}</Text>
              </div>
            )}
          </div>

          {/* ── Personal Information ── */}
          <Title level={5}>Personal Information</Title>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[{ required: true, message: 'Please enter your first name' }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="middle_name" label="Middle Name">
                <Input placeholder="Enter middle name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter your last name' }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="mobile_phone"
                label="Mobile Phone"
                rules={[{ required: true, message: 'Please enter your mobile phone' }]}
              >
                <Input
                  addonBefore={
                    <Form.Item name="country_code" noStyle>
                      <Select style={{ width: 70 }}>
                        <Select.Option value="+1">+1</Select.Option>
                        <Select.Option value="+91">+91</Select.Option>
                        <Select.Option value="+44">+44</Select.Option>
                        <Select.Option value="+61">+61</Select.Option>
                        <Select.Option value="+86">+86</Select.Option>
                      </Select>
                    </Form.Item>
                  }
                  placeholder="Mobile Phone"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Enter a valid email' },
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="location" label="Location">
                <Input placeholder="Enter location" />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Additional Documents ── */}
          <Divider />
          <Title level={5}>Additional Documents</Title>
          <Upload
            beforeUpload={(file) => {
              handleDocUpload(file);
              return false;
            }}
            showUploadList={false}
            disabled={uploadingDoc}
          >
            <Button type="link" icon={<PlusOutlined />} loading={uploadingDoc} style={{ padding: 0 }}>
              Add attachment
            </Button>
          </Upload>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            10MB max size
          </Text>
          {additionalDocs.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {additionalDocs.map((doc, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 12px',
                    background: '#fafafa',
                    borderRadius: 6,
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 13 }}>
                    <FileOutlined style={{ marginRight: 6 }} />
                    {doc.name}
                  </Text>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setAdditionalDocs(additionalDocs.filter((_, i) => i !== index));
                      setUploadedDocIds(uploadedDocIds.filter((_, i) => i !== index));
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Experience History ── */}
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>Experience History</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                setExperience([
                  ...experience,
                  { job_title: '', company: '', description: '', start_date: '', end_date: '', currently_working: false },
                ])
              }
            >
              Add Experience
            </Button>
          </div>
          {experience.map((exp, index) => (
            <Card
              key={index}
              size="small"
              title={`Experience #${index + 1}`}
              style={{ marginBottom: 12 }}
              extra={
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => setExperience(experience.filter((_, i) => i !== index))}
                />
              }
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ display: 'block', marginBottom: 4 }}>Job Title</Text>
                    <Input
                      placeholder="e.g., Software Engineer"
                      value={exp.job_title}
                      onChange={(e) => setExperience(updateAt(experience, index, { job_title: e.target.value }))}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ display: 'block', marginBottom: 4 }}>Company Name</Text>
                    <Input
                      placeholder="e.g., Tech Corp"
                      value={exp.company}
                      onChange={(e) => setExperience(updateAt(experience, index, { company: e.target.value }))}
                    />
                  </div>
                </Col>
              </Row>
              <div style={{ marginBottom: 12 }}>
                <Text style={{ display: 'block', marginBottom: 4 }}>Job Description</Text>
                <TextArea
                  rows={3}
                  placeholder="Describe your responsibilities and achievements..."
                  value={exp.description}
                  onChange={(e) => setExperience(updateAt(experience, index, { description: e.target.value }))}
                />
              </div>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ display: 'block', marginBottom: 4 }}>Start Date</Text>
                    <DatePicker
                      picker="month"
                      format="YYYY-MM"
                      style={{ width: '100%' }}
                      placeholder="YYYY-MM"
                      value={parseMonth(exp.start_date)}
                      onChange={(_date, dateString) => setExperience(updateAt(experience, index, { start_date: dateString as string }))}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ display: 'block', marginBottom: 4 }}>End Date</Text>
                    <DatePicker
                      picker="month"
                      format="YYYY-MM"
                      style={{ width: '100%' }}
                      placeholder="YYYY-MM"
                      value={parseMonth(exp.end_date)}
                      disabled={exp.currently_working}
                      onChange={(_date, dateString) => setExperience(updateAt(experience, index, { end_date: dateString as string }))}
                    />
                  </div>
                </Col>
              </Row>
              <Checkbox
                checked={exp.currently_working}
                onChange={(e) => {
                  setExperience(updateAt(experience, index, {
                    currently_working: e.target.checked,
                    end_date: e.target.checked ? '' : exp.end_date,
                  }));
                }}
              >
                I currently work here
              </Checkbox>
            </Card>
          ))}

          {/* ── Education ── */}
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>Education</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                setEducation([
                  ...education,
                  { degree: '', institution: '', graduation_year: '', gpa: '' },
                ])
              }
            >
              Add Education
            </Button>
          </div>
          {education.map((edu, index) => (
            <Card
              key={index}
              size="small"
              title={`Education #${index + 1}`}
              style={{ marginBottom: 12 }}
              extra={
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => setEducation(education.filter((_, i) => i !== index))}
                />
              }
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ display: 'block', marginBottom: 4 }}>Degree / Level</Text>
                    <Input
                      placeholder="e.g., Bachelor's in Computer Science"
                      value={edu.degree}
                      onChange={(e) => setEducation(updateAt(education, index, { degree: e.target.value }))}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ display: 'block', marginBottom: 4 }}>Institution</Text>
                    <Input
                      placeholder="e.g., University Name"
                      value={edu.institution}
                      onChange={(e) => setEducation(updateAt(education, index, { institution: e.target.value }))}
                    />
                  </div>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ display: 'block', marginBottom: 4 }}>Year of Graduation</Text>
                    <Input
                      placeholder="e.g., 2020"
                      value={edu.graduation_year}
                      onChange={(e) => setEducation(updateAt(education, index, { graduation_year: e.target.value }))}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ display: 'block', marginBottom: 4 }}>GPA / Percentage (Optional)</Text>
                    <Input
                      placeholder="e.g., 3.8 GPA or 85%"
                      value={edu.gpa}
                      onChange={(e) => setEducation(updateAt(education, index, { gpa: e.target.value }))}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          ))}

          {/* ── Skills ── */}
          <Divider />
          <Title level={5}>Skills</Title>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input
              placeholder="Add new skill"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onPressEnter={() => {
                if (skillInput.trim()) {
                  setSkills([...skills, skillInput.trim()]);
                  setSkillInput('');
                }
              }}
            />
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                if (skillInput.trim()) {
                  setSkills([...skills, skillInput.trim()]);
                  setSkillInput('');
                }
              }}
            >
              Add
            </Button>
          </div>
          {skills.length > 0 && (
            <Space size={[4, 8]} wrap style={{ marginBottom: 12 }}>
              {skills.map((skill, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => setSkills(skills.filter((_, i) => i !== index))}
                  color="blue"
                >
                  {skill}
                </Tag>
              ))}
            </Space>
          )}

          {/* ── Certifications ── */}
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>Certifications</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                setCertifications([
                  ...certifications,
                  { name: '', issuing_org: '', date_obtained: '', expiration_date: '' },
                ])
              }
            >
              Add Certification
            </Button>
          </div>
          {certifications.map((cert, index) => (
            <Card
              key={index}
              size="small"
              title={`Certification #${index + 1}`}
              style={{ marginBottom: 12 }}
              extra={
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => setCertifications(certifications.filter((_, i) => i !== index))}
                />
              }
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ display: 'block', marginBottom: 4 }}>Certification Name</Text>
                    <Input
                      placeholder="e.g., AWS Solutions Architect"
                      value={cert.name}
                      onChange={(e) => setCertifications(updateAt(certifications, index, { name: e.target.value }))}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ display: 'block', marginBottom: 4 }}>Issuing Organization</Text>
                    <Input
                      placeholder="e.g., Amazon Web Services"
                      value={cert.issuing_org}
                      onChange={(e) => setCertifications(updateAt(certifications, index, { issuing_org: e.target.value }))}
                    />
                  </div>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ display: 'block', marginBottom: 4 }}>Date Obtained</Text>
                    <DatePicker
                      picker="month"
                      format="YYYY-MM"
                      style={{ width: '100%' }}
                      placeholder="YYYY-MM"
                      value={parseMonth(cert.date_obtained)}
                      onChange={(_date, dateString) => setCertifications(updateAt(certifications, index, { date_obtained: dateString as string }))}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ display: 'block', marginBottom: 4 }}>Expiration Date (Optional)</Text>
                    <DatePicker
                      picker="month"
                      format="YYYY-MM"
                      style={{ width: '100%' }}
                      placeholder="YYYY-MM"
                      value={parseMonth(cert.expiration_date)}
                      onChange={(_date, dateString) => setCertifications(updateAt(certifications, index, { expiration_date: dateString as string }))}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          ))}

          {/* ── Screening Questions ── */}
          {job.screening_questions && job.screening_questions.length > 0 && (
            <>
              <Divider />
              <Title level={5}>Screening Questions</Title>
              {job.screening_questions.map((q) => (
                <Form.Item
                  key={q.id}
                  name={['screening_answers', String(q.id)]}
                  label={q.question}
                  rules={
                    q.is_required
                      ? [{ required: true, message: 'This question is required' }]
                      : undefined
                  }
                >
                  {q.question_type === 'text' && (
                    <TextArea rows={2} placeholder="Your answer..." />
                  )}
                  {q.question_type === 'yes_no' && (
                    <Radio.Group>
                      <Radio value="yes">Yes</Radio>
                      <Radio value="no">No</Radio>
                    </Radio.Group>
                  )}
                  {q.question_type === 'multiple_choice' && q.options && (
                    <Select placeholder="Select an option">
                      {q.options.map((opt) => (
                        <Select.Option key={opt} value={opt}>
                          {opt}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                  {q.question_type === 'numeric_rating' && (
                    <InputNumber min={1} max={10} placeholder="Rating" />
                  )}
                </Form.Item>
              ))}
            </>
          )}

          {/* ── Privacy Policy ── */}
          <Divider />
          <Form.Item
            name="accept_privacy_policy"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error('You must accept the privacy policy to apply')),
              },
            ]}
          >
            <Checkbox>
              By applying, you hereby accept the data processing terms under the{' '}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>{' '}
              and give consent to processing of the data as part of this job application.
            </Checkbox>
          </Form.Item>

          {/* ── Submit ── */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={submitting}
            >
              Submit Application
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
