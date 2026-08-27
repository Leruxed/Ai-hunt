import {
  AuthResponse,
  RecommendationItem,
  Resume,
  JobPosting,
  Application,
  RankedApplicant,
  NotificationItem,
  UserRole,
  ApplicationStatus,
} from "../types";

const API_BASE_URL = "http://localhost:8000/api/v1";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = "An unexpected error occurred.";
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorDetail;
      } catch {
        errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorDetail);
    }

    return response.json() as Promise<T>;
  }

  // Auth endpoints
  async register(
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });
  }

  // Resumes
  async uploadResume(formData: FormData): Promise<Resume> {
    return this.request<Resume>("/resumes/upload", {
      method: "POST",
      body: formData,
    });
  }

  async getMyResume(): Promise<Resume | null> {
    return this.request<Resume | null>("/resumes/me");
  }

  async updateParsedResume(resumeId: string, parsedData: any): Promise<Resume> {
    return this.request<Resume>(`/resumes/${resumeId}/parsed-data`, {
      method: "PUT",
      body: JSON.stringify({ parsed_data: parsedData }),
    });
  }

  // Recommendations & Matches
  async getRecommendations(): Promise<RecommendationItem[]> {
    return this.request<RecommendationItem[]>("/matches/recommendations");
  }

  // Applications
  async applyToJob(jobPostingId: string, notes?: string): Promise<Application> {
    return this.request<Application>("/applications/", {
      method: "POST",
      body: JSON.stringify({ job_posting_id: jobPostingId, notes }),
    });
  }

  async getMyApplications(): Promise<Application[]> {
    return this.request<Application[]>("/applications/my-applications");
  }

  async getPostingApplicants(postingId: string): Promise<RankedApplicant[]> {
    return this.request<RankedApplicant[]>(`/applications/posting/${postingId}/applicants`);
  }

  async updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<Application> {
    return this.request<Application>(`/applications/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // Employer Job Postings
  async getMyPostings(): Promise<JobPosting[]> {
    return this.request<JobPosting[]>("/jobs/my-postings");
  }

  async createJobPosting(posting: Partial<JobPosting>): Promise<JobPosting> {
    return this.request<JobPosting>("/jobs/", {
      method: "POST",
      body: JSON.stringify(posting),
    });
  }

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>("/notifications/");
  }

  async getUnreadNotificationCount(): Promise<{ unread_count: number }> {
    return this.request<{ unread_count: number }>("/notifications/unread-count");
  }

  async markNotificationRead(notificationId: string): Promise<NotificationItem> {
    return this.request<NotificationItem>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request<{ status: string }>("/notifications/read-all", {
      method: "PATCH",
    });
  }
}

export const api = new ApiClient();
