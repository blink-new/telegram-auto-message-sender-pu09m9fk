export interface TelegramCredentials {
  apiId: string;
  apiHash: string;
  phoneNumber: string;
}

export interface TelegramAuthResponse {
  success: boolean;
  message: string;
  sessionString?: string;
  requiresPassword?: boolean;
  user?: any;
  error?: string;
}

export class TelegramAPI {
  private static readonly FUNCTION_URL = 'https://pu09m9fk--telegram-auth.functions.blink.new';

  static validateCredentials(credentials: TelegramCredentials): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate API ID
    if (!credentials.apiId) {
      errors.push('API ID is required');
    } else if (!/^\d+$/.test(credentials.apiId)) {
      errors.push('API ID must be numeric (e.g., 1234567)');
    } else if (credentials.apiId.length < 6 || credentials.apiId.length > 8) {
      errors.push('API ID should be 6-8 digits long');
    }

    // Validate API Hash
    if (!credentials.apiHash) {
      errors.push('API Hash is required');
    } else if (!/^[a-f0-9]{32}$/.test(credentials.apiHash)) {
      errors.push('API Hash must be exactly 32 hexadecimal characters (a-f, 0-9)');
    }

    // Validate Phone Number
    if (!credentials.phoneNumber) {
      errors.push('Phone number is required');
    } else if (!/^\+\d{10,15}$/.test(credentials.phoneNumber)) {
      errors.push('Phone number must include country code (e.g., +1234567890)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static async sendVerificationCode(credentials: TelegramCredentials): Promise<TelegramAuthResponse> {
    try {
      const response = await fetch(this.FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_code',
          apiId: credentials.apiId,
          apiHash: credentials.apiHash,
          phoneNumber: credentials.phoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Send verification code error:', error);
      return {
        success: false,
        message: 'Network error. Please check your internet connection and try again.',
        error: 'NETWORK_ERROR'
      };
    }
  }

  static async verifyCode(
    credentials: TelegramCredentials,
    code: string
  ): Promise<TelegramAuthResponse> {
    try {
      const response = await fetch(this.FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify_code',
          apiId: credentials.apiId,
          apiHash: credentials.apiHash,
          phoneNumber: credentials.phoneNumber,
          code: code,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Verify code error:', error);
      return {
        success: false,
        message: 'Network error. Please check your internet connection and try again.',
        error: 'NETWORK_ERROR'
      };
    }
  }

  static async checkPassword(
    credentials: TelegramCredentials,
    password: string,
    sessionString?: string
  ): Promise<TelegramAuthResponse> {
    try {
      const response = await fetch(this.FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check_password',
          apiId: credentials.apiId,
          apiHash: credentials.apiHash,
          password: password,
          sessionString: sessionString,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Check password error:', error);
      return {
        success: false,
        message: 'Network error. Please check your internet connection and try again.',
        error: 'NETWORK_ERROR'
      };
    }
  }

  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Add + if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  static getApiInstructions(): { title: string; description: string; steps: string[] } {
    return {
      title: 'How to Get Telegram API Credentials',
      description: 'Follow these steps to obtain your API ID and Hash from Telegram:',
      steps: [
        'Go to https://my.telegram.org/apps',
        'Log in with your Telegram account (phone number + verification code)',
        'Click "Create new application"',
        'Fill in the required fields:',
        '  • App title: Any name (e.g., "Message Sender")',
        '  • Short name: Any short name (e.g., "msgsender")',
        '  • Platform: Choose "Desktop"',
        '  • Description: Optional',
        'Click "Create application"',
        'Copy your API ID (numeric) and API Hash (32-character hex string)',
        'Keep these credentials secure and never share them publicly'
      ]
    };
  }
}