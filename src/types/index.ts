// Blood Donor Management System Types
// Aligned with database schema (database.sql) and ERD (erd.jpeg)

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  createdAt: string;
  isActive: boolean;
  donorId?: number; // Links to DONOR table
  isRegistered?: boolean; // Whether user has completed donor registration
  isAdmin?: boolean; // Whether user is admin
}

// Corresponds to LOCATION table in ERD
export interface Location {
  locationId: number;
  city: string;
  area: string;
  latitude?: number;
  longitude?: number;
}

// Corresponds to BLOOD_GROUP table in ERD
export interface BloodGroupRecord {
  bgId: number;
  bgName: string;
  rhFactor: '+' | '-';
}

// Corresponds to DONOR table in ERD with relationships
export interface Donor {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  age: number;
  dateOfBirth?: string | null; // Date of birth for automatic age calculation
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

// Corresponds to CONTACT_NUMBER table in ERD
export interface ContactNumber {
  contactId: number;
  donorId: number;
  phoneNumber: string;
}

// Corresponds to BLOOD_COMPATIBILITY table in ERD
export interface BloodCompatibility {
  compId: number;
  donorBg: number;
  receiverBg: number;
}

// Corresponds to EMERGENCY_REQUEST table in ERD
export interface EmergencyRequest {
  requestId: number;
  bloodGroup: BloodGroup;
  hospitalName: string;
  requestDate: string;
  locationId: number;
  contactNumber: string;
  city?: string;
  area?: string;
}

// Corresponds to OTP table in ERD
export interface OTPRecord {
  otpId: number;
  donorId: number;
  otpCode: string;
  expiryTime: string;
  isVerified: boolean;
}

// Frontend-specific types (for UI state)
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
