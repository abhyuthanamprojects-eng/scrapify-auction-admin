// Scrapify Auctions Admin Unified API Client
// Connects Super Admin & Operations Console directly to Laravel REST API (/api/v1)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (typeof window !== 'undefined' && (window as any).ENV_API_URL)
  || 'https://api.scrapifyauctions.com/api/v1';

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

  async reviewVendorDocument(vendorCode: string, docId: number | string, status: 'approved' | 'rejected', reason?: string) {
    return this.request<any>(`/vendors/${vendorCode}/documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  getVendorDocumentDownloadUrl(vendorCode: string, docId: number | string): string {
    return `${API_BASE_URL}/vendors/${vendorCode}/documents/${docId}/download`;
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

  /* ---------------- Auction Lifecycle ---------------- */
  async createAuction(data: any) {
    return this.request<any>('/auctions', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateAuction(code: string, data: any) {
    return this.request<any>(`/auctions/${code}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async submitAuction(code: string) {
    return this.request<any>(`/auctions/${code}/submit`, { method: 'POST' });
  }

  async publishAuction(code: string, channels?: string[]) {
    return this.request<any>(`/auctions/${code}/publish`, {
      method: 'POST',
      body: JSON.stringify({ channels }),
    });
  }

  async goLive(code: string) {
    return this.request<any>(`/auctions/${code}/go-live`, { method: 'POST' });
  }

  async sendBackAuction(code: string, comment: string) {
    return this.request<any>(`/auctions/${code}/send-back`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async rejectAuction(code: string, comment: string) {
    return this.request<any>(`/auctions/${code}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  /* ---------------- Lots ---------------- */
  async getLots(auctionCode: string) {
    return this.request<any>(`/auctions/${auctionCode}/lots`);
  }

  async createLot(auctionCode: string, data: any) {
    return this.request<any>(`/auctions/${auctionCode}/lots`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLot(auctionCode: string, lotId: string, data: any) {
    return this.request<any>(`/auctions/${auctionCode}/lots/${lotId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteLot(auctionCode: string, lotId: string) {
    return this.request<any>(`/auctions/${auctionCode}/lots/${lotId}`, { method: 'DELETE' });
  }

  /* ---------------- Bids ---------------- */
  async getBids(auctionCode: string) {
    return this.request<any>(`/auctions/${auctionCode}/bids`);
  }

  /* ---------------- Awards ---------------- */
  async getAwards(auctionCode: string) {
    return this.request<any>(`/auctions/${auctionCode}/awards`);
  }

  async issueAward(auctionCode: string, data?: any) {
    return this.request<any>(`/auctions/${auctionCode}/awards`, {
      method: 'POST',
      body: JSON.stringify(data ?? {}),
    });
  }

  async defaultWinner(awardId: number) {
    return this.request<any>(`/awards/${awardId}/default`, { method: 'POST' });
  }

  /* ---------------- Orders & Fulfilment ---------------- */
  async getOrders(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(code: string) {
    return this.request<any>(`/orders/${code}`);
  }

  async createOrder(data: any) {
    return this.request<any>('/orders', { method: 'POST', body: JSON.stringify(data) });
  }

  /* ---------------- Wallet & EMD ---------------- */
  async getWalletBalance() {
    return this.request<any>('/wallet');
  }

  async getWalletTransactions(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/wallet/transactions${query ? `?${query}` : ''}`);
  }

  async getEmdList(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/emd${query ? `?${query}` : ''}`);
  }

  async releaseEmd(id: number) {
    return this.request<any>(`/emd/${id}/release`, { method: 'POST' });
  }

  async forfeitEmd(id: number) {
    return this.request<any>(`/emd/${id}/forfeit`, { method: 'POST' });
  }

  /* ---------------- Inspections & Gate Passes ---------------- */
  async getInspections(auctionCode: string) {
    return this.request<any>(`/auctions/${auctionCode}/inspections`);
  }

  /* ---------------- Clarifications & Addenda ---------------- */
  async getClarifications(auctionCode: string) {
    return this.request<any>(`/auctions/${auctionCode}/clarifications`);
  }

  async answerClarification(auctionCode: string, id: number, answer: string) {
    return this.request<any>(`/auctions/${auctionCode}/clarifications/${id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  }

  async publishAddendum(auctionCode: string, data: any) {
    return this.request<any>(`/auctions/${auctionCode}/addenda`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /* ---------------- RFx ---------------- */
  async getRfx(auctionCode: string) {
    return this.request<any>(`/auctions/${auctionCode}/rfx`);
  }

  async createRfx(auctionCode: string, data: any) {
    return this.request<any>(`/auctions/${auctionCode}/rfx`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async evaluateRfxResponse(auctionCode: string, responseId: number, data: any) {
    return this.request<any>(`/auctions/${auctionCode}/rfx/responses/${responseId}/evaluate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /* ---------------- Dispute Evidence ---------------- */
  async uploadDisputeEvidence(code: string, title: string, file: File) {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);

    const url = `${API_BASE_URL}/disputes/${code}/evidence`;
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(url, { method: 'POST', headers, body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Evidence upload failed');
    return json;
  }

  async addDisputeMessage(code: string, message: string) {
    return this.request<any>(`/disputes/${code}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  /* ---------------- Categories & Platform Config ---------------- */
  async getCategories() {
    return this.request<any>('/categories');
  }

  async getPlatformConfig() {
    return this.request<any>('/platform-config');
  }

  /* ---------------- Admin: Finance, Fulfilments, Users, Reports ---------------- */
  async getFinanceSummary() {
    return this.request<any>('/admin/finance/summary');
  }

  async getFulfilments(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/admin/fulfilments${query ? `?${query}` : ''}`);
  }

  async getOrgUsers(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/admin/organisation/users${query ? `?${query}` : ''}`);
  }

  async createOrgUser(data: any) {
    return this.request<any>('/admin/organisation/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrgUser(id: number, data: any) {
    return this.request<any>(`/admin/organisation/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getReportsSummary() {
    return this.request<any>('/admin/reports/summary');
  }

  /* ---------------- Vendor Invitations ---------------- */
  async inviteVendor(data: { email?: string; phone?: string; company_name?: string; auction_code?: string; message?: string }) {
    return this.request<any>('/vendors/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /* ---------------- Terms Acceptance ---------------- */
  async acceptAuctionTerms(auctionCode: string) {
    return this.request<any>(`/auctions/${auctionCode}/terms/accept`, { method: 'POST' });
  }

  /* ---------------- Team Members ---------------- */
  async getTeamMembers(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/team/members${query ? `?${query}` : ''}`);
  }

  async createTeamMember(data: any) {
    return this.request<any>('/team/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeamMember(id: number, data: any) {
    return this.request<any>(`/team/members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /* ---------------- Tokens ---------------- */
  async getTokens() {
    return this.request<any>('/tokens');
  }

  async createToken(data: any) {
    return this.request<any>('/tokens', { method: 'POST', body: JSON.stringify(data) });
  }

  async revokeToken(code: string) {
    return this.request<any>(`/tokens/${code}/revoke`, { method: 'POST' });
  }

  /* ---------------- Notifications ---------------- */
  async getNotifications(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/notifications${query ? `?${query}` : ''}`);
  }

  async markNotificationRead(id: number) {
    return this.request<any>(`/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request<any>('/notifications/read-all', { method: 'POST' });
  }

  /* ---------------- Reports & SOC2 Audit Trail ---------------- */
  async getDashboardReports() {
    return this.request<any>('/reports/dashboard');
  }

  async getReportAuctions(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/reports/auctions${query ? `?${query}` : ''}`);
  }

  async getH1Report(auctionCode: string) {
    return this.request<any>(`/reports/auctions/${auctionCode}/h1`);
  }

  async getAllBidsReport(auctionCode: string) {
    return this.request<any>(`/reports/auctions/${auctionCode}/all-bids`);
  }

  async getAllBiddersReport(auctionCode: string) {
    return this.request<any>(`/reports/auctions/${auctionCode}/all-bidders`);
  }

  async getAuditLogs(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/audit-logs${query ? `?${query}` : ''}`);
  }
}

export const adminApi = new ScrapifyAdminApiClient();
