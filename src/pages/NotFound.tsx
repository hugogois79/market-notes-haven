
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-10 animate-fade-in">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
        <FileQuestion size={40} />
      </div>
      <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <Link to="/">
        <Button className="gap-2">
          <Home size={16} />
          Return Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
