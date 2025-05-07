
import React from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  CalendarDays, 
  ChartBar, 
  ChartLine, 
  Settings,
  TrendingUp
} from "lucide-react";

const Sidebar = () => {
  const navigation = [
    { name: "Tableau de bord", to: "/", icon: LayoutDashboard },
    { name: "Calcul des tarifs", to: "/calcul", icon: CalendarDays },
    { name: "Comparaison", to: "/comparaison", icon: ChartBar },
    { name: "Analyses", to: "/analyses", icon: ChartLine },
    { name: "Yield Management", to: "/yield", icon: TrendingUp },
    { name: "Paramètres", to: "/parametres", icon: Settings },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-sidebar border-r border-border">
      <div className="flex items-center justify-center h-16 border-b border-border">
        <h1 className="text-xl font-semibold text-tariff-blue">
          Tariff Vision Explorer
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4 tariff-scrollbar">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-md 
                ${isActive 
                  ? 'bg-tariff-blue text-white'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-tariff-blue text-white flex items-center justify-center font-semibold">
            TV
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Tariff Vision</p>
            <p className="text-xs text-sidebar-foreground/80">Version 1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
