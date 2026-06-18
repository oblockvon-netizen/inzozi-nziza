interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  message = "Loading...",
  className = "",
  fullScreen = true,
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex items-center justify-center bg-background ${
        fullScreen ? "min-h-screen" : "py-16"
      } ${className}`}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="text-center">
        <div
          className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-accent"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
