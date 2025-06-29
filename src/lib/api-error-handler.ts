export interface ApiError {
  type: 'network' | 'auth' | 'rate_limit' | 'server' | 'client' | 'payment_required' | 'unknown';
  message: string;
  status?: number;
  retryable: boolean;
  retryAfter?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export class ApiErrorHandler {
  private static readonly RETRYABLE_STATUSES = [408, 429, 500, 502, 503, 504];
  private static readonly AUTH_STATUSES = [401, 403];
  private static readonly CLIENT_STATUSES = [400, 422];
  private static readonly RATE_LIMIT_STATUSES = [429];
  private static readonly PAYMENT_STATUSES = [402];

  static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (response.ok) {
      try {
        const data = await response.json();
        return { data };
      } catch (error) {
        return {
          error: {
            type: 'unknown',
            message: 'Failed to parse response data',
            status: response.status,
            retryable: false
          }
        };
      }
    }

    return {
      error: await this.parseErrorResponse(response)
    };
  }

  static async parseErrorResponse(response: Response): Promise<ApiError> {
    let errorData: any = {};
    
    try {
      errorData = await response.json();
    } catch {
      // If we can't parse JSON, use status text
      errorData = { message: response.statusText };
    }

    const status = response.status;
    const message = errorData.error?.message || errorData.message || response.statusText || 'Unknown error occurred';

    // Determine error type and retryability
    if (this.AUTH_STATUSES.includes(status)) {
      return {
        type: 'auth',
        message: this.getAuthErrorMessage(status, message),
        status,
        retryable: false
      };
    }

    if (this.PAYMENT_STATUSES.includes(status)) {
      return {
        type: 'payment_required',
        message: this.getPaymentErrorMessage(message),
        status,
        retryable: false
      };
    }

    if (this.RATE_LIMIT_STATUSES.includes(status)) {
      const retryAfter = this.extractRetryAfter(response);
      return {
        type: 'rate_limit',
        message: this.getRateLimitErrorMessage(message),
        status,
        retryable: true,
        retryAfter
      };
    }

    if (this.CLIENT_STATUSES.includes(status)) {
      return {
        type: 'client',
        message: this.getClientErrorMessage(status, message),
        status,
        retryable: false
      };
    }

    if (this.RETRYABLE_STATUSES.includes(status)) {
      return {
        type: 'server',
        message: this.getServerErrorMessage(status, message),
        status,
        retryable: true
      };
    }

    return {
      type: 'unknown',
      message: this.getUnknownErrorMessage(status, message),
      status,
      retryable: false
    };
  }

  static async handleNetworkError(error: any): Promise<ApiError> {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network connection failed. Please check your internet connection and try again.',
        retryable: true
      };
    }

    if (error.name === 'AbortError') {
      return {
        type: 'network',
        message: 'Request was cancelled. Please try again.',
        retryable: true
      };
    }

    return {
      type: 'unknown',
      message: 'An unexpected error occurred. Please try again.',
      retryable: false
    };
  }

  private static extractRetryAfter(response: Response): number | undefined {
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      return isNaN(seconds) ? undefined : seconds;
    }
    return undefined;
  }

  private static getAuthErrorMessage(status: number, originalMessage: string): string {
    switch (status) {
      case 401:
        return 'Invalid OpenRouter API key. Please check your key and try again.';
      case 403:
        return 'Access denied. Your OpenRouter API key may not have the required permissions.';
      default:
        return originalMessage;
    }
  }

  private static getRateLimitErrorMessage(originalMessage: string): string {
    return `Rate limit exceeded. ${originalMessage} Please wait a moment before trying again.`;
  }

  private static getClientErrorMessage(status: number, originalMessage: string): string {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 422:
        return 'Request validation failed. Please check your input format.';
      default:
        return originalMessage;
    }
  }

  private static getServerErrorMessage(status: number, originalMessage: string): string {
    switch (status) {
      case 500:
        return 'Internal server error. Please try again in a few moments.';
      case 502:
        return 'Bad gateway. The service is temporarily unavailable.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      case 504:
        return 'Gateway timeout. The request took too long to process.';
      default:
        return `Server error (${status}): ${originalMessage}`;
    }
  }

  private static getUnknownErrorMessage(status: number, originalMessage: string): string {
    return `Unexpected error (${status}): ${originalMessage}`;
  }

  private static getPaymentErrorMessage(originalMessage: string): string {
    if (originalMessage.includes('quota') || originalMessage.includes('billing') || originalMessage.includes('payment') || originalMessage.includes('subscription')) {
      return 'Insufficient quota or subscription issue. Please check your GitHub Marketplace subscription.';
    }
    return `Payment required: ${originalMessage}`;
  }

  static shouldRetry(error: ApiError, attempt: number): boolean {
    const maxRetries = 3;
    return error.retryable && attempt < maxRetries;
  }

  static getRetryDelay(attempt: number, retryAfter?: number): number {
    if (retryAfter) {
      return retryAfter * 1000; // Convert seconds to milliseconds
    }
    
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, attempt - 1), 10000);
  }
}

export const createApiClient = (apiKey: string) => {
  const baseHeaders = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  return {
    async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const finalHeaders = {
        ...baseHeaders,
        ...options.headers
      };

      try {
        const response = await fetch(url, {
          ...options,
          headers: finalHeaders,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        return await ApiErrorHandler.handleResponse<T>(response);
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === 'AbortError') {
          return {
            error: {
              type: 'network',
              message: 'Request timed out. Please try again.',
              retryable: true
            }
          };
        }

        const networkError = await ApiErrorHandler.handleNetworkError(error);
        return { error: networkError };
      }
    },

    async requestWithRetry<T>(
      url: string, 
      options: RequestInit = {}, 
      maxRetries: number = 3
    ): Promise<ApiResponse<T>> {
      let lastError: ApiError | undefined;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const result = await this.request(url, options);
        
        if (result.data) {
          return result;
        }

        if (result.error) {
          lastError = result.error;
          
          if (!ApiErrorHandler.shouldRetry(result.error, attempt)) {
            break;
          }

          const delay = ApiErrorHandler.getRetryDelay(attempt, result.error.retryAfter);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      return { error: lastError! };
    }
  };
}; 