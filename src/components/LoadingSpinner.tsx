import nmimsLogo from '@/assets/nmims-logo.png';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        {/* Outer spinning ring */}
        <div className={`${sizeClasses[size]} border-4 border-nmims-maroon/20 border-t-nmims-maroon rounded-full animate-spin`} />
        
        {/* Inner logo with pulse effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={nmimsLogo} 
            alt="NMIMS Logo" 
            className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} object-contain animate-pulse`}
          />
        </div>
      </div>
      
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
