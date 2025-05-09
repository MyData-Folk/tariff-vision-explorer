
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Lock, Database as DatabaseIcon } from "lucide-react";
import { getTables } from "@/services/baseService";

// Créons un composant stub pour le DatabaseManager pour corriger l'erreur
const AdminDatabaseManager = () => {
  const [mockDateRange, setMockDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [mockSelectedPartners, setMockSelectedPartners] = useState<string[]>([]);
  const [mockComparisonMode, setMockComparisonMode] = useState('chart');
  const [mockAllPartners, setMockAllPartners] = useState([]);
  const [mockAllPlans, setMockAllPlans] = useState([]);
  
  const handleMockCompare = () => {
    console.log('Comparaison simulée pour le mode admin');
  };
  
  return (
    <div className="p-4 bg-card rounded-lg border">
      <h3 className="text-xl font-semibold mb-4">Gestion de la base de données</h3>
      <p className="text-muted-foreground mb-6">
        Les outils d'administration de base de données seront disponibles après authentification.
      </p>
      <div className="flex items-center gap-2">
        <DatabaseIcon className="text-primary" />
        <span>Tables disponibles: plans, partners, daily_rates, etc.</span>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // État pour contrôler l'affichage de l'interface d'administration
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  
  // États pour les paramètres utilisateur
  const [userSettings, setUserSettings] = useState({
    general: {
      defaultCurrency: "eur",
      language: "fr",
      dateFormat: "dd-mm-yyyy",
      decimalSeparator: "comma",
      darkMode: false,
      notifications: true,
      autoRefresh: true,
      roundPrices: true,
      includeTaxes: true
    },
    account: {
      name: "Sophie Martin",
      email: "sophie.martin@hotel-luxe.com",
      role: "Responsable Revenue Management",
      hotel: "Grand Hôtel Luxe",
    },
    data: {
      dataSource: "ota",
      syncFrequency: "daily",
      autoBackup: true,
      estimateMissingData: true,
      dataCache: true,
      dbHost: "db.supabase.co",
      dbName: "tarif_vision_db",
      dbUser: "tariff_admin",
      sslConnection: true
    },
    tariffs: {
      defaultPartner: "1",
      defaultCategory: "1",
      defaultNights: "1",
      defaultDiscount: "0"
    }
  });
  
  // Déterminez l'onglet actif à partir de l'état de localisation ou utilisez "general" par défaut
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state && location.state.activeTab) {
      return location.state.activeTab;
    }
    return "general";
  });
  
  // Effet pour mettre à jour l'URL lorsque l'onglet actif change
  useEffect(() => {
    if (location.state && location.state.activeTab !== activeTab) {
      navigate("/parametres", { state: { activeTab } });
    }
  }, [activeTab, location.state, navigate]);

  // Fonction pour sauvegarder les paramètres
  const saveSettings = (section) => {
    // Simuler une sauvegarde dans localStorage
    localStorage.setItem(`userSettings_${section}`, JSON.stringify(userSettings[section]));
    
    // Afficher un toast de confirmation
    toast({
      title: "Paramètres enregistrés",
      description: `Les paramètres ${getTabName(section)} ont été sauvegardés avec succès.`,
      variant: "default",
    });
  };
  
  // Fonction pour obtenir le nom de l'onglet pour l'affichage
  const getTabName = (tab) => {
    switch(tab) {
      case "general": return "généraux";
      case "account": return "du compte";
      case "data": return "de données";
      case "admin": return "d'administration";
      default: return "";
    }
  };
  
  // Fonction pour charger les paramètres depuis localStorage
  useEffect(() => {
    const loadSettings = () => {
      Object.keys(userSettings).forEach(section => {
        const savedSettings = localStorage.getItem(`userSettings_${section}`);
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings);
            setUserSettings(prev => ({
              ...prev,
              [section]: { ...prev[section], ...parsedSettings }
            }));
          } catch (error) {
            console.error(`Erreur lors du chargement des paramètres ${section}:`, error);
          }
        }
      });
    };
    
    loadSettings();
  }, []);

  // Fonction pour réinitialiser les paramètres
  const resetSettings = (section) => {
    // Supprimer les paramètres de localStorage
    localStorage.removeItem(`userSettings_${section}`);
    
    // Réinitialiser l'état
    setUserSettings(prev => {
      const defaultSettings = {
        general: {
          defaultCurrency: "eur",
          language: "fr",
          dateFormat: "dd-mm-yyyy",
          decimalSeparator: "comma",
          darkMode: false,
          notifications: true,
          autoRefresh: true,
          roundPrices: true,
          includeTaxes: true
        },
        account: {
          name: "Sophie Martin",
          email: "sophie.martin@hotel-luxe.com",
          role: "Responsable Revenue Management",
          hotel: "Grand Hôtel Luxe",
        },
        data: {
          dataSource: "ota",
          syncFrequency: "daily",
          autoBackup: true,
          estimateMissingData: true,
          dataCache: true,
          dbHost: "db.supabase.co",
          dbName: "tarif_vision_db",
          dbUser: "tariff_admin",
          sslConnection: true
        },
        tariffs: {
          defaultPartner: "1",
          defaultCategory: "1",
          defaultNights: "1",
          defaultDiscount: "0"
        }
      };
      
      return { ...prev, [section]: defaultSettings[section] };
    });
    
    // Afficher un toast de confirmation
    toast({
      title: "Paramètres réinitialisés",
      description: `Les paramètres ${getTabName(section)} ont été réinitialisés aux valeurs par défaut.`,
      variant: "default",
    });
  };

  // Fonction pour valider le mot de passe admin
  const handleAdminAccess = () => {
    // Dans une vraie application, vous feriez une vérification côté serveur
    // Pour cette démo, on utilise un mot de passe simple
    if (adminPassword === "admin123") {
      setShowAdmin(true);
      setIsAdminMode(true);
      toast({
        title: "Authentification réussie",
        description: "Accès au mode administrateur accordé",
      });
    } else {
      // Afficher une erreur si le mot de passe est incorrect
      toast({
        title: "Authentification échouée",
        description: "Mot de passe incorrect",
        variant: "destructive",
      });
    }
  };

  // Fonction pour mettre à jour les valeurs des paramètres
  const handleSettingChange = (section, key, value) => {
    setUserSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="account">Compte</TabsTrigger>
          <TabsTrigger value="data">Données</TabsTrigger>
          <TabsTrigger value="admin">Administration</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences générales</CardTitle>
              <CardDescription>
                Configurez les paramètres généraux de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="default-currency">Devise par défaut</Label>
                  <Select 
                    value={userSettings.general.defaultCurrency}
                    onValueChange={(value) => handleSettingChange("general", "defaultCurrency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="eur">Euro (€)</SelectItem>
                        <SelectItem value="usd">Dollar US ($)</SelectItem>
                        <SelectItem value="gbp">Livre sterling (£)</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select 
                    value={userSettings.general.language}
                    onValueChange={(value) => handleSettingChange("general", "language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date-format">Format de date</Label>
                  <Select 
                    value={userSettings.general.dateFormat}
                    onValueChange={(value) => handleSettingChange("general", "dateFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="dd-mm-yyyy">JJ/MM/AAAA</SelectItem>
                        <SelectItem value="mm-dd-yyyy">MM/JJ/AAAA</SelectItem>
                        <SelectItem value="yyyy-mm-dd">AAAA/MM/JJ</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="decimal-separator">Séparateur décimal</Label>
                  <Select 
                    value={userSettings.general.decimalSeparator}
                    onValueChange={(value) => handleSettingChange("general", "decimalSeparator", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un séparateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="comma">Virgule (,)</SelectItem>
                        <SelectItem value="point">Point (.)</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Options d'affichage</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode" className="cursor-pointer">Mode sombre</Label>
                    <Switch 
                      id="dark-mode" 
                      checked={userSettings.general.darkMode}
                      onCheckedChange={(checked) => handleSettingChange("general", "darkMode", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications" className="cursor-pointer">Notifications</Label>
                    <Switch 
                      id="notifications" 
                      checked={userSettings.general.notifications}
                      onCheckedChange={(checked) => handleSettingChange("general", "notifications", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-refresh" className="cursor-pointer">Actualisation automatique des données</Label>
                    <Switch 
                      id="auto-refresh" 
                      checked={userSettings.general.autoRefresh}
                      onCheckedChange={(checked) => handleSettingChange("general", "autoRefresh", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => resetSettings("general")}>Réinitialiser</Button>
              <Button onClick={() => saveSettings("general")}>Enregistrer les modifications</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des calculs</CardTitle>
              <CardDescription>
                Configurez les options par défaut pour les calculs de tarifs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-partner">Partenaire par défaut</Label>
                  <Select 
                    value={userSettings.tariffs.defaultPartner}
                    onValueChange={(value) => handleSettingChange("tariffs", "defaultPartner", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un partenaire" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Partenaires</SelectLabel>
                        <SelectItem value="1">Booking</SelectItem>
                        <SelectItem value="2">Expedia</SelectItem>
                        <SelectItem value="3">Travco</SelectItem>
                        <SelectItem value="4">Direct</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-category">Catégorie par défaut</Label>
                  <Select 
                    value={userSettings.tariffs.defaultCategory}
                    onValueChange={(value) => handleSettingChange("tariffs", "defaultCategory", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Catégories</SelectLabel>
                        <SelectItem value="1">Deluxe</SelectItem>
                        <SelectItem value="2">Suite</SelectItem>
                        <SelectItem value="3">Standard</SelectItem>
                        <SelectItem value="4">Premium</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-nights">Nombre de nuits par défaut</Label>
                  <Input 
                    type="number" 
                    id="default-nights" 
                    min="1"
                    value={userSettings.tariffs.defaultNights}
                    onChange={(e) => handleSettingChange("tariffs", "defaultNights", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-discount">Remise par défaut (%)</Label>
                  <Input 
                    type="number" 
                    id="default-discount" 
                    min="0" 
                    max="100"
                    value={userSettings.tariffs.defaultDiscount}
                    onChange={(e) => handleSettingChange("tariffs", "defaultDiscount", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="round-prices" className="cursor-pointer">Arrondir les prix</Label>
                  <Switch 
                    id="round-prices" 
                    checked={userSettings.general.roundPrices}
                    onCheckedChange={(checked) => handleSettingChange("general", "roundPrices", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-taxes" className="cursor-pointer">Inclure les taxes dans les calculs</Label>
                  <Switch 
                    id="include-taxes" 
                    checked={userSettings.general.includeTaxes}
                    onCheckedChange={(checked) => handleSettingChange("general", "includeTaxes", checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => resetSettings("tariffs")}>Réinitialiser</Button>
              <Button onClick={() => saveSettings("tariffs")}>Enregistrer les modifications</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil utilisateur</CardTitle>
              <CardDescription>
                Gérez les informations de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-semibold">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">{userSettings.account.name}</h3>
                  <p className="text-sm text-muted-foreground">{userSettings.account.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input 
                    id="name" 
                    value={userSettings.account.name}
                    onChange={(e) => handleSettingChange("account", "name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={userSettings.account.email}
                    onChange={(e) => handleSettingChange("account", "email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Input 
                    id="role" 
                    value={userSettings.account.role}
                    onChange={(e) => handleSettingChange("account", "role", e.target.value)}
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel">Hôtel</Label>
                  <Input 
                    id="hotel" 
                    value={userSettings.account.hotel}
                    onChange={(e) => handleSettingChange("account", "hotel", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => resetSettings("account")}>Annuler</Button>
              <Button onClick={() => saveSettings("account")}>Mettre à jour le profil</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sécurité</CardTitle>
              <CardDescription>
                Gérez les paramètres de sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div></div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="two-factor" className="cursor-pointer">Authentification à deux facteurs</Label>
                  <Switch 
                    id="two-factor" 
                    checked={userSettings.data.twoFactor}
                    onCheckedChange={(checked) => handleSettingChange("data", "twoFactor", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="session-timeout" className="cursor-pointer">Déconnexion automatique après inactivité</Label>
                  <Switch 
                    id="session-timeout" 
                    defaultChecked 
                    checked={userSettings.data.sessionTimeout}
                    onCheckedChange={(checked) => handleSettingChange("data", "sessionTimeout", checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Annuler</Button>
              <Button onClick={() => {
                toast({
                  title: "Mot de passe mis à jour",
                  description: "Votre mot de passe a été mis à jour avec succès",
                });
              }}>Mettre à jour le mot de passe</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des données</CardTitle>
              <CardDescription>
                Configurez les paramètres de gestion des données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Sources de données</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data-source">Source principale</Label>
                    <Select 
                      value={userSettings.data.dataSource}
                      onValueChange={(value) => handleSettingChange("data", "dataSource", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="ota">OTA</SelectItem>
                          <SelectItem value="travco">Travco</SelectItem>
                          <SelectItem value="manual">Manuel</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sync-frequency">Fréquence de synchronisation</Label>
                    <Select 
                      value={userSettings.data.syncFrequency}
                      onValueChange={(value) => handleSettingChange("data", "syncFrequency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="hourly">Toutes les heures</SelectItem>
                          <SelectItem value="daily">Quotidienne</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Options de données</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-backup" className="cursor-pointer">Sauvegarde automatique des données</Label>
                    <Switch 
                      id="auto-backup" 
                      checked={userSettings.data.autoBackup}
                      onCheckedChange={(checked) => handleSettingChange("data", "autoBackup", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="missing-data" className="cursor-pointer">Estimer les données manquantes</Label>
                    <Switch 
                      id="missing-data" 
                      checked={userSettings.data.estimateMissingData}
                      onCheckedChange={(checked) => handleSettingChange("data", "estimateMissingData", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="data-cache" className="cursor-pointer">Mise en cache des données</Label>
                    <Switch 
                      id="data-cache" 
                      checked={userSettings.data.dataCache}
                      onCheckedChange={(checked) => handleSettingChange("data", "dataCache", checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Exportation et importation</h3>
                <p className="text-sm text-muted-foreground">
                  Exportez ou importez des données dans le système
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => {
                    toast({
                      title: "Exportation des données",
                      description: "L'exportation des données a commencé",
                    });
                  }}>
                    Exporter les données
                  </Button>
                  <Button variant="outline" onClick={() => {
                    toast({
                      title: "Importation des tarifs",
                      description: "Veuillez sélectionner un fichier à importer",
                    });
                  }}>
                    Importer des tarifs
                  </Button>
                  <Button variant="outline" onClick={() => {
                    toast({
                      title: "Importation des plans tarifaires",
                      description: "Veuillez sélectionner un fichier à importer",
                    });
                  }}>
                    Importer des plans tarifaires
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-destructive">Zone de danger</h3>
                  <p className="text-sm text-muted-foreground">
                    Ces actions sont irréversibles. Procédez avec prudence.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="destructive" onClick={() => {
                      toast({
                        title: "Action dangereuse",
                        description: "Cette action est désactivée en mode démo",
                        variant: "destructive",
                      });
                    }}>
                      Réinitialiser toutes les données
                    </Button>
                    <Button variant="outline" className="text-destructive" onClick={() => {
                      toast({
                        title: "Action dangereuse",
                        description: "Cette action est désactivée en mode démo",
                        variant: "destructive",
                      });
                    }}>
                      Supprimer les données historiques
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => resetSettings("data")}>Réinitialiser</Button>
              <Button onClick={() => saveSettings("data")}>Enregistrer les modifications</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Configuration de la base de données</CardTitle>
              <CardDescription>
                Paramètres de connexion à la base de données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db-host">Hôte</Label>
                  <Input 
                    id="db-host" 
                    value={userSettings.data.dbHost}
                    onChange={(e) => handleSettingChange("data", "dbHost", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-name">Nom de la base</Label>
                  <Input 
                    id="db-name" 
                    value={userSettings.data.dbName}
                    onChange={(e) => handleSettingChange("data", "dbName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-user">Utilisateur</Label>
                  <Input 
                    id="db-user" 
                    value={userSettings.data.dbUser}
                    onChange={(e) => handleSettingChange("data", "dbUser", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-password">Mot de passe</Label>
                  <Input id="db-password" type="password" value="************" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ssl-connection" className="cursor-pointer">Connexion SSL</Label>
                  <Switch 
                    id="ssl-connection" 
                    checked={userSettings.data.sslConnection}
                    onCheckedChange={(checked) => handleSettingChange("data", "sslConnection", checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => {
                toast({
                  title: "Test de connexion",
                  description: "La connexion à la base de données a été testée avec succès",
                });
              }}>Tester la connexion</Button>
              <Button onClick={() => saveSettings("data")}>Enregistrer les modifications</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="admin" className="space-y-4">
          {!isAdminMode ? (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Authentification administrateur
                </CardTitle>
                <CardDescription>
                  Accédez aux fonctionnalités administratives pour gérer la base de données.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Mot de passe administrateur</Label>
                    <Input 
                      id="admin-password" 
                      type="password" 
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Entrez le mot de passe administrateur"
                    />
                    <p className="text-sm text-muted-foreground">
                      Pour cette démo, utilisez le mot de passe "admin123"
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full btn-3d"
                  onClick={handleAdminAccess}
                >
                  Accéder aux fonctionnalités administratives
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DatabaseIcon className="h-5 w-5" />
                    Gestion de la base de données
                  </CardTitle>
                  <CardDescription>
                    Gérez les tables de la base de données directement depuis l'interface.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminDatabaseManager />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
