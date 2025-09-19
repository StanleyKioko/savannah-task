import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import useAuthStore from '@/stores/authStore';

export default function UserProfile() {
  const { user, logout, checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // Refresh user data when component mounts
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Loading user information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="bg-primary/10 rounded-full p-4 flex-shrink-0">
            <User className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}` 
                : user.username}
            </h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Username</Label>
              <p className="font-medium">{user.username}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Email</Label>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">First Name</Label>
              <p className="font-medium">{user.first_name || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Last Name</Label>
              <p className="font-medium">{user.last_name || '-'}</p>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Account Type</Label>
            <p className="font-medium">{user.is_staff ? 'Administrator' : 'User'}</p>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Member Since</Label>
            <p className="font-medium">{new Date(user.date_joined).toLocaleDateString()}</p>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Last Login</Label>
            <p className="font-medium">
              {user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}