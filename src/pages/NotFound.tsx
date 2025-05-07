
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h1 className="text-8xl font-bold text-gray-200">404</h1>
          <h2 className="text-3xl font-bold mt-4">Page introuvable</h2>
          <p className="text-xl text-muted-foreground mt-2 mb-8">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Button className="flex items-center" size="lg" asChild>
            <a href="/">
              <LayoutDashboard className="mr-2" /> Retour au tableau de bord
            </a>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
