import { apiClient, ApiResponse } from './client';
import { UserProfile } from '@/lib/stores/user-store';

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  timezone: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
  expiresAt: string;
  permissions: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface TwoFactorSetupResponse {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyRequest {
  code: string;
  secret?: string;
}

// Authentication API Service
export class AuthApi {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      // Set auth token for future requests
      if (response.success && response.data.token) {
        apiClient.setAuthToken(response.data.token);
        
        // Store tokens in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('refresh_token', response.data.refreshToken);
          localStorage.setItem('token_expires_at', response.data.expiresAt);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Register new user account
   */
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      
      // Auto-login after successful registration
      if (response.success && response.data.token) {
        apiClient.setAuthToken(response.data.token);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('refresh_token', response.data.refreshToken);
          localStorage.setItem('token_expires_at', response.data.expiresAt);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken,
      });
      
      if (response.success && response.data.token) {
        apiClient.setAuthToken(response.data.token);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('refresh_token', response.data.refreshToken);
          localStorage.setItem('token_expires_at', response.data.expiresAt);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear stored tokens on refresh failure
      this.logout();
      throw error;
    }
  }

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      // Call logout endpoint to invalidate server-side session
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear local storage and API client token
      apiClient.setAuthToken(null);
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expires_at');
      }
      
      // Clear API cache
      apiClient.clearCache();
    }

    return { success: true, data: undefined };
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>('/auth/me');
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return apiClient.put<UserProfile>('/auth/profile', updates);
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/change-password', passwordData);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/reset-password', { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/reset-password/confirm', {
      token,
      password: newPassword,
    });
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/verify-email', { token });
  }

  /**
   * Resend email verification
   */
  async resendVerification(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/verify-email/resend');
  }

  /**
   * Setup two-factor authentication
   */
  async setupTwoFactor(): Promise<ApiResponse<TwoFactorSetupResponse>> {
    return apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup');
  }

  /**
   * Verify and enable two-factor authentication
   */
  async enableTwoFactor(verifyData: TwoFactorVerifyRequest): Promise<ApiResponse<{ backupCodes: string[] }>> {
    return apiClient.post<{ backupCodes: string[] }>('/auth/2fa/enable', verifyData);
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(code: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/2fa/disable', { code });
  }

  /**
   * Verify two-factor authentication code
   */
  async verifyTwoFactor(code: string): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/2fa/verify', { code });
  }

  /**
   * Get new backup codes for 2FA
   */
  async generateBackupCodes(): Promise<ApiResponse<{ backupCodes: string[] }>> {
    return apiClient.post<{ backupCodes: string[] }>('/auth/2fa/backup-codes');
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>('/auth/account', {
      body: { password },
    });
    
    // Clear local data after successful deletion
    if (response.success) {
      this.logout();
    }
    
    return response;
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('auth_token');
    const expiresAt = localStorage.getItem('token_expires_at');
    
    if (!token || !expiresAt) return false;
    
    // Check if token is expired
    const expirationTime = new Date(expiresAt).getTime();
    const currentTime = Date.now();
    
    return currentTime < expirationTime;
  }

  /**
   * Get stored auth token
   */
  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Get stored refresh token
   */
  getStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  /**
   * Initialize auth state from stored tokens
   */
  async initializeAuth(): Promise<boolean> {
    const token = this.getStoredToken();
    const refreshToken = this.getStoredRefreshToken();
    
    if (!token) return false;
    
    // Check if token is expired
    if (!this.isAuthenticated()) {
      if (refreshToken) {
        try {
          await this.refreshToken(refreshToken);
          return true;
        } catch (error) {
          console.error('Failed to refresh token on init:', error);
          return false;
        }
      }
      return false;
    }
    
    // Set token in API client
    apiClient.setAuthToken(token);
    return true;
  }

  /**
   * Auto-refresh token before expiration
   */
  setupAutoRefresh(): void {
    if (typeof window === 'undefined') return;
    
    const checkAndRefresh = async () => {
      const expiresAt = localStorage.getItem('token_expires_at');
      const refreshToken = this.getStoredRefreshToken();
      
      if (!expiresAt || !refreshToken) return;
      
      const expirationTime = new Date(expiresAt).getTime();
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      // Refresh token if it expires in the next 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        try {
          await this.refreshToken(refreshToken);
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }
    };
    
    // Check every minute
    setInterval(checkAndRefresh, 60 * 1000);
  }
}

// Create singleton instance
export const authApi = new AuthApi();

// Initialize auth on module load
if (typeof window !== 'undefined') {
  authApi.initializeAuth().then((success) => {
    if (success) {
      console.log('Auth initialized successfully');
      authApi.setupAutoRefresh();
    }
  });
}
