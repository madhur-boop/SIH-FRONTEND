export type PageType =
  | 'dashboard' | 'users' | 'documents' | 'verification' | 'review'
  | 'history' | 'notifications' | 'settings' | 'profile'

export interface UserRecord {
  id: string
  name: string
  email: string
  phone: string
  totalDocs: number
  verified: number
  pending: number
  rejected: number
  needsReview: number
  status: 'Active' | 'Suspended' | 'Inactive'
  joined: string
  initials: string
  role?: string
}

export interface DocRecord {
  id: string
  userId: string
  userName: string
  type: string
  status: 'Pending' | 'Verified' | 'Rejected' | 'Needs Review'
  submitted: string
  rejectionReason?: string
  rejectionNote?: string
  verifiedBy?: string
  verifiedAt?: string
}

export interface HistoryRecord {
  id: string
  userId: string
  userName: string
  docId: string
  docType: string
  verifiedBy: string
  dateTime: string
  result: 'Verified' | 'Rejected' | 'Needs Review' | string
  rejectionReason?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

// Backend models
export interface BackendUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  department?: string;
  createdAt: string;
}

export interface BackendDocument {
  _id: string;
  user: BackendUser | string;
  fileName: string;
  filePath: string;
  documentType: string;
  uploadedAt: string;
  ocrStatus: string;
  validationStatus: string;
  fakeDocumentStatus: string;
  riskScore: number;
  riskLevel: string;
  riskReasons: string[];
  reviewStatus: string;
  reviewDecision?: string;
  reviewComment?: string;
  reviewedBy?: BackendUser | string;
  reviewedAt?: string;
  
  // Results
  ocrData?: any;
  extractedData?: any;
  validationDetails?: any;
  fakeDetectionDetails?: {
    evidence?: any;
    finalDecision?: any;
  };
  faceVerification?: any;
  selfiePath?: string;
}

export interface BackendAuditLog {
  _id: string;
  actor: BackendUser | string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  status: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  metadata?: any;
}

export interface BackendStats {
  success: boolean;
  stats?: {
    users: {
      total: number;
      active: number;
      inactive: number;
    };
    documents: {
      total: number;
      recentWeek?: number;
      pendingReview: number;
      approved: number;
      rejected: number;
      suspicious: number;
    };
    risk: {
      critical: number;
      high: number;
    };
  };
  recentAuditLogs?: BackendAuditLog[];
}
