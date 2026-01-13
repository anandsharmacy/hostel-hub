import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import nmimsLogo from '@/assets/nmims-logo.png';
import { z } from 'zod';

type AuthView = 'home' | 'signin' | 'signup';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  role: z.enum(['student', 'admin', 'vendor']),
  sapId: z.string().optional(),
  roomNumber: z.string().optional(),
  hostelBlock: z.string().optional(),
});

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [sapId, setSapId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [hostelBlock, setHostelBlock] = useState('');
  const [currentView, setCurrentView] = useState<AuthView>('home');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup, isAuthenticated, role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && role && !authLoading) {
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
    }
  }, [isAuthenticated, role, authLoading, navigate]);

  const handleLogin = async () => {
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Login successful!');
        // Navigation will be handled by useEffect
      } else {
        toast.error(result.error || 'Invalid credentials');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    const validation = signupSchema.safeParse({ 
      email, 
      password, 
      fullName, 
      role: selectedRole,
      sapId: sapId || undefined,
      roomNumber: roomNumber || undefined,
      hostelBlock: hostelBlock || undefined,
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await signup(
        email, 
        password, 
        fullName, 
        selectedRole,
        sapId || undefined,
        roomNumber || undefined,
        hostelBlock || undefined
      );
      
      if (result.success) {
        toast.success('Account created successfully!');
        // Navigation will be handled by useEffect
      } else {
        toast.error(result.error || 'Failed to create account');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setSapId('');
    setRoomNumber('');
    setHostelBlock('');
    setSelectedRole('student');
  };

  const navLinks = [
    { label: 'About', href: '/about', isRoute: true },
    { label: 'Contact', href: '/contact', isRoute: true },
    { label: 'Hostel Rules', href: '/hostel-rules', isRoute: true },
    { label: 'Hostel Application', href: 'https://portal.svkm.ac.in/usermgmt/viewHostels', isRoute: false },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <header className="nmims-header text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              <img 
                src={nmimsLogo} 
                alt="NMIMS Logo" 
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                link.isRoute ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium hover:text-white/80 transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium hover:text-white/80 transition-colors"
                  >
                    {link.label}
                  </a>
                )
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 geometric-bg flex flex-col items-center justify-center px-4 py-12">
        {currentView === 'home' ? (
          <>
            <div className="mb-8 animate-fade-in">
              <img 
                src={nmimsLogo} 
                alt="SVKM's NMIMS - Deemed to be University" 
                className="h-40 md:h-52 w-auto"
              />
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold text-nmims-maroon mb-8 text-center animate-slide-up">
              Hostel Service Management
            </h1>

            <div className="flex flex-col gap-4 mb-8 animate-slide-up">
              <button
                onClick={() => {
                  resetForm();
                  setCurrentView('signin');
                }}
                className="nmims-btn"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </button>
              
              <button
                onClick={() => {
                  resetForm();
                  setCurrentView('signup');
                }}
                className="nmims-btn-outline"
              >
                <UserPlus className="w-5 h-5" />
                Create Account
              </button>
            </div>

            <div className="w-full max-w-2xl mt-8 overflow-hidden">
              <p className="text-nmims-maroon font-medium whitespace-nowrap animate-marquee">
                Welcome to Hostel Service Management Portal | Submit your service requests in advance!
              </p>
            </div>
          </>
        ) : currentView === 'signin' ? (
          <Card className="w-full max-w-md bg-white/95 backdrop-blur border-0 shadow-xl animate-scale-in">
            <CardHeader className="pb-4 text-center relative">
              <button
                onClick={() => setCurrentView('home')}
                className="absolute left-4 top-4 p-2 text-muted-foreground hover:text-nmims-maroon transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex justify-center mb-3">
                <LogIn className="w-8 h-8 text-nmims-maroon" />
              </div>
              <CardTitle className="text-xl text-nmims-maroon">
                Sign In
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your credentials to continue
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white h-11"
                  autoComplete="email"
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
                onClick={handleLogin}
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

              <p className="text-sm text-center text-muted-foreground pt-2">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    resetForm();
                    setCurrentView('signup');
                  }}
                  className="text-nmims-maroon hover:underline font-medium"
                >
                  Create one
                </button>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md bg-white/95 backdrop-blur border-0 shadow-xl animate-scale-in">
            <CardHeader className="pb-4 text-center relative">
              <button
                onClick={() => setCurrentView('home')}
                className="absolute left-4 top-4 p-2 text-muted-foreground hover:text-nmims-maroon transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex justify-center mb-3">
                <UserPlus className="w-8 h-8 text-nmims-maroon" />
              </div>
              <CardTitle className="text-xl text-nmims-maroon">
                Create Account
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Fill in your details to register
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-white h-11"
                  autoComplete="name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signupEmail" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="signupEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white h-11"
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signupPassword" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="signupPassword"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white h-11"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  I am a
                </Label>
                <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                  <SelectTrigger className="bg-white h-11">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="vendor">Store Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRole === 'student' && (
                <>
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
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="roomNumber" className="text-sm font-medium">
                        Room Number
                      </Label>
                      <Input
                        id="roomNumber"
                        type="text"
                        placeholder="e.g. 304"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="bg-white h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hostelBlock" className="text-sm font-medium">
                        Hostel Block
                      </Label>
                      <Input
                        id="hostelBlock"
                        type="text"
                        placeholder="e.g. Block A"
                        value={hostelBlock}
                        onChange={(e) => setHostelBlock(e.target.value)}
                        className="bg-white h-11"
                      />
                    </div>
                  </div>
                </>
              )}
              
              <Button
                onClick={handleSignup}
                disabled={isLoading}
                className="w-full h-11 bg-nmims-maroon hover:bg-nmims-dark-maroon text-white font-medium"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground pt-2">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    resetForm();
                    setCurrentView('signin');
                  }}
                  className="text-nmims-maroon hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-3 text-center text-sm">
        <p>2026 © NMIMS Hyderabad - All rights reserved.</p>
      </footer>
    </div>
  );
}
