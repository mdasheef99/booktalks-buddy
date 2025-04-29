import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Users, BookOpen, MessageSquare, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalClubs: 0,
    totalMembers: 0,
    totalDiscussions: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total clubs
        const { count: clubCount, error: clubError } = await supabase
          .from('book_clubs')
          .select('*', { count: 'exact', head: true });

        // Fetch total members (unique users in club_members)
        const { data: memberData, error: memberError } = await supabase
          .from('club_members')
          .select('user_id');

        // Fetch total discussions
        const { count: discussionCount, error: discussionError } = await supabase
          .from('discussion_topics')
          .select('*', { count: 'exact', head: true });

        if (clubError) throw clubError;
        if (memberError) throw memberError;
        if (discussionError) throw discussionError;

        // Get unique member count
        const uniqueMembers = new Set();
        memberData?.forEach(member => uniqueMembers.add(member.user_id));

        setStats({
          totalClubs: clubCount || 0,
          totalMembers: uniqueMembers.size,
          totalDiscussions: discussionCount || 0
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-300 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate('/book-club')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Book Clubs
      </Button>

      <h1 className="text-3xl font-serif text-bookconnect-brown mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Book Clubs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.totalClubs}</div>
              <BookOpen className="h-8 w-8 text-bookconnect-terracotta opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.totalMembers}</div>
              <Users className="h-8 w-8 text-bookconnect-terracotta opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Discussions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.totalDiscussions}</div>
              <MessageSquare className="h-8 w-8 text-bookconnect-terracotta opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will display recent activity across all book clubs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
