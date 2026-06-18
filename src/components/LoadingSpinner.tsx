interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({
  message = "Loading...",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div className={`flex min-h-screen items-center justify-center bg-background ${className}`}>
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-accent" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
