import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTables } from "@/services/supabaseService"; // Importer notre fonction au lieu du RPC
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save, Trash2, Database } from "lucide-react";

interface TableColumns {
  [key: string]: string[];
}

const DatabaseManager = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<TableColumns>({});
  const [isLoading, setIsLoading] = useState(true);
  const [newRow, setNewRow] = useState<{[key: string]: any}>({});
  const [editingRows, setEditingRows] = useState<{[key: string]: any}>({});
  const [isAdmin, setIsAdmin] = useState(true); // Dans une vraie application, vérifiez les droits d'admin

  useEffect(() => {
    const loadTables = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer la liste des tables publiques en utilisant notre fonction
        const publicTables = await getTables('public');
        setTables(publicTables);
        
        // Récupérer les colonnes pour chaque table
        const columnsObj: TableColumns = {};
        for (const table of publicTables) {
          const { data: columnsData, error: columnsError } = await supabase
            .from(table)
            .select('*')
            .limit(0);
          
          if (columnsError) throw columnsError;
          
          if (columnsData) {
            columnsObj[table] = Object.keys(columnsData.length > 0 ? columnsData[0] : {});
          }
        }
        
        setColumns(columnsObj);
        
        if (publicTables.length > 0) {
          setSelectedTable(publicTables[0]);
          await loadTableData(publicTables[0]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des tables:", error);
        toast.error("Impossible de charger les tables de la base de données");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTables();
  }, []);

  const loadTableData = async (tableName: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      setTableData(data || []);
      
      // Réinitialiser le nouvel enregistrement avec les colonnes de cette table
      const newRowTemplate: {[key: string]: any} = {};
      if (columns[tableName]) {
        columns[tableName].forEach(col => {
          if (!['id', 'created_at', 'updated_at'].includes(col)) {
            newRowTemplate[col] = '';
          }
        });
      }
      setNewRow(newRowTemplate);
      
      // Réinitialiser les lignes en cours d'édition
      setEditingRows({});
      
    } catch (error) {
      console.error(`Erreur lors du chargement des données de ${tableName}:`, error);
      toast.error(`Impossible de charger les données de ${tableName}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNewRow = async () => {
    if (!selectedTable) return;
    
    try {
      const { data, error } = await supabase
        .from(selectedTable)
        .insert([newRow])
        .select();
      
      if (error) throw error;
      
      toast.success("Nouvel enregistrement ajouté avec succès");
      
      // Recharger les données pour voir le nouvel enregistrement
      await loadTableData(selectedTable);
      
    } catch (error) {
      console.error("Erreur lors de l'ajout d'un nouvel enregistrement:", error);
      toast.error("Erreur lors de l'ajout d'un nouvel enregistrement");
    }
  };

  const handleDeleteRow = async (id: string) => {
    if (!selectedTable) return;
    
    try {
      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Enregistrement supprimé avec succès");
      
      // Mettre à jour les données localement pour éviter de recharger
      setTableData(tableData.filter(row => row.id !== id));
      
    } catch (error) {
      console.error("Erreur lors de la suppression de l'enregistrement:", error);
      toast.error("Erreur lors de la suppression de l'enregistrement");
    }
  };

  const startEditing = (row: any) => {
    setEditingRows({
      ...editingRows,
      [row.id]: { ...row }
    });
  };

  const handleEditChange = (id: string, column: string, value: any) => {
    setEditingRows({
      ...editingRows,
      [id]: {
        ...editingRows[id],
        [column]: value
      }
    });
  };

  const saveEditing = async (id: string) => {
    if (!selectedTable) return;
    
    try {
      const { error } = await supabase
        .from(selectedTable)
        .update(editingRows[id])
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Modifications enregistrées avec succès");
      
      // Mettre à jour les données localement
      setTableData(tableData.map(row => 
        row.id === id ? editingRows[id] : row
      ));
      
      // Supprimer la ligne de la liste des lignes en cours d'édition
      const { [id]: _, ...rest } = editingRows;
      setEditingRows(rest);
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'enregistrement:", error);
      toast.error("Erreur lors de la mise à jour de l'enregistrement");
    }
  };

  const cancelEditing = (id: string) => {
    const { [id]: _, ...rest } = editingRows;
    setEditingRows(rest);
  };

  const handleNewRowChange = (column: string, value: any) => {
    setNewRow({
      ...newRow,
      [column]: value
    });
  };

  if (!isAdmin) {
    return (
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Accès non autorisé</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Vous n'avez pas les droits administrateurs nécessaires pour accéder à cette page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Database className="h-6 w-6 mr-2" />
        <h2 className="text-xl font-bold">Gestion de la base de données</h2>
      </div>

      <Tabs defaultValue={selectedTable || ''} onValueChange={(value) => {
        setSelectedTable(value);
        loadTableData(value);
      }}>
        <TabsList className="mb-4 overflow-x-auto flex w-full">
          {tables.map(table => (
            <TabsTrigger key={table} value={table}>
              {table}
            </TabsTrigger>
          ))}
        </TabsList>

        {tables.map(table => (
          <TabsContent key={table} value={table} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Formulaire pour ajouter un nouvel enregistrement */}
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="text-lg">Ajouter un nouvel enregistrement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {columns[table]?.filter(col => !['id', 'created_at', 'updated_at'].includes(col)).map(column => (
                        <div key={column} className="space-y-1">
                          <label className="text-sm font-medium">{column}</label>
                          <Input
                            value={newRow[column] || ''}
                            onChange={(e) => handleNewRowChange(column, e.target.value)}
                            placeholder={column}
                          />
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleSaveNewRow} className="btn-3d">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter
                    </Button>
                  </CardContent>
                </Card>

                {/* Tableau des données */}
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="text-lg">Données ({tableData.length} enregistrements)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto tariff-scrollbar">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {columns[table]?.map(column => (
                              <TableHead key={column}>{column}</TableHead>
                            ))}
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.map(row => (
                            <TableRow key={row.id}>
                              {columns[table]?.map(column => (
                                <TableCell key={column}>
                                  {editingRows[row.id] ? (
                                    <Input
                                      value={editingRows[row.id][column] || ''}
                                      onChange={(e) => handleEditChange(row.id, column, e.target.value)}
                                      disabled={['id', 'created_at', 'updated_at'].includes(column)}
                                      className="w-full"
                                    />
                                  ) : (
                                    <span>{row[column]?.toString()}</span>
                                  )}
                                </TableCell>
                              ))}
                              <TableCell>
                                {editingRows[row.id] ? (
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => saveEditing(row.id)} 
                                      className="bg-tariff-green hover:bg-tariff-green/80"
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => cancelEditing(row.id)}
                                    >
                                      Annuler
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => startEditing(row)}
                                    >
                                      Modifier
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-destructive hover:text-destructive hover:bg-destructive/20"
                                      onClick={() => handleDeleteRow(row.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {tableData.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={columns[table]?.length + 1} className="text-center py-4">
                                Aucun enregistrement trouvé
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default DatabaseManager;
