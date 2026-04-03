import api from './client';
import type { Job, MyApplication, User, ApplicationDetail } from './types';

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Public endpoints (no auth)
export async function fetchJobByUuid(uuid: string): Promise<Job> {
  const res = await api.get(`/public/jobs/${encodeURIComponent(uuid)}`);
  return res.data.data.job;
}

export async function uploadPublicAttachment(uuid: string, file: File): Promise<{ id: number; name: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/public/jobs/${encodeURIComponent(uuid)}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.attachment;
}

export interface ParsedResume {
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string | null;
  mobile_phone: string | null;
  country_code: string | null;
  location: string | null;
  experience: Array<{
    job_title: string;
    company_name: string;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduation_year: string | null;
    gpa: string | null;
  }>;
  skills: string[];
  certifications: Array<{
    certification_name: string;
    issuing_organization: string | null;
    date_obtained: string | null;
  }>;
}

export async function parseResumePublic(uuid: string, file: File): Promise<ParsedResume> {
  const formData = new FormData();
  formData.append('resume', file);
  const res = await api.post(`/public/jobs/${encodeURIComponent(uuid)}/parse-resume`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.parsed;
}

export interface ApplyPayload {
  profile: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    mobile_phone: string;
    country_code?: string;
    location?: string;
  };
  experience?: Array<{
    job_title: string;
    company_name: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year_of_graduation?: string;
    gpa?: string;
  }>;
  skills?: string[];
  certifications?: Array<{
    certification_name: string;
    issuing_organization: string;
    date_obtained?: string;
    expiration_date?: string;
  }>;
  job_application_attachments?: Array<{
    attachment_id: number;
    type: string;
    other_type?: string;
  }>;
  screening_answers?: Array<{ question_id: number; answer: string }>;
}

export async function applyToJob(uuid: string, data: ApplyPayload) {
  const res = await api.post(`/public/jobs/${encodeURIComponent(uuid)}/apply`, data);
  return res.data;
}

export async function analyzeResumePublic(uuid: string, applicationUuid: string) {
  const res = await api.post(`/public/jobs/${encodeURIComponent(uuid)}/analyze-resume`, {
    application_uuid: applicationUuid,
  });
  return res.data;
}

// Authenticated endpoints
export async function fetchExternalJobs(params: {
  page?: number;
  per_page?: number;
  search?: string;
  location?: string;
}): Promise<{ jobs: Job[]; pagination: Pagination }> {
  const res = await api.get('/job-board/jobs', { params });
  return res.data.data;
}

export async function fetchMyApplications(params: {
  page?: number;
  per_page?: number;
}): Promise<{ applications: MyApplication[]; pagination: Pagination }> {
  const res = await api.get('/job-board/my-applications', { params });
  return res.data.data;
}

// Auth (job-board specific endpoints)
export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await api.post('/job-board/login', { email, password });
  return res.data.data;
}

export async function register(data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<{ user: User; token: string }> {
  const res = await api.post('/job-board/register', data);
  return res.data.data;
}

// Application detail & interview actions
export async function fetchApplicationDetail(uuid: string): Promise<ApplicationDetail> {
  const res = await api.get(`/job-board/applications/${encodeURIComponent(uuid)}`);
  return res.data.data;
}

export async function confirmInterviewSlot(interviewUuid: string, timeSlotId: number): Promise<void> {
  await api.post(`/job-board/interviews/${encodeURIComponent(interviewUuid)}/confirm`, {
    time_slot_id: timeSlotId,
  });
}

export async function cancelInterview(interviewUuid: string): Promise<void> {
  await api.post(`/job-board/interviews/${encodeURIComponent(interviewUuid)}/cancel`);
}

export interface CommunicationStyle {
  analytical: number;
  creative: number;
  collaborative: number;
  data_driven: number;
  formal: number;
  description: string;
}

export interface ProfessionalJourneyPoint {
  year: number;
  seniority: number;
  milestone: string | null;
}

export interface KeywordAnalysis {
  matched: string[];
  missing: string[];
  additional: string[];
}

export interface QuantifiableImpact {
  team_size: string;
  performance: string;
  cost_reduction: string;
  projects_delivered: string;
}

export interface ResumeAnalysisResult {
  candidate_name: string;
  candidate_title: string;
  match_score: number;
  ai_first_impression: string;
  key_strengths: string[];
  potential_gaps: string[];
  missing_keywords: string[];
  quantifiable_impact: QuantifiableImpact;
  communication_style: CommunicationStyle;
  professional_journey: ProfessionalJourneyPoint[];
  keyword_analysis: KeywordAnalysis;
  clear_explanation: string;
}
