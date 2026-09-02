// Scrapify Auctions Admin Unified API Client
// Connects Super Admin & Operations Console directly to Laravel REST API (/api/v1)

const API_BASE_URL = typeof window !== 'undefined' && (window as any).ENV_API_URL 
  ? (window as any).ENV_API_URL 
  : 'https://api.scrapifyauctions.com/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
  };
  error?: {
    code: string;
    details?: any;
  };
}

class ScrapifyAdminApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('scrapify_admin_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('scrapify_admin_token', token);
      } else {
        localStorage.removeItem('scrapify_admin_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || `API Error: ${res.status}`);
      }
      return json;
    } catch (err) {
      console.warn(`[ScrapifyAdminApiClient] Network request failed for ${endpoint}:`, err);
      throw err;
    }
  }

  /* ---------------- Auth & Staff ---------------- */
  async login(identifier: string, password: string) {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async me() {
    return this.request<any>('/auth/me');
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  /* ---------------- Organizations & Customers ---------------- */
  async getOrganizations(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/organizations${query ? `?${query}` : ''}`);
  }

  async approveOrganization(code: string) {
    return this.request<any>(`/organizations/${code}/approve`, { method: 'POST' });
  }

  async rejectOrganization(code: string, reason: string) {
    return this.request<any>(`/organizations/${code}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /* ---------------- Vendors & KYB Verification ---------------- */
  async getVendors(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/vendors${query ? `?${query}` : ''}`);
  }

  async getVendor(code: string) {
    return this.request<any>(`/vendors/${code}`);
  }

  async uploadVendorDocument(vendorCode: string, docKey: string, kind: string, file: File) {
    const formData = new FormData();
    formData.append('doc_key', docKey);
    formData.append('kind', kind);
    formData.append('file', file);

    const url = `${API_BASE_URL}/vendors/${vendorCode}/documents`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Document upload failed');
    return json;
  }

  async approveVendor(code: string) {
    return this.request<any>(`/vendors/${code}/approve`, { method: 'POST' });
  }

  async rejectVendor(code: string, reason: string) {
    return this.request<any>(`/vendors/${code}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async suspendVendor(code: string, reason: string) {
    return this.request<any>(`/vendors/${code}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async reviewVendorDocument(vendorCode: string, docId: number, status: 'approved' | 'rejected', reason?: string) {
    return this.request<any>(`/vendors/${vendorCode}/documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  /* ---------------- Auctions & Control Room ---------------- */
  async getAuctions(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/auctions${query ? `?${query}` : ''}`);
  }

  async getAuction(code: string) {
    return this.request<any>(`/auctions/${code}`);
  }

  async getLiveState(code: string) {
    return this.request<any>(`/auctions/${code}/live-state`);
  }

  async approveAuction(code: string) {
    return this.request<any>(`/auctions/${code}/approve`, { method: 'POST' });
  }

  async extendAuction(code: string, minutes: number, reason: string) {
    return this.request<any>(`/auctions/${code}/extend`, {
      method: 'POST',
      body: JSON.stringify({ minutes, reason }),
    });
  }

  async closeAuction(code: string) {
    return this.request<any>(`/auctions/${code}/close`, { method: 'POST' });
  }

  async cancelAuction(code: string, reason: string) {
    return this.request<any>(`/auctions/${code}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /* ---------------- Approvals Workflow ---------------- */
  async getApprovals(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse<any>>(`/approvals${query ? `?${query}` : ''}`);
  }

  async decideApproval(id: number, decision: 'approved' | 'rejected' | 'escalated', comments?: string) {
    return this.request<ApiResponse<any>>(`/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, comments }),
    });
  }

  /* ---------------- Disputes ---------------- */
  async getDisputes(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse<any>>(`/disputes${query ? `?${query}` : ''}`);
  }

  async getDispute(code: string) {
    return this.request<ApiResponse<any>>(`/disputes/${code}`);
  }

  async resolveDispute(code: string, resolution_summary: string, status: 'resolved' | 'closed' | 'appealed') {
    return this.request<ApiResponse<any>>(`/disputes/${code}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_summary, status }),
    });
  }

  /* ---------------- Risk & Fraud Detection ---------------- */
  async getRiskFlags(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse<any>>(`/risk/flags${query ? `?${query}` : ''}`);
  }

  async resolveRiskFlag(code: string, status: 'resolved' | 'false_positive' | 'restricted', notes?: string) {
    return this.request<ApiResponse<any>>(`/risk/flags/${code}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    });
  }

  /* ---------------- Reports & SOC2 Audit Trail ---------------- */
  async getDashboardReports() {
    return this.request<any>('/reports/dashboard');
  }

  async getAuditLogs(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/audit-logs${query ? `?${query}` : ''}`);
  }
}

export const adminApi = new ScrapifyAdminApiClient();
