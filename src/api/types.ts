export interface Job {
  uuid: string;
  title: string;
  status: string;
  customer_type?: string;
  employment_type?: string;
  location: string;
  positions: number;
  primary_skills?: string[];
  secondary_skills?: string[];
  job_description?: string;
  minimum_work_experience?: number;
  target_date?: string;
  created_at?: string;
  is_applied?: boolean;
  company?: { uuid: string; name: string } | null;
  job_location?: {
    city?: string;
    state?: string;
    country?: string;
  } | null;
  screening_questions?: ScreeningQuestion[];
  tags?: { uuid?: string; name: string }[];
  pay_details?: {
    job_type?: string;
    pay_type?: string;
    pay_rate_from?: number;
    pay_rate_to?: number;
  } | null;
}

export interface ScreeningQuestion {
  id: number;
  question: string;
  question_type: 'text' | 'multiple_choice' | 'yes_no' | 'numeric_rating';
  is_required: boolean;
  options?: string[] | null;
  order?: number;
}

export interface ExperienceEntry {
  job_title: string;
  company: string;
  start_date: string;
  end_date: string;
  currently_working: boolean;
  description: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  graduation_year: string;
  gpa: string;
}

export interface CertificationEntry {
  name: string;
  issuing_org: string;
  date_obtained: string;
  expiration_date: string;
}

export interface UploadedAttachment {
  id: number;
  name: string;
  type: string;
}

export interface MyApplication {
  uuid: string;
  status: string;
  submitted_at?: string;
  created_at?: string;
  job: {
    uuid: string;
    title: string;
    status: string;
    location: string;
    company?: { name: string } | null;
    job_location?: { city?: string; state?: string } | null;
  } | null;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface TimeSlot {
  id: number;
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
  timezone: string;
  is_selected: boolean;
  order: number;
}

export interface Interview {
  id: number;
  uuid: string;
  interview_type: string;
  status: string;
  notes?: string;
  interview_link?: string;
  order_in_application: number;
  time_slots: TimeSlot[];
}

export interface ApplicationDetail {
  application: {
    uuid: string;
    status: string;
    submitted_at?: string;
    created_at?: string;
  };
  job: {
    uuid: string;
    title: string;
    status: string;
    location: string;
    employment_type?: string;
    customer_type?: string;
    positions?: number;
    job_description?: string;
    primary_skills?: string[];
    created_at?: string;
    company?: { name: string } | null;
    job_location?: { city?: string; state?: string; country?: string } | null;
    tags?: string[];
    pay_details?: {
      pay_type?: string;
      pay_rate_from?: number;
      pay_rate_to?: number;
    } | null;
  } | null;
  interviews: Interview[];
}
