
import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Users, Calendar, MessageSquare, BarChart2 } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { name: "Total Books", value: "1,248", icon: BookOpen, color: "bg-blue-100" },
    { name: "Active Users", value: "843", icon: Users, color: "bg-green-100" },
    { name: "Events", value: "32", icon: Calendar, color: "bg-yellow-100" },
    { name: "Discussions", value: "1,156", icon: MessageSquare, color: "bg-purple-100" },
  ];

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className="mr-4" 
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif">Admin Dashboard</h1>
              <p className="text-muted-foreground">Overview of BookConnect statistics</p>
            </div>
          </div>
          <Button>Generate Report</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-full`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Monthly Activity</CardTitle>
            <CardDescription>Book discussions and user registrations</CardDescription>
          </CardHeader>
          <CardContent className="h-80 bg-muted/20 flex items-center justify-center">
            <div className="flex items-center">
              <BarChart2 className="h-10 w-10 text-muted mr-2" />
              <p className="text-muted-foreground">Chart visualization would appear here</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent Books</CardTitle>
              <CardDescription>Newly added books</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Book Title {i + 1}</p>
                      <p className="text-sm text-muted-foreground">Author Name</p>
                    </div>
                    <span className="text-xs bg-muted px-2 py-1 rounded">New</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto">View All Books</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent Users</CardTitle>
              <CardDescription>Latest user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-muted mr-3 flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">User {i + 1}</p>
                        <p className="text-xs text-muted-foreground">user{i + 1}@example.com</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">2 days ago</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto">View All Users</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
