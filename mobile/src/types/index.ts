export type UserRole = "student" | "employer" | "coordinator" | "admin";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface EducationEntry {
  institution?: string;
  degree?: string;
  field_of_study?: string;
  start_year?: string;
  end_year?: string;
  is_current?: boolean;
}

export interface ExperienceEntry {
  title?: string;
  company?: string;
  description?: string;
  years?: number;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
}

export interface ParsedResumeData {
  skills: string[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  certifications: string[];
  summary?: string;
}

export type ResumeStatus = "uploaded" | "parsing" | "parsed" | "active" | "archived" | "failed";

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  status: ResumeStatus;
  parsed_data?: ParsedResumeData;
  created_at: string;
}

export type JobType = "internship" | "ojt" | "full_time" | "part_time";
export type JobStatus = "draft" | "active" | "closed" | "filled";

export interface JobPosting {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  job_type: JobType;
  location?: string;
  is_remote?: string;
  required_skills: string[];
  preferred_skills?: string[];
  min_education_level?: string;
  status: JobStatus;
  posted_at: string;
  employer?: {
    company_name: string;
    website?: string;
    location?: string;
  };
}

export interface ExternalJob {
  id: string;
  source: string;
  title: string;
  company_name: string;
  location?: string;
  description_snippet?: string;
  apply_url: string;
  source_board?: string;
  required_skills: string[];
  fetched_at: string;
}

export interface MatchExplanation {
  matched_skills: string[];
  missing_skills: string[];
  summary: string;
  skill_match_percentage: number;
}

export interface RecommendationItem {
  match_score: number;
  skill_score: number;
  experience_score: number;
  education_score: number;
  explanation: MatchExplanation;
  target_type: "internal" | "external";
  target: JobPosting | ExternalJob;
}

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "interview_scheduled"
  | "accepted"
  | "rejected"
  | "withdrawn";

export interface Application {
  id: string;
  user_id: string;
  job_posting_id: string;
  resume_id?: string;
  status: ApplicationStatus;
  notes?: string;
  applied_at: string;
  job_posting?: JobPosting;
}
