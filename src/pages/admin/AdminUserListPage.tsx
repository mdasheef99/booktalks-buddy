import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  username: string | null;
  email: string | null;
  favorite_genre: string | null;
  favorite_author: string | null;
}

const AdminUserListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, email, favorite_genre, favorite_author')
          .order('username');

        if (error) throw error;
        setUsers(data || []);
        setFilteredUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user => 
        (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      // This is a placeholder for actual invite functionality
      // In a real implementation, you would send an invitation email
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invitation');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-300 rounded"></div>
        <div className="h-12 bg-gray-300 rounded"></div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-300 rounded"></div>
          <div className="h-20 bg-gray-300 rounded"></div>
          <div className="h-20 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-serif text-bookconnect-brown mb-8">User Management</h1>
      
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <Button 
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>
      
      {showInviteForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email address"
                  className="pl-10"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">Send Invite</Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowInviteForm(false)}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      <div className="space-y-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{user.username || 'No username'}</h3>
                    <p className="text-muted-foreground">{user.email || 'No email'}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.favorite_genre && (
                        <span className="text-xs bg-bookconnect-sage/20 text-bookconnect-sage px-2 py-1 rounded-full">
                          {user.favorite_genre}
                        </span>
                      )}
                      {user.favorite_author && (
                        <span className="text-xs bg-bookconnect-cream text-bookconnect-brown px-2 py-1 rounded-full">
                          {user.favorite_author}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? 'No users match your search' : 'No users found'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminUserListPage;
