// API client for HireBuddy backend
// This replaces direct Supabase calls with secure API requests
import { getConfig } from '@/config/environment';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    // Use environment variable for API URL, fallback to local development
    this.baseURL = getConfig().api.baseUrl;
    
    // Load token from localStorage on initialization
    try {
      this.token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    } catch {
      this.token = null;
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const searchParams = params ? new URLSearchParams(params) : null;
    const url = searchParams ? `${endpoint}?${searchParams}` : endpoint;
    
    return this.request<T>(url, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Authentication methods
  async login(email: string, password: string) {
    const response = await this.post('/auth/login', { email, password });
    if (response.success && response.data && typeof response.data === 'object' && 'token' in response.data) {
      this.setToken(response.data.token as string);
    }
    return response;
  }

  async signup(email: string, password: string, fullName?: string) {
    const response = await this.post('/auth/signup', { email, password, fullName });
    if (response.success && response.data && typeof response.data === 'object' && 'token' in response.data) {
      this.setToken(response.data.token as string);
    }
    return response;
  }

  async refreshToken(refreshToken: string) {
    const response = await this.post('/auth/refresh', { refreshToken });
    if (response.success && response.data && typeof response.data === 'object' && 'token' in response.data) {
      this.setToken(response.data.token as string);
    }
    return response;
  }

  async logout() {
    const response = await this.post('/auth/logout');
    this.clearToken();
    return response;
  }

  // Profile methods
  async getProfile() {
    return this.get('/profile');
  }

  async updateProfile(profileData: any) {
    return this.put('/profile', profileData);
  }

  // Jobs methods
  async getJobs(params?: Record<string, string>) {
    return this.get('/jobs', params);
  }

  async getJob(id: string) {
    return this.get(`/jobs/${id}`);
  }

  async getJobById(id: string) {
    return this.get(`/jobs/${id}`);
  }

  async getRemoteJobs(params?: Record<string, string>) {
    return this.get('/jobs/remote', params);
  }

  async getExclusiveJobs(params?: Record<string, string>) {
    return this.get('/jobs/exclusive', params);
  }

  async createJob(jobData: any) {
    return this.post('/jobs', jobData);
  }

  async updateJob(jobData: any) {
    return this.put('/jobs', jobData);
  }

  async deleteJob(id: string) {
    return this.delete(`/jobs/${id}`);
  }

  async getJobsStats() {
    return this.get('/jobs/stats');
  }

  async searchCompanies(query: string, limit: number = 10) {
    return this.get('/jobs/companies', { query, limit: limit.toString() });
  }

  async searchLocations(query: string, limit: number = 10) {
    return this.get('/jobs/locations', { query, limit: limit.toString() });
  }

  // Job Applications methods
  async createApplication(applicationData: any) {
    return this.post('/applications', applicationData);
  }

  async getUserApplications() {
    return this.get('/applications');
  }

  async updateApplicationStatus(id: string, statusData: any) {
    return this.put(`/applications/${id}/status`, statusData);
  }

  // Contacts methods
  async getContacts(params?: Record<string, string>) {
    return this.get<any[]>('/contacts', params);
  }

  async createContact(contactData: any) {
    return this.post<any>('/contacts', contactData);
  }

  async updateContact(id: string, contactData: any) {
    return this.put<any>(`/contacts/${id}`, contactData);
  }

  async deleteContact(id: string) {
    return this.delete<void>(`/contacts/${id}`);
  }

  // Contacts extras (migrated from client-side testdb access)
  async searchContacts(query: string) {
    return this.get<any[]>('/contacts/search', { query });
  }

  async getContactsWithEmail() {
    return this.get<any[]>('/contacts/with-email');
  }

  async getContactsAvailableForEmail() {
    return this.get<any[]>('/contacts/available-for-email');
  }

  async markContactEmailSent(id: string) {
    return this.post<void>(`/contacts/${id}/email-sent`);
  }

  async getContactsCount() {
    return this.get<{ count: number }>('/contacts/count');
  }

  // Health
  async getDbHealth() {
    return this.get<{ ok: boolean }>('/health/db');
  }

  // Dashboard methods
  async getDashboardStats() {
    return this.get('/dashboard/stats');
  }

  async getRecentActivity() {
    return this.get('/dashboard/activity');
  }

  // Premium methods
  async checkPremiumStatus() {
    return this.get('/premium/status');
  }

  async getPremiumData() {
    return this.get('/premium/data');
  }

  // Email methods
  async getEmailUsage() {
    return this.get('/email/usage');
  }

  async incrementEmailCount(count?: number) {
    return this.post('/email/increment', { count });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiResponse }; 