/**
 * Network Manager for handling connectivity and offline scenarios
 * Provides network status monitoring and intelligent retry strategies
 */

import { ErrorManager, AppError, ErrorType, ErrorSeverity } from '@/lib/errors/ErrorManager';

export enum NetworkStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  SLOW = 'SLOW',
  UNKNOWN = 'UNKNOWN'
}

export interface NetworkInfo {
  status: NetworkStatus;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

export class NetworkManager {
  private static instance: NetworkManager;
  private networkStatus: NetworkStatus = NetworkStatus.UNKNOWN;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private connectionCheckInterval?: NodeJS.Timeout;

  private constructor() {
    this.initializeNetworkMonitoring();
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  /**
   * Initialize network status monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Initial status check
    this.updateNetworkStatus();

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.updateNetworkStatus();
    });

    window.addEventListener('offline', () => {
      this.networkStatus = NetworkStatus.OFFLINE;
      this.notifyListeners();
    });

    // Periodic connection check
    this.startConnectionCheck();
  }

  /**
   * Update network status based on current conditions
   */
  private updateNetworkStatus(): void {
    if (!navigator.onLine) {
      this.networkStatus = NetworkStatus.OFFLINE;
    } else {
      // Check connection quality if available
      const connection = (navigator as any).connection;
      if (connection) {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.networkStatus = NetworkStatus.SLOW;
        } else {
          this.networkStatus = NetworkStatus.ONLINE;
        }
      } else {
        this.networkStatus = NetworkStatus.ONLINE;
      }
    }

    this.notifyListeners();
  }

  /**
   * Start periodic connection quality check
   */
  private startConnectionCheck(): void {
    this.connectionCheckInterval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          const startTime = Date.now();
          await fetch('/favicon.ico', { 
            method: 'HEAD',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000)
          });
          const responseTime = Date.now() - startTime;

          // Classify connection speed
          if (responseTime > 3000) {
            this.networkStatus = NetworkStatus.SLOW;
          } else {
            this.networkStatus = NetworkStatus.ONLINE;
          }
        } catch {
          this.networkStatus = NetworkStatus.OFFLINE;
        }
        
        this.notifyListeners();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.networkStatus));
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  /**
   * Get detailed network information
   */
  getNetworkInfo(): NetworkInfo {
    const connection = (navigator as any).connection;
    
    return {
      status: this.networkStatus,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData
    };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.networkStatus === NetworkStatus.ONLINE || this.networkStatus === NetworkStatus.SLOW;
  }

  /**
   * Check if connection is slow
   */
  isSlowConnection(): boolean {
    return this.networkStatus === NetworkStatus.SLOW;
  }

  /**
   * Add network status listener
   */
  addStatusListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Execute operation with network-aware retry logic
   */
  async withNetworkRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const defaultConfig: RetryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryCondition: (error) => this.shouldRetryOnError(error)
    };

    const finalConfig = { ...defaultConfig, ...config };
    let lastError: any;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        // Check network status before attempt
        if (!this.isOnline() && attempt > 0) {
          throw new AppError(
            ErrorType.OFFLINE_ERROR,
            'Device is offline',
            { attempt },
            ErrorSeverity.MEDIUM
          );
        }

        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry if we've reached max attempts
        if (attempt === finalConfig.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (finalConfig.retryCondition && !finalConfig.retryCondition(error)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt),
          finalConfig.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        console.log(`Network retry attempt ${attempt + 1}/${finalConfig.maxRetries} in ${jitteredDelay}ms`);
        
        await this.delay(jitteredDelay);
      }
    }

    throw lastError;
  }

  /**
   * Determine if error should trigger a retry
   */
  private shouldRetryOnError(error: any): boolean {
    // Network-related errors that should be retried
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'AbortError',
      'fetch'
    ];

    const errorMessage = error?.message?.toLowerCase() || '';
    const errorName = error?.name?.toLowerCase() || '';

    return retryableErrors.some(retryable => 
      errorMessage.includes(retryable.toLowerCase()) || 
      errorName.includes(retryable.toLowerCase())
    );
  }

  /**
   * Wait for network to come back online
   */
  async waitForOnline(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline()) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.addStatusListener((status) => {
        if (status === NetworkStatus.ONLINE || status === NetworkStatus.SLOW) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
    this.listeners.clear();
  }
}

/**
 * Hook for using network status in React components
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = React.useState<NetworkStatus>(
    NetworkManager.getInstance().getNetworkStatus()
  );

  React.useEffect(() => {
    const networkManager = NetworkManager.getInstance();
    const unsubscribe = networkManager.addStatusListener(setNetworkStatus);

    return unsubscribe;
  }, []);

  return {
    networkStatus,
    isOnline: networkStatus === NetworkStatus.ONLINE || networkStatus === NetworkStatus.SLOW,
    isOffline: networkStatus === NetworkStatus.OFFLINE,
    isSlowConnection: networkStatus === NetworkStatus.SLOW
  };
}

/**
 * Enhanced fetch with network awareness
 */
export async function networkAwareFetch(
  url: string,
  options: RequestInit = {},
  retryConfig?: Partial<RetryConfig>
): Promise<Response> {
  const networkManager = NetworkManager.getInstance();

  return networkManager.withNetworkRetry(async () => {
    // Add timeout for slow connections
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 
      networkManager.isSlowConnection() ? 15000 : 8000
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new AppError(
          ErrorType.API_ERROR,
          `HTTP ${response.status}: ${response.statusText}`,
          { url, status: response.status },
          response.status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM
        );
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }, retryConfig);
}

export default NetworkManager;
