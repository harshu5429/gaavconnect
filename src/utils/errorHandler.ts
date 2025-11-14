// Comprehensive error handling system for GaavConnect
import { log } from '../config/env';
import { toast } from 'sonner';

export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  GEOLOCATION = 'GEOLOCATION',
  MAPS = 'MAPS',
  OSRM = 'OSRM',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: Date;
  userMessage: string;
}

export class GaavConnectError extends Error {
  public readonly type: ErrorType;
  public readonly context?: Record<string, any>;
  public readonly userMessage: string;
  public readonly timestamp: Date;

  constructor(
    type: ErrorType,
    message: string,
    userMessage: string,
    context?: Record<string, any>,
    originalError?: Error
  ) {
    super(message);
    this.name = 'GaavConnectError';
    this.type = type;
    this.userMessage = userMessage;
    this.context = context;
    this.timestamp = new Date();
    
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

// Error handling functions
export function handleError(error: unknown, context?: Record<string, any>): AppError {
  let appError: AppError;

  if (error instanceof GaavConnectError) {
    appError = {
      type: error.type,
      message: error.message,
      originalError: error,
      context: { ...error.context, ...context },
      timestamp: error.timestamp,
      userMessage: error.userMessage
    };
  } else if (error instanceof Error) {
    appError = {
      type: determineErrorType(error),
      message: error.message,
      originalError: error,
      context,
      timestamp: new Date(),
      userMessage: getUserFriendlyMessage(error)
    };
  } else {
    appError = {
      type: ErrorType.UNKNOWN,
      message: String(error),
      context,
      timestamp: new Date(),
      userMessage: 'An unexpected error occurred. Please try again.'
    };
  }

  // Log the error
  log('error', 'Application Error:', {
    type: appError.type,
    message: appError.message,
    context: appError.context,
    timestamp: appError.timestamp
  });

  // Show user notification
  toast.error(appError.userMessage);

  return appError;
}

function determineErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return ErrorType.NETWORK;
  }
  
  if (message.includes('api') || message.includes('http')) {
    return ErrorType.API;
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorType.VALIDATION;
  }
  
  if (message.includes('geolocation') || message.includes('location')) {
    return ErrorType.GEOLOCATION;
  }
  
  if (message.includes('maps') || message.includes('google')) {
    return ErrorType.MAPS;
  }
  
  if (message.includes('osrm') || message.includes('routing')) {
    return ErrorType.OSRM;
  }
  
  return ErrorType.UNKNOWN;
}

function getUserFriendlyMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  
  if (message.includes('api')) {
    return 'Service temporarily unavailable. Please try again in a moment.';
  }
  
  if (message.includes('geolocation')) {
    return 'Unable to access your location. Please enable location services or enter your address manually.';
  }
  
  if (message.includes('maps')) {
    return 'Map service is temporarily unavailable. Please try again later.';
  }
  
  if (message.includes('osrm')) {
    return 'Route calculation service is temporarily unavailable. Please try again later.';
  }
  
  return 'Something went wrong. Please try again.';
}

// Specific error creators
export function createNetworkError(message: string, context?: Record<string, any>): GaavConnectError {
  return new GaavConnectError(
    ErrorType.NETWORK,
    message,
    'Network connection issue. Please check your internet connection.',
    context
  );
}

export function createAPIError(message: string, context?: Record<string, any>): GaavConnectError {
  return new GaavConnectError(
    ErrorType.API,
    message,
    'Service temporarily unavailable. Please try again in a moment.',
    context
  );
}

export function createValidationError(message: string, context?: Record<string, any>): GaavConnectError {
  return new GaavConnectError(
    ErrorType.VALIDATION,
    message,
    'Please check your input and try again.',
    context
  );
}

export function createGeolocationError(message: string, context?: Record<string, any>): GaavConnectError {
  return new GaavConnectError(
    ErrorType.GEOLOCATION,
    message,
    'Unable to access your location. Please enable location services or enter your address manually.',
    context
  );
}

export function createMapsError(message: string, context?: Record<string, any>): GaavConnectError {
  return new GaavConnectError(
    ErrorType.MAPS,
    message,
    'Map service is temporarily unavailable. Please try again later.',
    context
  );
}

export function createOSRMError(message: string, context?: Record<string, any>): GaavConnectError {
  return new GaavConnectError(
    ErrorType.OSRM,
    message,
    'Route calculation service is temporarily unavailable. Please try again later.',
    context
  );
}

// Async error wrapper
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
    return null;
  }
}

// React error boundary helper
export function getErrorBoundaryFallback(error: Error, errorInfo: any) {
  const appError = handleError(error, { errorInfo });
  
  return {
    title: 'Something went wrong',
    message: appError.userMessage,
    details: appError.message,
    timestamp: appError.timestamp
  };
}
