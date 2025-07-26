/**
 * @jest-environment jsdom
 */

import { AuthApi, LoginRequest, RegisterRequest, AuthResponse } from '../auth';
import { apiClient, ApiResponse, ApiError } from '../client';

// Mock the API client
jest.mock('../client', () => ({
  apiClient: {
    post: jest.fn(),
    delete: jest.fn(),
    setAuthToken: jest.fn(),
    clearCache: jest.fn(),
  },
  ApiError: class MockApiError extends Error {
    constructor(message: string, public code: string, public status: number, public details?: any) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console methods
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
};

describe('AuthApi', () => {
  let authApi: AuthApi;
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    authApi = new AuthApi();
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    consoleSpy.error.mockClear();
    consoleSpy.log.mockClear();
  });

  afterAll(() => {
    consoleSpy.error.mockRestore();
    consoleSpy.log.mockRestore();
  });

  describe('login', () => {
    const mockLoginRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true,
    };

    const mockAuthResponse: AuthResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      permissions: ['read', 'write'],
    };

    it('should login successfully and store tokens', async () => {
      const mockResponse: ApiResponse<AuthResponse> = {
        success: true,
        data: mockAuthResponse,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authApi.login(mockLoginRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', mockLoginRequest);
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(mockAuthResponse.token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', mockAuthResponse.token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', mockAuthResponse.refreshToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token_expires_at', mockAuthResponse.expiresAt);
      expect(result).toEqual(mockResponse);
    });

    it('should handle login failure', async () => {
      const mockError = new ApiError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
      mockApiClient.post.mockRejectedValue(mockError);

      await expect(authApi.login(mockLoginRequest)).rejects.toThrow('Invalid credentials');
      expect(consoleSpy.error).toHaveBeenCalledWith('Login failed:', mockError);
      expect(mockApiClient.setAuthToken).not.toHaveBeenCalled();
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should not store tokens if login response is unsuccessful', async () => {
      const mockResponse: ApiResponse<AuthResponse> = {
        success: false,
        data: mockAuthResponse,
        message: 'Login failed',
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authApi.login(mockLoginRequest);

      expect(mockApiClient.setAuthToken).not.toHaveBeenCalled();
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should handle missing token in successful response', async () => {
      const responseWithoutToken = { ...mockAuthResponse, token: '' };
      const mockResponse: ApiResponse<AuthResponse> = {
        success: true,
        data: responseWithoutToken,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authApi.login(mockLoginRequest);

      expect(mockApiClient.setAuthToken).not.toHaveBeenCalled();
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    const mockRegisterRequest: RegisterRequest = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      username: 'newuser',
      timezone: 'UTC',
    };

    const mockAuthResponse: AuthResponse = {
      user: {
        id: '2',
        email: 'newuser@example.com',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      permissions: ['read'],
    };

    it('should register successfully and auto-login', async () => {
      const mockResponse: ApiResponse<AuthResponse> = {
        success: true,
        data: mockAuthResponse,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authApi.register(mockRegisterRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', mockRegisterRequest);
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(mockAuthResponse.token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', mockAuthResponse.token);
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration failure', async () => {
      const mockError = new ApiError('Email already exists', 'EMAIL_EXISTS', 409);
      mockApiClient.post.mockRejectedValue(mockError);

      await expect(authApi.register(mockRegisterRequest)).rejects.toThrow('Email already exists');
      expect(consoleSpy.error).toHaveBeenCalledWith('Registration failed:', mockError);
    });
  });

  describe('refreshToken', () => {
    const mockRefreshToken = 'mock-refresh-token';
    const mockAuthResponse: AuthResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'new-jwt-token',
      refreshToken: 'new-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      permissions: ['read', 'write'],
    };

    it('should refresh token successfully', async () => {
      const mockResponse: ApiResponse<AuthResponse> = {
        success: true,
        data: mockAuthResponse,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authApi.refreshToken(mockRefreshToken);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: mockRefreshToken,
      });
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(mockAuthResponse.token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', mockAuthResponse.token);
      expect(result).toEqual(mockResponse);
    });

    it('should handle refresh token failure and logout', async () => {
      const mockError = new ApiError('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
      mockApiClient.post.mockRejectedValue(mockError);

      // Mock logout method
      const logoutSpy = jest.spyOn(authApi, 'logout').mockResolvedValue({
        success: true,
        data: undefined,
      });

      await expect(authApi.refreshToken(mockRefreshToken)).rejects.toThrow('Invalid refresh token');
      expect(logoutSpy).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledWith('Token refresh failed:', mockError);

      logoutSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear local storage', async () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authApi.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(null);
      expect(mockApiClient.clearCache).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token_expires_at');
      expect(result).toEqual({ success: true, data: undefined });
    });

    it('should clear local storage even if API call fails', async () => {
      const mockError = new ApiError('Server error', 'SERVER_ERROR', 500);
      mockApiClient.post.mockRejectedValue(mockError);

      const result = await authApi.logout();

      expect(consoleSpy.error).toHaveBeenCalledWith('Logout API call failed:', mockError);
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(null);
      expect(mockApiClient.clearCache).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(result).toEqual({ success: true, data: undefined });
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authApi.requestPasswordReset('test@example.com');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        email: 'test@example.com',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined,
      };

      const passwordData = {
        currentPassword: 'oldpass',
        newPassword: 'newpass',
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authApi.changePassword(passwordData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/change-password', passwordData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authApi.verifyEmail('verification-token');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/verify-email', {
        token: 'verification-token',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Two-Factor Authentication', () => {
    describe('setupTwoFactor', () => {
      it('should setup 2FA successfully', async () => {
        const mockResponse: ApiResponse<any> = {
          success: true,
          data: {
            qrCode: 'data:image/png;base64,mock-qr-code',
            secret: 'MOCK2FASECRET',
            backupCodes: ['123456', '789012'],
          },
        };

        mockApiClient.post.mockResolvedValue(mockResponse);

        const result = await authApi.setupTwoFactor();

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/2fa/setup');
        expect(result).toEqual(mockResponse);
      });
    });

    describe('enableTwoFactor', () => {
      it('should enable 2FA successfully', async () => {
        const mockResponse: ApiResponse<{ backupCodes: string[] }> = {
          success: true,
          data: {
            backupCodes: ['123456', '789012', '345678'],
          },
        };

        mockApiClient.post.mockResolvedValue(mockResponse);

        const result = await authApi.enableTwoFactor({ code: '123456' });

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/2fa/enable', { code: '123456' });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('disableTwoFactor', () => {
      it('should disable 2FA successfully', async () => {
        const mockResponse: ApiResponse<void> = {
          success: true,
          data: undefined,
        };

        mockApiClient.post.mockResolvedValue(mockResponse);

        const result = await authApi.disableTwoFactor('123456');

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/2fa/disable', { code: '123456' });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('verifyTwoFactor', () => {
      it('should verify 2FA code successfully', async () => {
        const mockAuthResponse: AuthResponse = {
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            timezone: 'UTC',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          permissions: ['read', 'write'],
        };

        const mockResponse: ApiResponse<AuthResponse> = {
          success: true,
          data: mockAuthResponse,
        };

        mockApiClient.post.mockResolvedValue(mockResponse);

        const result = await authApi.verifyTwoFactor('123456');

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/2fa/verify', { code: '123456' });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('generateBackupCodes', () => {
      it('should generate backup codes successfully', async () => {
        const mockResponse: ApiResponse<{ backupCodes: string[] }> = {
          success: true,
          data: {
            backupCodes: ['111111', '222222', '333333', '444444', '555555'],
          },
        };

        mockApiClient.post.mockResolvedValue(mockResponse);

        const result = await authApi.generateBackupCodes();

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/2fa/backup-codes');
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully and logout', async () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined,
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      // Mock logout method
      const logoutSpy = jest.spyOn(authApi, 'logout').mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await authApi.deleteAccount('password123');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/auth/account', {
        body: { password: 'password123' },
      });
      expect(logoutSpy).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);

      logoutSpy.mockRestore();
    });

    it('should not logout if account deletion fails', async () => {
      const mockResponse: ApiResponse<void> = {
        success: false,
        data: undefined,
        message: 'Invalid password',
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      const logoutSpy = jest.spyOn(authApi, 'logout').mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await authApi.deleteAccount('wrongpassword');

      expect(logoutSpy).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);

      logoutSpy.mockRestore();
    });
  });

  describe('Authentication State Management', () => {
    describe('isAuthenticated', () => {
      it('should return false when no token exists', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = authApi.isAuthenticated();

        expect(result).toBe(false);
      });

      it('should return false when token is expired', () => {
        const expiredDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
        localStorageMock.getItem.mockImplementation((key) => {
          if (key === 'auth_token') return 'mock-token';
          if (key === 'token_expires_at') return expiredDate;
          return null;
        });

        const result = authApi.isAuthenticated();

        expect(result).toBe(false);
      });

      it('should return true when token is valid and not expired', () => {
        const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
        localStorageMock.getItem.mockImplementation((key) => {
          if (key === 'auth_token') return 'mock-token';
          if (key === 'token_expires_at') return futureDate;
          return null;
        });

        const result = authApi.isAuthenticated();

        expect(result).toBe(true);
      });

      it('should return false in server environment', () => {
        // Mock server environment
        const originalWindow = global.window;
        delete (global as any).window;

        const result = authApi.isAuthenticated();

        expect(result).toBe(false);

        // Restore window
        global.window = originalWindow;
      });
    });

    describe('getStoredToken', () => {
      it('should return stored token', () => {
        localStorageMock.getItem.mockReturnValue('stored-token');

        const result = authApi.getStoredToken();

        expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
        expect(result).toBe('stored-token');
      });

      it('should return null in server environment', () => {
        const originalWindow = global.window;
        delete (global as any).window;

        const result = authApi.getStoredToken();

        expect(result).toBeNull();

        global.window = originalWindow;
      });
    });

    describe('initializeAuth', () => {
      it('should return false when no token exists', async () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = await authApi.initializeAuth();

        expect(result).toBe(false);
      });

      it('should set token and return true when token is valid', async () => {
        const futureDate = new Date(Date.now() + 3600000).toISOString();
        localStorageMock.getItem.mockImplementation((key) => {
          if (key === 'auth_token') return 'valid-token';
          if (key === 'token_expires_at') return futureDate;
          return null;
        });

        const result = await authApi.initializeAuth();

        expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('valid-token');
        expect(result).toBe(true);
      });

      it('should attempt refresh when token is expired but refresh token exists', async () => {
        const expiredDate = new Date(Date.now() - 3600000).toISOString();
        localStorageMock.getItem.mockImplementation((key) => {
          if (key === 'auth_token') return 'expired-token';
          if (key === 'refresh_token') return 'refresh-token';
          if (key === 'token_expires_at') return expiredDate;
          return null;
        });

        const refreshSpy = jest.spyOn(authApi, 'refreshToken').mockResolvedValue({
          success: true,
          data: {} as AuthResponse,
        });

        const result = await authApi.initializeAuth();

        expect(refreshSpy).toHaveBeenCalledWith('refresh-token');
        expect(result).toBe(true);

        refreshSpy.mockRestore();
      });

      it('should return false when refresh fails', async () => {
        const expiredDate = new Date(Date.now() - 3600000).toISOString();
        localStorageMock.getItem.mockImplementation((key) => {
          if (key === 'auth_token') return 'expired-token';
          if (key === 'refresh_token') return 'invalid-refresh-token';
          if (key === 'token_expires_at') return expiredDate;
          return null;
        });

        const refreshSpy = jest.spyOn(authApi, 'refreshToken').mockRejectedValue(
          new ApiError('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401)
        );

        const result = await authApi.initializeAuth();

        expect(refreshSpy).toHaveBeenCalledWith('invalid-refresh-token');
        expect(consoleSpy.error).toHaveBeenCalledWith(
          'Failed to refresh token on init:',
          expect.any(ApiError)
        );
        expect(result).toBe(false);

        refreshSpy.mockRestore();
      });
    });
  });
});
