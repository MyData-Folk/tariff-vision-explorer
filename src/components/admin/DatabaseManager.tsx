
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TableSchema {
  name: string;
  columns: { name: string; type: string }[];
}

const DatabaseManager = () => {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [columnTypes, setColumnTypes] = useState<{ [column: string]: string }>({});
  const [newRowData, setNewRowData] = useState<{ [column: string]: any }>({});
  const [editRowId, setEditRowId] = useState<any>(null);
  const [editRowData, setEditRowData] = useState<{ [column: string]: any }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      try {
        // Fetch all tables in the database
        const { data, error } = await supabase
          .rpc('get_tables') // Utilisation d'une fonction RPC personnalisée à la place de pg_tables
          .select('*');

        if (error) {
          console.error('Error fetching tables:', error);
          toast.error('Failed to fetch tables');
          return;
        }

        // Extract table names
        const tableNames = data?.map((table: any) => table.table_name) || [];

        // Fetch schema for each table
        const tableSchemas = await Promise.all(
          tableNames.map(async (tableName: string) => {
            const { data: columns, error: columnError } = await supabase
              .rpc('get_columns', { table_name: tableName }) // Utilisation d'une fonction RPC personnalisée
              .select('*');

            if (columnError) {
              console.error(`Error fetching columns for table ${tableName}:`, columnError);
              return null;
            }

            // Extract column names and types
            const tableSchema: TableSchema = {
              name: tableName,
              columns: columns?.map((column: any) => ({ name: column.column_name, type: column.data_type })) || [],
            };

            return tableSchema;
          })
        );

        // Filter out tables with errors
        const validTableSchemas = tableSchemas.filter((schema) => schema !== null) as TableSchema[];
        setTables(validTableSchemas);
      } catch (error) {
        console.error('Error fetching tables:', error);
        toast.error('Failed to fetch tables');
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  useEffect(() => {
    const fetchTableData = async () => {
      if (!selectedTable) return;

      setLoading(true);
      try {
        // Utiliser une requête dynamique via un paramètre de type string est sécuritaire
        // car nous contrôlons la valeur de selectedTable à partir des options de la liste déroulante
        const { data, error } = await supabase
          .from(selectedTable as any)
          .select('*');

        if (error) {
          console.error('Error fetching table data:', error);
          toast.error('Failed to fetch table data');
          return;
        }

        setTableData(data);
      } catch (error) {
        console.error('Error fetching table data:', error);
        toast.error('Failed to fetch table data');
      } finally {
        setLoading(false);
      }
    };

    fetchTableData();
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable) {
      const selectedTableSchema = tables.find((table) => table.name === selectedTable);
      if (selectedTableSchema) {
        const initialColumnTypes: { [column: string]: string } = {};
        selectedTableSchema.columns.forEach((column) => {
          initialColumnTypes[column.name] = column.type;
        });
        setColumnTypes(initialColumnTypes);

        // Initialize new row data
        const initialNewRowData: { [column: string]: any } = {};
        selectedTableSchema.columns.forEach((column) => {
          initialNewRowData[column.name] = getDefaultValueForType(column.type);
        });
        setNewRowData(initialNewRowData);
      }
    }
  }, [selectedTable, tables]);

  const getDefaultValueForType = (type: string): any => {
    switch (type) {
      case 'text':
      case 'varchar':
        return '';
      case 'integer':
      case 'bigint':
        return 0;
      case 'boolean':
        return false;
      case 'timestamp':
        return new Date().toISOString();
      default:
        return null;
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setEditRowId(null);
  };

  const handleInputChange = (column: string, value: any, isNewRow: boolean = true) => {
    if (isNewRow) {
      setNewRowData({ ...newRowData, [column]: value });
    } else {
      setEditRowData({ ...editRowData, [column]: value });
    }
  };

  const handleInsertOrUpdateData = async (tableName: string, rowData: any) => {
    setLoading(true);
    try {
      // Correction du problème de type en utilisant un cast explicite
      const { data, error } = await supabase
        .from(tableName as any)
        .upsert(rowData as any);

      if (error) {
        console.error('Error inserting/updating data:', error);
        toast.error('Failed to insert/update data');
        return;
      }

      // Refresh table data
      const { data: newData, error: newError } = await supabase.from(tableName as any).select('*');
      if (newError) {
        console.error('Error fetching updated table data:', newError);
        toast.error('Failed to fetch updated table data');
        return;
      }
      setTableData(newData);

      // Reset new row data
      const initialNewRowData: { [column: string]: any } = {};
      const selectedTableSchema = tables.find((table) => table.name === tableName);
      if (selectedTableSchema) {
        selectedTableSchema.columns.forEach((column) => {
          initialNewRowData[column.name] = getDefaultValueForType(column.type);
        });
        setNewRowData(initialNewRowData);
      }

      toast.success('Data inserted/updated successfully');
    } catch (error) {
      console.error('Error inserting/updating data:', error);
      toast.error('Failed to insert/update data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async (tableName: string, id: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.from(tableName as any).delete().match({ id });

      if (error) {
        console.error('Error deleting data:', error);
        toast.error('Failed to delete data');
        return;
      }

      // Refresh table data
      const { data: newData, error: newError } = await supabase.from(tableName as any).select('*');
      if (newError) {
        console.error('Error fetching updated table data:', newError);
        toast.error('Failed to fetch updated table data');
        return;
      }
      setTableData(newData);

      toast.success('Data deleted successfully');
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Failed to delete data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRow = (row: any) => {
    setEditRowId(row.id);
    setEditRowData(row);
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setEditRowData({});
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Database Manager</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select Table</CardTitle>
          <CardDescription>Choose a table to view and manage its data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleTableSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Tables</SelectLabel>
                {tables.map((table) => (
                  <SelectItem key={table.name} value={table.name}>
                    {table.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTable && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Table Data: {selectedTable}</CardTitle>
              <CardDescription>View, edit, and manage data in the selected table.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading data...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        {tables.find((table) => table.name === selectedTable)?.columns.map((column) => (
                          <th key={column.name} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {column.name}
                          </th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tableData.map((row) => (
                        <tr key={row.id}>
                          {tables.find((table) => table.name === selectedTable)?.columns.map((column) => (
                            <td key={column.name} className="px-6 py-4 whitespace-nowrap">
                              {editRowId === row.id ? (
                                <Input
                                  type="text"
                                  value={editRowData[column.name] || ''}
                                  onChange={(e) => handleInputChange(column.name, e.target.value, false)}
                                />
                              ) : (
                                <div className="text-sm text-gray-900">{row[column.name]}</div>
                              )}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {editRowId === row.id ? (
                              <div className="flex space-x-2">
                                <Button size="sm" onClick={() => handleInsertOrUpdateData(selectedTable, editRowData)}>
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditRow(row)}>
                                  Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteData(selectedTable, row.id)}>
                                  Delete
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insert New Row</CardTitle>
              <CardDescription>Add a new row to the table.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tables.find((table) => table.name === selectedTable)?.columns.map((column) => (
                  <div key={column.name} className="space-y-2">
                    <Label htmlFor={column.name}>{column.name}</Label>
                    <Input
                      type="text"
                      id={column.name}
                      value={newRowData[column.name] || ''}
                      onChange={(e) => handleInputChange(column.name, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleInsertOrUpdateData(selectedTable, newRowData)}>
                Insert New Row
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;
