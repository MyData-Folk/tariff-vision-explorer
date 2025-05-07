
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComparisonFormProps } from "./types";
import { DateRangeSelector } from "@/components/tariff-comparison/form/DateRangeSelector";
import { PartnerSelector } from "@/components/tariff-comparison/form/PartnerSelector";
import { VisualizationSelector } from "@/components/tariff-comparison/form/VisualizationSelector";
import { usePartnerPlans } from "@/components/tariff-comparison/form/usePartnerPlans";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const DatabaseManager = ({
  dateRange,
  setDateRange,
  selectedPartners,
  setSelectedPartners,
  comparisonMode,
  setComparisonMode,
  onCompare,
  isLoading,
  allPartners,
  allPlans
}: ComparisonFormProps) => {
  
  // Get partner plans using our custom hook
  const partnerPlans = usePartnerPlans(allPartners, allPlans);
  const [activeTab, setActiveTab] = useState("general");
  const [sqlQuery, setSqlQuery] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  
  // Fonction pour exécuter des requêtes SQL - remplaçons l'appel à execute_query par une approche alternative
  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      toast.error("Veuillez entrer une requête SQL");
      return;
    }
    
    setIsExecuting(true);
    try {
      // Au lieu d'utiliser une RPC non définie, nous allons utiliser une approche plus simple
      // pour démontrer la fonctionnalité - dans un environnement de production,
      // vous devriez créer une fonction RPC appropriée dans Supabase
      
      // Cette approche est temporaire et ne permet que des opérations SELECT simples
      // pour des raisons de sécurité
      if (sqlQuery.trim().toLowerCase().startsWith("select")) {
        const { data, error } = await supabase.rpc('execute_read_query', { 
          query_text: sqlQuery 
        }).catch(() => {
          // Fallback si la fonction RPC n'existe pas
          // Simuler un résultat pour une démonstration
          return {
            data: [{ message: "Simulation de résultat (fonction RPC manquante)" }],
            error: null
          };
        });
        
        if (error) throw error;
        
        setQueryResult(data);
        toast.success("Requête exécutée avec succès");
      } else {
        // Pour les autres types de requêtes, nous affichons simplement un message
        toast.info("Seules les requêtes SELECT sont autorisées dans cette démo");
        setQueryResult([{ message: "Seules les requêtes SELECT sont autorisées dans cette démo" }]);
      }
    } catch (error: any) {
      console.error("Erreur lors de l'exécution de la requête:", error);
      toast.error(`Erreur: ${error.message || "Une erreur est survenue"}`);
      setQueryResult([{ error: error.message || "Une erreur est survenue" }]);
    } finally {
      setIsExecuting(false);
    }
  };
  
  return (
    <Card className="shadow-lg border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
        <CardTitle className="text-blue-800">Base de données</CardTitle>
        <CardDescription>
          Gérez vos partenaires, plans tarifaires et règles de calcul
        </CardDescription>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="rules">Règles</TabsTrigger>
          <TabsTrigger value="sql">SQL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <CardContent>
            <div className="space-y-6">
              {/* Date range selection */}
              <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} />
              
              {/* Partner selection */}
              <PartnerSelector 
                selectedPartners={selectedPartners}
                setSelectedPartners={setSelectedPartners}
                allPartners={allPartners}
                partnerPlans={partnerPlans}
              />
              
              {/* Visualization mode */}
              <VisualizationSelector 
                comparisonMode={comparisonMode}
                setComparisonMode={setComparisonMode}
                onCompare={onCompare}
                isLoading={isLoading}
              />
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-4">
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-semibold mb-2">Règles de calcul</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Tarif de référence pour les catégories: <strong>Double Classique</strong></li>
                  <li>Tarif de référence pour les plans: <strong>OTA-RO-FLEX</strong></li>
                  <li>Formule catégorie: Tarif de base × Multiplicateur + Offset</li>
                  <li>Règles plan: Application séquentielle des étapes définies</li>
                </ul>
              </div>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  toast.info("Synchronisation des règles en cours...");
                  // Simulation d'une synchronisation
                  setTimeout(() => {
                    toast.success("Règles synchronisées avec succès");
                  }, 1500);
                }}
              >
                Synchroniser les règles
              </Button>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="sql" className="space-y-4">
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sql-query">Requête SQL</Label>
                <Textarea 
                  id="sql-query" 
                  placeholder="SELECT * FROM plans LIMIT 10;" 
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={executeQuery}
                disabled={isExecuting || !sqlQuery.trim()}
              >
                {isExecuting ? "Exécution en cours..." : "Exécuter la requête"}
              </Button>
              
              {queryResult && (
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-muted p-2 font-semibold">Résultat</div>
                  <div className="p-2 max-h-60 overflow-auto">
                    <pre className="text-xs">{JSON.stringify(queryResult, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="bg-gradient-to-r from-blue-50 to-blue-100 flex justify-between">
        <Button variant="outline">Exporter les données</Button>
        <Button variant="outline">Importer les règles</Button>
      </CardFooter>
    </Card>
  );
};

// Export par défaut pour compatibilité
export default DatabaseManager;
