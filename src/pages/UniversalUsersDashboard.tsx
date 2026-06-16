import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function UniversalUsersDashboard() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    setUsers([
      { global_user_id: '123-abc', email: 'test@example.com', status: 'Active', visas: [] }
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Universal Users</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage identities across all satellite applications.
          </p>
        </div>
      </div>
      
      <Card className="rounded-md border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Global ID</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium text-gray-900">{user.email}</TableCell>
                <TableCell className="font-mono text-xs text-gray-500">{user.global_user_id}</TableCell>
                <TableCell>
                  <Badge variant={user.status === 'Active' ? 'default' : 'destructive'} className={user.status === 'Active' ? 'bg-secondary text-primary hover:bg-secondary border-primary/20' : ''}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <button className="text-sm font-semibold text-destructive hover:text-destructive/80 transition-colors">
                    Suspend (Kill-Switch)
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">No users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
