import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useHasContextualEntitlement } from '@/lib/entitlements/hooks';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Administrator = {
  user_id: string;
  role: string;
  assigned_at: string;
  assigned_by: string;
  users: {
    username: string;
    email: string;
  };
};

type StoreAdministratorsProps = {
  storeId: string;
};

/**
 * Component for displaying and managing store administrators
 */
export function StoreAdministrators({ storeId }: StoreAdministratorsProps) {
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user } = useAuth();
  const { result: isStoreOwner } = useHasContextualEntitlement('STORE_OWNER', storeId);
  
  const fetchAdministrators = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/stores/${storeId}/administrators`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch administrators');
      }
      
      const data = await response.json();
      setAdministrators(data.administrators || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch administrators');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAdministrators();
  }, [storeId]);
  
  const handleRemoveAdministrator = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this administrator?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/stores/${storeId}/administrators/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove administrator');
      }
      
      toast.success('Administrator removed successfully');
      fetchAdministrators();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove administrator');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Administrators</CardTitle>
        <CardDescription>Manage administrators for this store</CardDescription>
      </CardHeader>
      <CardContent>
        {isStoreOwner && (
          <div className="mb-4">
            <AddAdministratorDialog 
              storeId={storeId} 
              onAdministratorAdded={fetchAdministrators}
              isOpen={isAddDialogOpen}
              setIsOpen={setIsAddDialogOpen}
            />
          </div>
        )}
        
        {loading ? (
          <div>Loading administrators...</div>
        ) : administrators.length === 0 ? (
          <div>No administrators found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {administrators.map((admin) => (
                <TableRow key={admin.user_id}>
                  <TableCell>{admin.users.username}</TableCell>
                  <TableCell>{admin.users.email}</TableCell>
                  <TableCell>
                    <Badge variant={admin.role === 'owner' ? 'destructive' : 'secondary'}>
                      {admin.role === 'owner' ? 'Owner' : 'Manager'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(admin.assigned_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {isStoreOwner && admin.user_id !== user?.id && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleRemoveAdministrator(admin.user_id)}
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

type AddAdministratorDialogProps = {
  storeId: string;
  onAdministratorAdded: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

function AddAdministratorDialog({ storeId, onAdministratorAdded, isOpen, setIsOpen }: AddAdministratorDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('manager');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First, find the user by email
      const userResponse = await fetch(`/api/users/by-email?email=${encodeURIComponent(email)}`);
      
      if (!userResponse.ok) {
        throw new Error('User not found');
      }
      
      const userData = await userResponse.json();
      
      // Then, add the administrator
      const response = await fetch(`/api/stores/${storeId}/administrators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.user.id,
          role,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add administrator');
      }
      
      toast.success('Administrator added successfully');
      setIsOpen(false);
      setEmail('');
      setRole('manager');
      onAdministratorAdded();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add administrator');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add Administrator</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Administrator</DialogTitle>
          <DialogDescription>
            Add a new administrator to this store
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                placeholder="user@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Administrator'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
