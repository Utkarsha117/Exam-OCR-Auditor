export type UserRole = 'student' | 'teacher' | 'mis';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  mobile?: string;
  abcId?: string;
  registrationNo?: string;
  department?: string;
  createdAt: string;
}

export interface SubjectResult {
  code: string;
  name: string;
  credits: number;
  grade: string;
  points: number;
}

export interface GPAEntry {
  id?: string;
  uid: string;
  registrationNo?: string;
  studentName?: string;
  semester: string;
  examination: string;
  sgpa: number;
  cgpa: number;
  totalEgp: number;
  totalMarks?: number;
  maxMarks?: number;
  percentage?: number;
  verificationStatus: 'verified' | 'discrepancy' | 'pending';
  backlogStatus: boolean;
  subjects: SubjectResult[];
  timestamp: any;
  fileName: string;
  calculatedSgpa?: number;
  uploadedBy?: string;
  uploadedByName?: string;
  analysis?: {
    expectedEgp: number;
    expectedCredits: number;
    discrepancies: string[];
  };
}

export interface AuditLog {
  id?: string;
  facultyId: string;
  facultyName: string;
  action: string;
  description?: string;
  fileName: string;
  timestamp: any;
}
