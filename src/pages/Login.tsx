import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Wrench, Store, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(email, password, selectedRole);
      if (success) {
        toast.success('Login successful!');
        switch (selectedRole) {
          case 'student':
            navigate('/student');
            break;
          case 'admin':
            navigate('/admin');
            break;
          case 'vendor':
            navigate('/vendor');
            break;
        }
      } else {
        toast.error('Invalid credentials');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfig = {
    student: {
      icon: GraduationCap,
      title: 'Student Login',
      description: 'Access cleaning, maintenance, and store services',
      demo: 'student@nmims.edu',
    },
    admin: {
      icon: Wrench,
      title: 'Administration Login',
      description: 'Manage cleaning and maintenance requests',
      demo: 'admin@nmims.edu',
    },
    vendor: {
      icon: Store,
      title: 'Store Vendor Login',
      description: 'Manage student orders and deliveries',
      demo: 'vendor@nmims.edu',
    },
  };

  const CurrentIcon = roleConfig[selectedRole].icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-header text-header-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-header-foreground/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold">N</span>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold">NMIMS Hyderabad</h1>
              <p className="text-sm text-header-foreground/80">Hostel Service Management Portal</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-md card-elevated animate-fade-in">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CurrentIcon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{roleConfig[selectedRole].title}</CardTitle>
            <CardDescription>{roleConfig[selectedRole].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)} className="mb-6">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="student" className="text-xs sm:text-sm">
                  <GraduationCap className="w-4 h-4 mr-1 hidden sm:inline" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="admin" className="text-xs sm:text-sm">
                  <Wrench className="w-4 h-4 mr-1 hidden sm:inline" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="vendor" className="text-xs sm:text-sm">
                  <Store className="w-4 h-4 mr-1 hidden sm:inline" />
                  Vendor
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="input-group">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={roleConfig[selectedRole].demo}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="input-group">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Demo:</strong> Use any email and password to log in
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>© 2026 NMIMS Hyderabad. All rights reserved.</p>
      </footer>
    </div>
  );
}
