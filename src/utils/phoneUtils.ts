/**
 * Bangladesh Phone Number Validation Utility
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  error?: string;
}

/**
 * Validate Bangladesh phone number (11 digits, starts with 01)
 */
export function validateBangladeshPhone(phone: string): PhoneValidationResult {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's 11 digits
  if (cleaned.length !== 11) {
    return {
      isValid: false,
      formatted: cleaned,
      error: 'Phone number must be exactly 11 digits'
    };
  }
  
  // Check if it starts with 01
  if (!cleaned.startsWith('01')) {
    return {
      isValid: false,
      formatted: cleaned,
      error: 'Bangladesh phone numbers must start with 01'
    };
  }
  
  // Check if it has a valid operator prefix
  const validPrefixes = ['013', '014', '015', '016', '017', '018', '019'];
  const prefix = cleaned.substring(0, 3);
  
  if (!validPrefixes.includes(prefix)) {
    return {
      isValid: false,
      formatted: cleaned,
      error: 'Invalid Bangladesh operator prefix'
    };
  }
  
  return {
    isValid: true,
    formatted: cleaned
  };
}

/**
 * Format phone number for display: 01XXX-XXXXXX
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  }
  
  return phone;
}

/**
 * Format phone number with country code: +880 1XXX-XXXXXX
 */
export function formatPhoneWithCountryCode(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    // Validate operator prefix before formatting
    const validPrefixes = ['013', '014', '015', '016', '017', '018', '019'];
    const prefix = cleaned.substring(0, 3);
    
    if (validPrefixes.includes(prefix)) {
      // Remove the leading 0 and add +880
      const withoutZero = cleaned.substring(1);
      return `+880 ${withoutZero.substring(0, 4)}-${withoutZero.substring(4)}`;
    }
  }
  
  return phone;
}

/**
 * Format phone number for display (legacy - kept for backwards compatibility)
 * 01744423250 → +880 1744-423250
 */
export function formatPhoneForDisplay(phone: string): string {
  return formatPhoneWithCountryCode(phone);
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
