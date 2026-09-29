import { 
  User, 
  Transaction, 
  FraudAnalysis, 
  FraudAlert, 
  FraudRuleConfig, 
  AuditLog, 
  DashboardMetrics, 
  PersonalFinanceSummary,
  ReportItem
} from '../types/shared';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('finshield_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.body instanceof FormData 
    ? {
        ...(localStorage.getItem('finshield_token') 
            ? { 'Authorization': `Bearer ${localStorage.getItem('finshield_token')}` } 
            : {})
      }
    : { ...getAuthHeaders(), ...options.headers };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ error: 'Failed to parse JSON response' }));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: { name: string; email: string; password: string; confirmPassword: string }) =>
      request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getMe: () => request<{ user: User }>('/auth/me'),
    getDemoAccounts: () => request<{ accounts: { role: string; email: string; password: string; description: string }[] }>('/auth/demo-accounts'),
  },

  // Dashboard
  dashboard: {
    getMetrics: () => request<DashboardMetrics>('/dashboard'),
  },

  // Transactions
  transactions: {
    getAll: (params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      riskLevel?: string;
      category?: string;
      minAmount?: number;
      maxAmount?: number;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      userId?: string;
    } = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      return request<{
        transactions: Transaction[];
        total: number;
        page: number;
        totalPages: number;
        limit: number;
      }>(`/transactions?${query.toString()}`);
    },

    getById: (id: string) => request<{ transaction: Transaction }>(`/transactions/${id}`),

    create: (data: {
      amount: number;
      currency?: string;
      merchant: string;
      category: string;
      location: string;
      paymentMethod: string;
      deviceId: string;
      timestamp?: string;
      userId?: string;
    }) =>
      request<{
        success: boolean;
        transaction: Transaction;
        alert?: FraudAlert;
      }>('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateStatus: (id: string, status: string) =>
      request<{
        success: boolean;
        message: string;
        transaction: Transaction;
      }>(`/transactions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    uploadCSV: (file: File | null, csvData?: string) => {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        return request<{
          success: boolean;
          totalRows: number;
          validRows: number;
          invalidRows: number;
          importedRows: number;
          suspiciousDetected: number;
          fraudDetected: number;
          errors: { row: number; error: string }[];
        }>('/transactions/upload', {
          method: 'POST',
          body: formData,
        });
      } else {
        return request<{
          success: boolean;
          totalRows: number;
          validRows: number;
          invalidRows: number;
          importedRows: number;
          suspiciousDetected: number;
          fraudDetected: number;
          errors: { row: number; error: string }[];
        }>('/transactions/upload', {
          method: 'POST',
          body: JSON.stringify({ csvData }),
        });
      }
    },
  },

  // Fraud Engine
  fraud: {
    analyze: (data: {
      amount: number;
      currency?: string;
      merchant: string;
      category: string;
      location: string;
      paymentMethod: string;
      deviceId: string;
      timestamp?: string;
      userId?: string;
    }) =>
      request<{
        success: boolean;
        analysis: FraudAnalysis & {
          alertTriggered: boolean;
          alertType?: string;
          alertSeverity?: string;
          weightsUsed: any;
          userBaseline: any;
        };
      }>('/fraud/analyze', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMatrix: () => request<{
      factors: {
        id: string;
        name: string;
        maxPoints: number;
        description: string;
        thresholdRule: string;
      }[];
      rules: FraudRuleConfig;
    }>('/fraud/matrix'),
  },

  // Alerts
  alerts: {
    getAll: (params: { status?: string; severity?: string; page?: number; limit?: number } = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      return request<{
        alerts: FraudAlert[];
        total: number;
        page: number;
        totalPages: number;
        limit: number;
      }>(`/alerts?${query.toString()}`);
    },

    updateStatus: (id: string, status: string) =>
      request<{ success: boolean; message: string }>(`/alerts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Analytics
  analytics: {
    getAnalytics: (params: { category?: string; riskLevel?: string; startDate?: string; endDate?: string } = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      return request<{
        metrics: {
          totalTransactions: number;
          totalTransactionValue: number;
          suspiciousCount: number;
          fraudCount: number;
          moneyAtRisk: number;
          avgRiskScore: number;
        };
        categoryBreakdown: { category: string; totalCount: number; fraudCount: number; suspiciousCount: number; totalAmount: number }[];
        locationBreakdown: { location: string; count: number; fraudCount: number; amount: number }[];
        paymentBreakdown: { method: string; count: number; fraudCount: number; amount: number }[];
        hourDistribution: { hour: string; total: number; fraud: number }[];
        riskDistribution: { name: string; count: number; color: string }[];
      }>(`/analytics?${query.toString()}`);
    },
  },

  // Personal Finance
  personalFinance: {
    getSummary: () => request<PersonalFinanceSummary>('/personal-finance'),
  },

  // Simulation
  simulation: {
    normal: () =>
      request<{
        success: boolean;
        transaction: Transaction;
        message: string;
      }>('/simulation/normal', { method: 'POST' }),

    suspicious: () =>
      request<{
        success: boolean;
        transaction: Transaction;
        alert: FraudAlert;
        message: string;
      }>('/simulation/suspicious', { method: 'POST' }),
  },

  // Admin
  admin: {
    getUsers: () => request<{ users: User[] }>('/admin/users'),
    updateRole: (userId: string, role: string) =>
      request<{ success: boolean; message: string }>(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    updateStatus: (userId: string, status: string) =>
      request<{ success: boolean; message: string }>(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    getRules: () => request<{ rules: FraudRuleConfig }>('/admin/rules'),
    updateRules: (rules: Partial<FraudRuleConfig>) =>
      request<{ success: boolean; message: string; rules: FraudRuleConfig }>('/admin/rules', {
        method: 'PATCH',
        body: JSON.stringify(rules),
      }),
    getAuditLogs: (params: { page?: number; limit?: number; search?: string } = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      return request<{
        logs: AuditLog[];
        total: number;
        page: number;
        totalPages: number;
        limit: number;
      }>(`/admin/audit-logs?${query.toString()}`);
    },
  },

  // Reports
  reports: {
    getAll: () => request<{ reports: ReportItem[] }>('/reports'),
    generate: (data: { type: string; name?: string; startDate?: string; endDate?: string }) =>
      request<{ success: boolean; report: ReportItem; data: any[] }>('/reports/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
