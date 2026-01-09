// Blood Donor Management System Types

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Donor {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: BloodGroup;
  city: string;
  area: string;
  address: string;
  latitude?: number;
  longitude?: number;
  lastDonationDate: string | null;
  isAvailable: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface BloodRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospitalName: string;
  city: string;
  area: string;
  contactName: string;
  contactPhone: string;
  urgency: 'critical' | 'high' | 'medium';
  requiredBy: string;
  notes?: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  createdAt: string;
}

export interface MatchedDonor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  city: string;
  area: string;
  phone: string;
  latitude?: number;
  longitude?: number;
}

export interface Statistics {
  totalDonors: number;
  activeDonors: number;
  inactiveDonors: number;
  availableDonors: number;
  unavailableDonors: number;
  byBloodGroup: Record<BloodGroup, number>;
  byCity: Record<string, number>;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, phone: string, otp: string) => Promise<void>;
  logout: () => void;
}
