import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { User as UserIcon, Clock, Building } from "lucide-react";

interface UsersResponse {
  users: User[];
}

export default function LandingPage() {
  // Fetch all users
  const { data: usersData, isLoading } = useQuery<UsersResponse>({
    queryKey: ['/api/users'],
  });

  const users = usersData?.users || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-4">
          Break Management System
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl text-center">
          Track and manage your daily break time allowance with ease. Stay on top of your breaks and optimize your productivity.
        </p>
        <div className="flex gap-4 mt-6">
          <Button asChild variant="outline" className="border-blue-300 hover:bg-blue-50">
            <Link href="/login">
              Login
            </Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500">
            <Link href="/signup">
              Sign Up
            </Link>
          </Button>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Select an Employee</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse flex flex-col space-y-4 w-full">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-28 bg-slate-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow duration-200 border-slate-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 pb-3">
                <CardTitle className="text-lg flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-blue-500" />
                  {user.name || user.username}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">Employee ID: EMP{user.id.toString().padStart(5, '0')}</span>
                  </div>
                  {user.departmentId && (
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Department ID: {user.departmentId}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button asChild className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                  <Link href={`/dashboard?userId=${user.id}`}>
                    Manage Breaks
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}