interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }: LoadingSpinnerProps) => {
  const sizeMap = {
    sm: '32px',
    md: '48px',
    lg: '64px',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="loader" style={{ width: sizeMap[size] }}></div>

      {text && (
        <p className="text-sm text-muted-foreground animate-pulse font-medium">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
