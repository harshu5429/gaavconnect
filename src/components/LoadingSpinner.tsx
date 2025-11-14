import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-[#6A0DAD]`} />
      {text && (
        <span className="text-gray-600 text-sm font-medium">{text}</span>
      )}
    </div>
  );
}

export function FullPageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#6A0DAD] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6A0DAD] font-semibold text-lg">{text}</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we optimize your route...</p>
      </div>
    </div>
  );
}

export function RouteOptimizationLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="relative">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-purple-200 border-t-[#6A0DAD] rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-8 h-8 mx-auto mt-2 border-2 border-purple-100 border-b-[#8B2DC2] rounded-full animate-spin animate-reverse"></div>
        </div>
        <p className="text-[#6A0DAD] font-semibold">🧠 AI Optimizing Routes</p>
        <p className="text-gray-500 text-sm mt-1">Running genetic algorithm...</p>
      </div>
    </div>
  );
}
