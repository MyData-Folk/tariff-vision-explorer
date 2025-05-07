import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTables } from "@/services/baseService";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpCircle,
  CheckCircle,
  Database,
  Download,
  Loader2,
  RefreshCw,
  Table as TableIcon,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

// Type for the structure of a table
interface TableStructure {
  name: string;
  columns: { name: string; type: string; }[];
}

const DatabaseManager: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableStructure, setTableStructure] = useState<TableStructure | null>(null);
  const [newRowData, setNewRowData] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [sqlQuery, setSqlQuery] = useState<string>("");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [editingRows, setEditingRows] = useState<{[key: string]: boolean}>({});

  // Récupérer la liste des tables
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const tables = await getTables();
        setTables(tables);
      } catch (error) {
        console.error("Erreur lors de la récupération des tables:", error);
        toast.error("Impossible de récupérer la liste des tables");
      }
    };

    fetchTables();
  }, []);

  // Récupérer les données d'une table
  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*');
      
      if (error) throw error;
      
      setTableData(data || []);
      
      // Récupérer la structure de la table
      const structure: TableStructure = {
        name: tableName,
        columns: []
      };
      
      if (data && data.length > 0) {
        const firstRow = data[0];
        for (const key in firstRow) {
          structure.columns.push({
            name: key,
            type: typeof firstRow[key]
          });
        }
      }
      
      setTableStructure(structure);
      
      // Réinitialiser le formulaire d'ajout
      const initialData: {[key: string]: any} = {};
      structure.columns.forEach(col => {
        initialData[col.name] = '';
      });
      setNewRowData(initialData);
      
    } catch (error) {
      console.error(`Erreur lors de la récupération des données de ${tableName}:`, error);
      toast.error(`Impossible de récupérer les données de ${tableName}`);
    } finally {
      setLoading(false);
    }
  };

  // Sélectionner une table
  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    fetchTableData(tableName);
  };

  // Ajouter une nouvelle ligne
  const handleAddRow = async () => {
    if (!selectedTable || !tableStructure) return;
    
    setLoading(true);
    try {
      // Ne pas inclure les champs vides ou les identifiants générés automatiquement
      const dataToInsert: {[key: string]: any} = {};
      for (const key in newRowData) {
        if (newRowData[key] !== '' && key !== 'id' && key !== 'created_at') {
          dataToInsert[key] = newRowData[key];
        }
      }
      
      const { data, error } = await supabase
        .from(selectedTable as any)
        .insert([dataToInsert]);
      
      if (error) throw error;
      
      toast.success("Données ajoutées avec succès");
      fetchTableData(selectedTable);
      
    } catch (error) {
      console.error("Erreur lors de l'ajout de données:", error);
      toast.error("Impossible d'ajouter les données");
    } finally {
      setLoading(false);
    }
  };

  // Gérer l'édition des lignes
  const toggleEditRow = (rowId: string) => {
    setEditingRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  // Mettre à jour une ligne
  const handleUpdateRow = async (rowId: string, rowData: any) => {
    if (!selectedTable) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from(selectedTable as any)
        .update(rowData)
        .eq('id', rowId);
      
      if (error) throw error;
      
      toggleEditRow(rowId);
      toast.success("Données mises à jour avec succès");
      fetchTableData(selectedTable);
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour des données:", error);
      toast.error("Impossible de mettre à jour les données");
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une ligne
  const handleDeleteRow = async (rowId: string) => {
    if (!selectedTable) return;
    
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette ligne ?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from(selectedTable as any)
        .delete()
        .eq('id', rowId);
      
      if (error) throw error;
      
      toast.success("Données supprimées avec succès");
      fetchTableData(selectedTable);
      
    } catch (error) {
      console.error("Erreur lors de la suppression des données:", error);
      toast.error("Impossible de supprimer les données");
    } finally {
      setLoading(false);
    }
  };

  // Fix the string argument type issue (around line 205)
  // Using a type assertion to resolve the TS2345 error
  const handleValueChange = (
    tableName: string,
    rowIndex: number,
    columnName: string,
    value: string | number | boolean | null
  ) => {
    if (!tableData[rowIndex]) return;
    
    const newData = [...tableData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [columnName]: value
    };
    setTableData(newData);
  };

  // Exécuter une requête SQL personnalisée
  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('execute_sql', { query: sqlQuery });
      
      if (error) throw error;
      
      setSqlResult(data);
      toast.success("Requête exécutée avec succès");
      
    } catch (error) {
      console.error("Erreur lors de l'exécution de la requête SQL:", error);
      toast.error("Impossible d'exécuter la requête SQL");
      setSqlResult({ error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestion de la Base de Données</h1>
      
      <Tabs defaultValue="tables">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="sql">Requêtes SQL</TabsTrigger>
          <TabsTrigger value="export">Export/Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner une table</CardTitle>
              <CardDescription>
                Choisissez une table pour afficher et modifier ses données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Select 
                  value={selectedTable} 
                  onValueChange={handleTableSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {selectedTable && tableStructure && (
            <Card>
              <CardHeader>
                <CardTitle>Ajouter une ligne à {selectedTable}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {tableStructure.columns
                    .filter(col => col.name !== 'id' && col.name !== 'created_at')
                    .map(col => (
                      <div key={col.name} className="space-y-2">
                        <Label htmlFor={`new-${col.name}`}>{col.name}</Label>
                        <Input
                          id={`new-${col.name}`}
                          value={newRowData[col.name] || ''}
                          onChange={(e) => setNewRowData({
                            ...newRowData,
                            [col.name]: e.target.value
                          })}
                          type={col.type === 'number' ? 'number' : 'text'}
                        />
                      </div>
                    ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddRow} disabled={loading}>
                  {loading ? "Ajout..." : "Ajouter"}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {selectedTable && tableData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Données de la table {selectedTable}</CardTitle>
                <CardDescription>
                  {tableData.length} lignes trouvées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-secondary">
                          <th className="p-2 text-left">Actions</th>
                          {tableStructure?.columns.map(col => (
                            <th key={col.name} className="p-2 text-left">{col.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, index) => (
                          <tr key={index} className="border-b border-border hover:bg-muted/50">
                            <td className="p-2">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleEditRow(row.id)}
                                >
                                  {editingRows[row.id] ? "Annuler" : "Éditer"}
                                </Button>
                                {editingRows[row.id] ? (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleUpdateRow(row.id, row)}
                                  >
                                    Enregistrer
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteRow(row.id)}
                                  >
                                    Supprimer
                                  </Button>
                                )}
                              </div>
                            </td>
                            {tableStructure?.columns.map(col => (
                              <td key={col.name} className="p-2">
                                {editingRows[row.id] && col.name !== 'id' && col.name !== 'created_at' ? (
                                  <Input
                                    value={row[col.name] || ''}
                                    onChange={(e) => {
                                      handleValueChange(selectedTable, index, col.name, e.target.value);
                                    }}
                                    type={col.type === 'number' ? 'number' : 'text'}
                                    className="h-8 w-full"
                                  />
                                ) : (
                                  <span>{row[col.name]}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="sql">
          <Card>
            <CardHeader>
              <CardTitle>Requêtes SQL personnalisées</CardTitle>
              <CardDescription>
                Exécutez des requêtes SQL personnalisées sur la base de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={8}
                  placeholder="Entrez votre requête SQL ici..."
                  className="font-mono"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleExecuteQuery} disabled={loading || !sqlQuery.trim()}>
                {loading ? "Exécution..." : "Exécuter"}
              </Button>
            </CardFooter>
          </Card>
          
          {sqlResult && (
            <Card>
              <CardHeader>
                <CardTitle>Résultat de la requête</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto font-mono text-sm">
                  {JSON.stringify(sqlResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export et Import de données</CardTitle>
              <CardDescription>
                Exportez ou importez des données depuis ou vers la base de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Export de données</h3>
                  <div className="grid gap-4">
                    <Select disabled={tables.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une table à exporter" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map(table => (
                          <SelectItem key={table} value={table}>
                            {table}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex space-x-2">
                      <Button className="flex-1">Exporter en CSV</Button>
                      <Button className="flex-1">Exporter en JSON</Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Import de données</h3>
                  <div className="grid gap-4">
                    <Select disabled={tables.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une table pour l'import" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map(table => (
                          <SelectItem key={table} value={table}>
                            {table}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="file" />
                    <Button disabled={true}>Importer des données</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseManager;
