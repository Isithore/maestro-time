import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="bg-gradient-hero bg-clip-text text-transparent">
          <h1 className="text-6xl font-bold">404</h1>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link to="/">
          <Button className="bg-gradient-primary hover:opacity-90">
            <Calendar className="h-4 w-4 mr-2" />
            Back to Generator
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
