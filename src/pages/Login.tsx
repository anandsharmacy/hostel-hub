import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Shield, Store, LogIn, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import nmimsLogo from '@/assets/nmims-logo.png';

type LoginView = 'home' | 'student' | 'admin' | 'vendor';

export default function Login() {
  const [sapId, setSapId] = useState('');
  const [password, setPassword] = useState('');
  const [currentView, setCurrentView] = useState<LoginView>('home');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (role: UserRole) => {
    if (!sapId.trim() || !password.trim()) {
      toast.error('Please enter both SAP ID and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(sapId, password, role);
      if (success) {
        toast.success('Login successful!');
        switch (role) {
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

  const navLinks = [
    { label: 'About', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Instructions', href: '#' },
    { label: 'Hostel Rules', href: '#' },
    { label: 'Hostel Application', href: '#' },
    { label: 'Security Scanner', href: '#' },
  ];

  const getRoleTitle = (view: LoginView) => {
    switch (view) {
      case 'student':
        return 'Student Sign In';
      case 'admin':
        return 'Admin Sign In';
      case 'vendor':
        return 'Vendor Sign In';
      default:
        return '';
    }
  };

  const getRoleIcon = (view: LoginView) => {
    switch (view) {
      case 'student':
        return <GraduationCap className="w-8 h-8 text-nmims-maroon" />;
      case 'admin':
        return <Shield className="w-8 h-8 text-nmims-maroon" />;
      case 'vendor':
        return <Store className="w-8 h-8 text-nmims-maroon" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <header className="nmims-header text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src={nmimsLogo} 
                alt="NMIMS Logo" 
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium hover:text-white/80 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content with Geometric Background */}
      <main className="flex-1 geometric-bg flex flex-col items-center justify-center px-4 py-12">
        {currentView === 'home' ? (
          <>
            {/* Large Centered Logo */}
            <div className="mb-8 animate-fade-in">
              <img 
                src={nmimsLogo} 
                alt="SVKM's NMIMS - Deemed to be University" 
                className="h-40 md:h-52 w-auto"
              />
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-semibold text-nmims-maroon mb-8 text-center animate-slide-up">
              Hostel Service Management
            </h1>

            {/* Login Buttons */}
            <div className="flex flex-col gap-4 mb-8 animate-slide-up">
              <button
                onClick={() => setCurrentView('student')}
                className="nmims-btn"
              >
                <GraduationCap className="w-5 h-5" />
                Student Sign In
              </button>
              
              <button
                onClick={() => setCurrentView('admin')}
                className="nmims-btn"
              >
                <Shield className="w-5 h-5" />
                Admin Sign In
              </button>

              <button
                onClick={() => setCurrentView('vendor')}
                className="nmims-btn"
              >
                <Store className="w-5 h-5" />
                Vendor Sign In
              </button>
            </div>

            {/* Scrolling Welcome Message */}
            <div className="w-full max-w-2xl mt-8 overflow-hidden">
              <p className="text-nmims-maroon font-medium whitespace-nowrap animate-marquee">
                Welcome to Hostel Service Management Portal | Submit your service requests in advance!
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Login Form */}
            <Card className="w-full max-w-md bg-white/95 backdrop-blur border-0 shadow-xl animate-scale-in">
              <CardHeader className="pb-4 text-center">
                <button
                  onClick={() => setCurrentView('home')}
                  className="absolute left-4 top-4 p-2 text-muted-foreground hover:text-nmims-maroon transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex justify-center mb-3">
                  {getRoleIcon(currentView)}
                </div>
                <CardTitle className="text-xl text-nmims-maroon">
                  {getRoleTitle(currentView)}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your credentials to continue
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="sapId" className="text-sm font-medium">
                    SAP ID
                  </Label>
                  <Input
                    id="sapId"
                    type="text"
                    placeholder="Enter your SAP ID"
                    value={sapId}
                    onChange={(e) => setSapId(e.target.value)}
                    className="bg-white h-11"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white h-11"
                    autoComplete="current-password"
                  />
                </div>
                
                <Button
                  onClick={() => handleLogin(currentView as UserRole)}
                  disabled={isLoading}
                  className="w-full h-11 bg-nmims-maroon hover:bg-nmims-dark-maroon text-white font-medium"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground pt-2">
                  Demo: Enter any SAP ID and password to login
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-3 text-center text-sm">
        <p>2026 © NMIMS Hyderabad - All rights reserved.</p>
      </footer>
    </div>
  );
}
