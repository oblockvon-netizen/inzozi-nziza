import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <MarketingLayout>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-2 text-6xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="mt-8 gap-2" size="lg">
          <Link to="/">
            <Home className="h-4 w-4" />
            Return home
          </Link>
        </Button>
      </div>
    </MarketingLayout>
  );
};

export default NotFound;
