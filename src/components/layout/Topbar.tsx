
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, ChevronDown, Settings, User, LogOut, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Topbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hotelName, setHotelName] = useState("Mon Hôtel");

  const handleProfileClick = () => {
    navigate("/parametres", { state: { activeTab: "account" } });
    toast({
      title: "Navigation vers le profil",
      description: "Accès au profil utilisateur"
    });
  };

  const handlePreferencesClick = () => {
    navigate("/parametres", { state: { activeTab: "general" } });
    toast({
      title: "Navigation vers les préférences",
      description: "Accès aux préférences utilisateur"
    });
  };

  const handleHelpClick = () => {
    toast({
      title: "Aide",
      description: "Le centre d'aide sera disponible prochainement",
    });
  };

  const handleTitleClick = () => {
    navigate("/");
    toast({
      title: "Tableau de bord",
      description: "Navigation vers le tableau de bord"
    });
  };

  return (
    <header className="border-b border-border h-16 flex items-center justify-between px-4 md:px-6 bg-background">
      <div className="flex items-center">
        <Button variant="ghost" className="md:hidden mr-2" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
        <h2 
          onClick={handleTitleClick} 
          className="text-lg font-semibold cursor-pointer hover:text-tariff-blue transition-colors"
        >
          Tariff Vision Explorer
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              {hotelName}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
              <User className="h-4 w-4 mr-2" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePreferencesClick} className="cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              Préférences
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleHelpClick} className="cursor-pointer">
              <HelpCircle className="h-4 w-4 mr-2" />
              Aide
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => toast({
              title: "Déconnexion",
              description: "Vous avez été déconnecté avec succès"
            })}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={handleHelpClick}>
          Aide
        </Button>
      </div>
    </header>
  );
};

export default Topbar;
