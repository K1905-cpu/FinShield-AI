export type UserRole = 'admin' | 'analyst' | 'user';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TransactionStatus = 
  | 'legitimate' 
  | 'under_review' 
  | 'suspicious' 
  | 'confirmed_fraud' 
  | 'dismissed';

export type AlertStatus = 'new' | 'investigating' | 'resolved' | 'dismissed';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: string;
  transactionCount?: number;
  riskLevel?: RiskLevel;
}

export type RiskFactorType = 
  | 'amount_anomaly'
  | 'frequency_anomaly'
  | 'location_anomaly'
  | 'time_anomaly'
  | 'merchant_risk'
  | 'device_anomaly'
  | 'behavioral_anomaly';

export interface RiskContributor {
  factor: RiskFactorType;
  label: string;
  score: number;
  maxScore: number;
  percentage: number;
  reason: string;
}

export interface FraudAnalysis {
  id: string;
  transactionId: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  fraudProbability: number; // percentage 0 - 100
  explanation: string;
  contributors: RiskContributor[];
  analyzedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  location: string;
  paymentMethod: string;
  deviceId: string;
  timestamp: string;
  status: TransactionStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  fraudAnalysis?: FraudAnalysis;
}

export interface FraudAlert {
  id: string;
  transactionId: string;
  userId: string;
  userName?: string;
  amount: number;
  merchant: string;
  severity: AlertSeverity;
  alertType: string;
  reason: string;
  status: AlertStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface FraudRuleConfig {
  highValueThreshold: number;
  velocityWindowMinutes: number;
  velocityCountThreshold: number;
  unusualHoursStart: number; // e.g. 1 (1 AM)
  unusualHoursEnd: number;   // e.g. 5 (5 AM)
  highRiskMerchantCategories: string[];
  weights: {
    amountAnomaly: number;      // 20
    frequencyAnomaly: number;   // 20
    locationAnomaly: number;    // 15
    timeAnomaly: number;        // 10
    merchantRisk: number;       // 15
    deviceAnomaly: number;      // 10
    behavioralAnomaly: number;  // 10
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface UserBehaviorProfile {
  userId: string;
  avgAmount: number;
  maxAmount: number;
  frequentLocations: string[];
  knownDevices: string[];
  commonCategories: string[];
  totalTransactions: number;
  lastTransactionTimestamp?: string;
}

export interface DashboardMetrics {
  totalTransactions: number;
  totalTransactionValue: number;
  suspiciousTransactions: number;
  confirmedFraud: number;
  averageRiskScore: number;
  moneyAtRisk: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  transactionVolumeTimeline: {
    date: string;
    volume: number;
    value: number;
  }[];
  fraudVsLegit: {
    name: string;
    count: number;
    value: number;
  }[];
  fraudTrend: {
    date: string;
    suspicious: number;
    fraud: number;
  }[];
  fraudCategories: {
    category: string;
    count: number;
  }[];
  recentSuspiciousTransactions: Transaction[];
}

export interface PersonalFinanceSummary {
  totalSpending: number;
  monthlySpending: number;
  averageTransaction: number;
  largestTransaction: number;
  spendingByCategory: {
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }[];
  monthlySpendingTrend: {
    month: string;
    amount: number;
  }[];
  weeklySpendingTrend: {
    week: string;
    amount: number;
  }[];
  recentTransactions: Transaction[];
  personalAlerts: FraudAlert[];
  aiInsights: string[];
}

export interface ReportItem {
  id: string;
  name: string;
  type: 'transactions' | 'fraud' | 'suspicious' | 'user_risk';
  generatedAt: string;
  generatedBy: string;
  recordCount: number;
  summary: string;
}
