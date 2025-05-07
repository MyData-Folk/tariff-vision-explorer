
import React from "react";
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
import { Settings, User } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="account">Compte</TabsTrigger>
          <TabsTrigger value="data">Données</TabsTrigger>
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
                  <Select defaultValue="eur">
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
                  <Select defaultValue="fr">
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
                  <Select defaultValue="dd-mm-yyyy">
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
                  <Select defaultValue="comma">
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
                    <Switch id="dark-mode" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications" className="cursor-pointer">Notifications</Label>
                    <Switch id="notifications" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-refresh" className="cursor-pointer">Actualisation automatique des données</Label>
                    <Switch id="auto-refresh" defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Réinitialiser</Button>
              <Button>Enregistrer les modifications</Button>
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
                  <Select defaultValue="1">
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
                  <Select defaultValue="1">
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
                  <Input type="number" id="default-nights" defaultValue="1" min="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-discount">Remise par défaut (%)</Label>
                  <Input type="number" id="default-discount" defaultValue="0" min="0" max="100" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="round-prices" className="cursor-pointer">Arrondir les prix</Label>
                  <Switch id="round-prices" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-taxes" className="cursor-pointer">Inclure les taxes dans les calculs</Label>
                  <Switch id="include-taxes" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Réinitialiser</Button>
              <Button>Enregistrer les modifications</Button>
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
                  <h3 className="font-medium text-lg">Sophie Martin</h3>
                  <p className="text-sm text-muted-foreground">sophie.martin@hotel-luxe.com</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" defaultValue="Sophie Martin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="sophie.martin@hotel-luxe.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Input id="role" defaultValue="Responsable Revenue Management" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel">Hôtel</Label>
                  <Input id="hotel" defaultValue="Grand Hôtel Luxe" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Annuler</Button>
              <Button>Mettre à jour le profil</Button>
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
                  <Switch id="two-factor" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="session-timeout" className="cursor-pointer">Déconnexion automatique après inactivité</Label>
                  <Switch id="session-timeout" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Annuler</Button>
              <Button>Mettre à jour le mot de passe</Button>
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
                    <Select defaultValue="ota">
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
                    <Select defaultValue="daily">
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
                    <Switch id="auto-backup" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="missing-data" className="cursor-pointer">Estimer les données manquantes</Label>
                    <Switch id="missing-data" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="data-cache" className="cursor-pointer">Mise en cache des données</Label>
                    <Switch id="data-cache" defaultChecked />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Exportation et importation</h3>
                <p className="text-sm text-muted-foreground">
                  Exportez ou importez des données dans le système
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline">
                    Exporter les données
                  </Button>
                  <Button variant="outline">
                    Importer des tarifs
                  </Button>
                  <Button variant="outline">
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
                    <Button variant="destructive">
                      Réinitialiser toutes les données
                    </Button>
                    <Button variant="outline" className="text-destructive">
                      Supprimer les données historiques
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Réinitialiser</Button>
              <Button>Enregistrer les modifications</Button>
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
                  <Input id="db-host" defaultValue="db.supabase.co" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-name">Nom de la base</Label>
                  <Input id="db-name" defaultValue="tarif_vision_db" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-user">Utilisateur</Label>
                  <Input id="db-user" defaultValue="tariff_admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-password">Mot de passe</Label>
                  <Input id="db-password" type="password" value="************" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ssl-connection" className="cursor-pointer">Connexion SSL</Label>
                  <Switch id="ssl-connection" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Tester la connexion</Button>
              <Button>Enregistrer les modifications</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
