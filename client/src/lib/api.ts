import axios, { type AxiosError } from 'axios';
import type { ApiResponse, AuthResponse, Account } from '../types';

class ApiClient {
  private client: ReturnType<typeof axios.create>;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const { data } = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return data.data!;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const { data } = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', userData);
    return data.data!;
  }

  async getMe() {
    const { data } = await this.client.get<ApiResponse<{ user: any }>>('/auth/me');
    return data.data!.user;
  }

  async updateProfile(userData: Partial<{ firstName: string; lastName: string; avatar: string }>) {
    const { data } = await this.client.put<ApiResponse<{ user: any }>>('/auth/profile', userData);
    return data.data!.user;
  }

  // Users
  async getUsers() {
    const { data } = await this.client.get<ApiResponse<{ users: any[] }>>('/users');
    return data.data!.users;
  }

  async getUser(id: string) {
    const { data } = await this.client.get<ApiResponse<{ user: any }>>(`/users/${id}`);
    return data.data!.user;
  }

  async updateUser(id: string, userData: any) {
    const { data } = await this.client.put<ApiResponse<{ user: any }>>(`/users/${id}`, userData);
    return data.data!.user;
  }

  async deleteUser(id: string) {
    await this.client.delete(`/users/${id}`);
  }

  // Projects
  async getProjects(params?: { status?: string; managerId?: string }) {
    const { data } = await this.client.get<ApiResponse<{ projects: any[] }>>('/projects', {
      params,
    });
    return data.data!.projects;
  }

  async getMyProjects() {
    const { data } = await this.client.get<ApiResponse<{ projects: any[] }>>('/projects/my-projects');
    return data.data!.projects;
  }

  async getProject(id: string) {
    const { data } = await this.client.get<ApiResponse<{ project: any }>>(`/projects/${id}`);
    return data.data!.project;
  }

  async createProject(projectData: any) {
    const { data } = await this.client.post<ApiResponse<{ project: any }>>('/projects', projectData);
    return data.data!.project;
  }

  async updateProject(id: string, projectData: any) {
    const { data } = await this.client.put<ApiResponse<{ project: any }>>(`/projects/${id}`, projectData);
    return data.data!.project;
  }

  async deleteProject(id: string) {
    await this.client.delete(`/projects/${id}`);
  }

  async addProjectMember(projectId: string, memberData: any) {
    const { data } = await this.client.post<ApiResponse<{ member: any }>>(
      `/projects/${projectId}/members`,
      memberData
    );
    return data.data!.member;
  }

  async updateProjectMember(projectId: string, memberId: string, memberData: any) {
    const { data } = await this.client.put<ApiResponse<{ member: any }>>(
      `/projects/${projectId}/members/${memberId}`,
      memberData
    );
    return data.data!.member;
  }

  async removeProjectMember(projectId: string, memberId: string) {
    await this.client.delete(`/projects/${projectId}/members/${memberId}`);
  }

  // Tasks
  async getTasks(params?: {
    projectId?: string;
    assignedToId?: string;
    status?: string;
  }) {
    const { data } = await this.client.get<ApiResponse<{ tasks: any[] }>>('/tasks', { params });
    return data.data!.tasks;
  }

  async getTask(id: string) {
    const { data } = await this.client.get<ApiResponse<{ task: any }>>(`/tasks/${id}`);
    return data.data!.task;
  }

  async createTask(taskData: any) {
    const { data } = await this.client.post<ApiResponse<{ task: any }>>('/tasks', taskData);
    return data.data!.task;
  }

  async updateTask(id: string, taskData: any) {
    const { data } = await this.client.put<ApiResponse<{ task: any }>>(`/tasks/${id}`, taskData);
    return data.data!.task;
  }

  async deleteTask(id: string) {
    await this.client.delete(`/tasks/${id}`);
  }

  async createTaskDependency(taskId: string, dependencyData: any) {
    const { data } = await this.client.post<ApiResponse<{ dependency: any }>>(
      `/tasks/${taskId}/dependencies`,
      dependencyData
    );
    return data.data!.dependency;
  }

  async deleteTaskDependency(taskId: string, depId: string) {
    await this.client.delete(`/tasks/${taskId}/dependencies/${depId}`);
  }

  async importMPP(projectId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    const { data } = await this.client.post<ApiResponse<any>>(
      '/tasks/import-mpp',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data.data!;
  }

  async recalculateProgress(projectId: string) {
    const { data } = await this.client.post<ApiResponse<any>>('/tasks/recalculate-progress', { projectId });
    return data.data!;
  }

  // Worklogs
  async getWorklogs(params?: {
    projectId?: string;
    taskId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { data } = await this.client.get<ApiResponse<{ worklogs: any[] }>>('/worklogs', {
      params,
    });
    return data.data!.worklogs;
  }

  async createWorklog(worklogData: any) {
    const { data } = await this.client.post<ApiResponse<{ worklog: any }>>('/worklogs', worklogData);
    return data.data!.worklog;
  }

  async updateWorklog(id: string, worklogData: any) {
    const { data } = await this.client.put<ApiResponse<{ worklog: any }>>(`/worklogs/${id}`, worklogData);
    return data.data!.worklog;
  }

  async deleteWorklog(id: string) {
    await this.client.delete(`/worklogs/${id}`);
  }

  // RAID
  async getRAIDItems(params?: { projectId?: string; type?: string; status?: string }) {
    const { data } = await this.client.get<ApiResponse<{ items: any[] }>>('/raid', { params });
    return data.data!.items;
  }

  async getRAIDItem(id: string) {
    const { data } = await this.client.get<ApiResponse<{ item: any }>>(`/raid/${id}`);
    return data.data!.item;
  }

  async createRAIDItem(raidData: any) {
    const { data } = await this.client.post<ApiResponse<{ item: any }>>('/raid', raidData);
    return data.data!.item;
  }

  async updateRAIDItem(id: string, raidData: any) {
    const { data } = await this.client.put<ApiResponse<{ item: any }>>(`/raid/${id}`, raidData);
    return data.data!.item;
  }

  async deleteRAIDItem(id: string) {
    await this.client.delete(`/raid/${id}`);
  }

  async exportRAIDLog(projectId: string): Promise<Blob> {
    const response = await this.client.get('/raid/export', {
      params: { projectId },
      responseType: 'blob',
    });
    return response.data;
  }

  // Rate Cards
  async getRateCards(params?: { userId?: string; role?: string; active?: boolean }) {
    const { data } = await this.client.get<ApiResponse<{ rateCards: any[] }>>('/rate-cards', {
      params,
    });
    return data.data!.rateCards;
  }

  async createRateCard(rateCardData: any) {
    const { data } = await this.client.post<ApiResponse<{ rateCard: any }>>('/rate-cards', rateCardData);
    return data.data!.rateCard;
  }

  async updateRateCard(id: string, rateCardData: any) {
    const { data } = await this.client.put<ApiResponse<{ rateCard: any }>>(
      `/rate-cards/${id}`,
      rateCardData
    );
    return data.data!.rateCard;
  }

  async deleteRateCard(id: string) {
    await this.client.delete(`/rate-cards/${id}`);
  }

  // Reports
  async getReports(params?: { projectId?: string; type?: string }) {
    const { data } = await this.client.get<ApiResponse<{ reports: any[] }>>('/reports', { params });
    return data.data!.reports;
  }

  async getReport(id: string) {
    const { data } = await this.client.get<ApiResponse<{ report: any }>>(`/reports/${id}`);
    return data.data!.report;
  }

  async generateWeeklyReport(reportData: { projectId: string; period: string }) {
    const { data } = await this.client.post<ApiResponse<{ report: any }>>('/reports/weekly', reportData);
    return data.data!.report;
  }

  async generateMonthlyReport(reportData: { projectId: string; period: string }) {
    const { data } = await this.client.post<ApiResponse<{ report: any }>>('/reports/monthly', reportData);
    return data.data!.report;
  }

  // Settings
  async getSettings(category?: string) {
    const { data } = await this.client.get<ApiResponse<{ settings: any[] }>>('/settings', {
      params: category ? { category } : {},
    });
    return data.data!.settings;
  }

  async getSettingsByCategory(category: string) {
    const { data } = await this.client.get<ApiResponse<{ settings: any[] }>>(`/settings/category/${category}`);
    return data.data!.settings;
  }

  async createSetting(settingData: any) {
    const { data } = await this.client.post<ApiResponse<{ setting: any }>>('/settings', settingData);
    return data.data!.setting;
  }

  async updateSetting(id: string, settingData: any) {
    const { data } = await this.client.put<ApiResponse<{ setting: any }>>(`/settings/${id}`, settingData);
    return data.data!.setting;
  }

  async deleteSetting(id: string) {
    await this.client.delete(`/settings/${id}`);
  }

  async seedDefaultSettings() {
    const { data } = await this.client.post<ApiResponse<any>>('/settings/seed');
    return data;
  }

  // ==================== Accounts ====================
  async getAccounts() {
    const { data } = await this.client.get<ApiResponse<{ accounts: Account[] }>>('/accounts');
    return data.data!.accounts;
  }

  async getAccount(id: string) {
    const { data } = await this.client.get<ApiResponse<{ account: Account }>>(`/accounts/${id}`);
    return data.data!.account;
  }

  async createAccount(accountData: Partial<Account>) {
    const { data } = await this.client.post<ApiResponse<{ account: Account }>>('/accounts', accountData);
    return data.data!.account;
  }

  async updateAccount(id: string, accountData: Partial<Account>) {
    const { data } = await this.client.patch<ApiResponse<{ account: Account }>>(`/accounts/${id}`, accountData);
    return data.data!.account;
  }

  async deleteAccount(id: string) {
    await this.client.delete(`/accounts/${id}`);
  }

  async exportWeeklyReportPPT(projectId: string) {
    const response = await this.client.get(`/reports/export/weekly-ppt/${projectId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getReportTemplate(projectId: string) {
    const { data } = await this.client.get<ApiResponse<{ template: any }>>(`/reports/template/${projectId}`);
    return data.data!.template;
  }

  async updateReportTemplate(projectId: string, templateData: any) {
    const { data } = await this.client.put<ApiResponse<{ template: any }>>(`/reports/template/${projectId}`, templateData);
    return data.data!.template;
  }

  async downloadReport(reportId: string) {
    const response = await this.client.get(`/reports/download/${reportId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async uploadLogo(projectId: string, logoType: 'logoUrlLeft' | 'logoUrlRight', file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('logoType', logoType);
    formData.append('projectId', projectId);
    const { data } = await this.client.post(`/reports/upload-logo/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  async uploadHeaderFooterImage(
    projectId: string,
    imageType: 'header' | 'footer',
    layoutType: 'cover' | 'blank' | 'contentEmpty' | 'titleAndContent' | 'sectionTitle',
    file: File,
  ) {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('imageType', imageType);
    formData.append('layoutType', layoutType);
    formData.append('projectId', projectId);
    const { data } = await this.client.post(`/reports/upload-header-footer/${projectId}/${layoutType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  async uploadSlideImage(projectId: string, slideKey: string, file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('slideKey', slideKey);
    formData.append('projectId', projectId);
    const { data } = await this.client.post(`/reports/upload-slide-image/${projectId}/${slideKey}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  // Weekly Highlights
  async getWeeklyHighlights(projectId: string, weekDate?: string) {
    const params = weekDate ? `?weekDate=${weekDate}` : '';
    const { data } = await this.client.get<any[]>(`/projects/${projectId}/weekly-highlights${params}`);
    return data;
  }

  async getWeeklyHighlightWeeks(projectId: string) {
    const { data } = await this.client.get<string[]>(`/projects/${projectId}/weekly-highlights/weeks`);
    return data;
  }

  async createWeeklyHighlight(projectId: string, payload: { weekDate: string; type: 'COMPLETED' | 'PLANNED'; description: string; sortOrder?: number }) {
    const { data } = await this.client.post(`/projects/${projectId}/weekly-highlights`, payload);
    return data;
  }

  async updateWeeklyHighlight(projectId: string, hid: string, payload: Partial<{ weekDate: string; type: 'COMPLETED' | 'PLANNED'; description: string; sortOrder: number }>) {
    const { data } = await this.client.put(`/projects/${projectId}/weekly-highlights/${hid}`, payload);
    return data;
  }

  async deleteWeeklyHighlight(projectId: string, hid: string) {
    const { data } = await this.client.delete(`/projects/${projectId}/weekly-highlights/${hid}`);
    return data;
  }

  // Meeting Minutes
  async getMeetingMinutes(projectId: string) {
    const { data } = await this.client.get(`/projects/${projectId}/meeting-minutes`);
    return data;
  }

  async getMeetingMinute(projectId: string, mid: string) {
    const { data } = await this.client.get(`/projects/${projectId}/meeting-minutes/${mid}`);
    return data;
  }

  async createMeetingMinutes(projectId: string, payload: Record<string, unknown>) {
    const { data } = await this.client.post(`/projects/${projectId}/meeting-minutes`, payload);
    return data;
  }

  async updateMeetingMinutes(projectId: string, mid: string, payload: Record<string, unknown>) {
    const { data } = await this.client.put(`/projects/${projectId}/meeting-minutes/${mid}`, payload);
    return data;
  }

  async deleteMeetingMinutes(projectId: string, mid: string) {
    const { data } = await this.client.delete(`/projects/${projectId}/meeting-minutes/${mid}`);
    return data;
  }

  /** Download a filled .docx for a single meeting minute */
  async exportMeetingMinutes(projectId: string, mid: string): Promise<Blob> {
    const response = await this.client.get(
      `/projects/${projectId}/meeting-minutes/${mid}/export`,
      { responseType: 'blob' },
    );
    return response.data as Blob;
  }

  /** Upload a custom .docx template for MOM exports */
  async uploadMoMTemplate(projectId: string, file: File): Promise<{ masterTemplatePath: string }> {
    const form = new FormData();
    form.append('template', file);
    const { data } = await this.client.post(
      `/projects/${projectId}/meeting-minutes/template`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  }

  /** Remove the custom MOM template for a project */
  async deleteMoMTemplate(projectId: string) {
    const { data } = await this.client.delete(`/projects/${projectId}/meeting-minutes/template`);
    return data;
  }

  /** Download the current custom MOM template .docx file */
  async downloadMoMTemplate(projectId: string): Promise<Blob> {
    const response = await this.client.get(
      `/projects/${projectId}/meeting-minutes/template/download`,
      { responseType: 'blob' },
    );
    return response.data as Blob;
  }
}

export const api = new ApiClient();
export default api;
