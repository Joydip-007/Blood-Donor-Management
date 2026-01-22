/**
 * Bangladesh Phone Number Utilities
 */

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valid Bangladesh mobile operator prefixes
 */
const BD_MOBILE_PREFIXES = [
  '013', // Grameenphone
  '014', // Banglalink (Ollo)
  '015', // Teletalk
  '016', // Airtel
  '017', // Grameenphone
  '018', // Robi
  '019', // Banglalink
];

/**
 * Validate Bangladesh mobile number
 * Format: 01[3-9]XXXXXXXX (11 digits)
 */
export function validateBangladeshPhone(phone: string): PhoneValidationResult {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');

  // Check length
  if (cleaned.length !== 11) {
    return { isValid: false, error: 'Phone number must be exactly 11 digits' };
  }

  // Check if it starts with 01
  if (!cleaned.startsWith('01')) {
    return { isValid: false, error: 'Phone number must start with 01' };
  }

  // Check if all characters are digits
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: 'Phone number must contain only digits' };
  }

  // Check if prefix is valid
  const prefix = cleaned.substring(0, 3);
  if (!BD_MOBILE_PREFIXES.includes(prefix)) {
    return { 
      isValid: false, 
      error: `Invalid operator prefix. Must start with: ${BD_MOBILE_PREFIXES.join(', ')}` 
    };
  }

  return { isValid: true };
}

/**
 * Format phone number for display
 * 01744423250 → +880 1744-423250
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  
  const cleaned = phone.replace(/[\s-]/g, '');
  
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    // Remove leading 0 and add country code
    return `+880 ${cleaned.slice(1, 5)}-${cleaned.slice(5)}`;
  }
  
  return phone;
}

/**
 * Clean phone number (remove formatting)
 * +880 1744-423250 → 01744423250
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 880, convert to 01XXX format
  if (cleaned.startsWith('880') && cleaned.length === 13) {
    cleaned = '0' + cleaned.slice(3);
  }
  
  return cleaned;
}

/**
 * Get operator name from phone number
 */
export function getOperatorName(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  
  if (cleaned.length !== 11) return 'Unknown';
  
  const prefix = cleaned.slice(0, 3);
  
  const operators: Record<string, string> = {
    '013': 'Grameenphone',
    '014': 'Banglalink',
    '015': 'Teletalk',
    '016': 'Airtel',
    '017': 'Grameenphone',
    '018': 'Robi',
    '019': 'Banglalink'
  };
  
  return operators[prefix] || 'Unknown';
}

/**
 * Get phone validation error message (returns null if valid)
 */
export function getPhoneErrorMessage(phone: string): string | null {
  const result = validateBangladeshPhone(phone);
  return result.isValid ? null : (result.error || 'Invalid phone number');
}
