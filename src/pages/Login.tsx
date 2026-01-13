import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Shield, Store } from 'lucide-react';
import { toast } from 'sonner';
import nmimsLogo from '@/assets/nmims-logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (role: UserRole) => {
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password');
      return;
    }

    setSelectedRole(role);
    setIsLoading(true);
    
    try {
      const success = await login(email, password, role);
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
      setSelectedRole(null);
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
            onClick={() => handleLogin('student')}
            disabled={isLoading}
            className="nmims-btn"
          >
            {isLoading && selectedRole === 'student' ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <GraduationCap className="w-5 h-5" />
            )}
            Student Login
          </button>
          
          <button
            onClick={() => handleLogin('admin')}
            disabled={isLoading}
            className="nmims-btn"
          >
            {isLoading && selectedRole === 'admin' ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Shield className="w-5 h-5" />
            )}
            Admin Login
          </button>

          <button
            onClick={() => handleLogin('vendor')}
            disabled={isLoading}
            className="nmims-btn"
          >
            {isLoading && selectedRole === 'vendor' ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Store className="w-5 h-5" />
            )}
            Vendor Login
          </button>
        </div>

        {/* Demo Credentials Card */}
        <Card className="w-full max-w-md bg-white/90 backdrop-blur border-0 shadow-lg animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-center">Demo Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="input-group">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter any email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="input-group">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter any password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white"
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Enter any credentials and click a login button above
            </p>
          </CardContent>
        </Card>

        {/* Scrolling Welcome Message */}
        <div className="w-full max-w-2xl mt-8 overflow-hidden">
          <p className="text-nmims-maroon font-medium whitespace-nowrap animate-marquee">
            Welcome to Hostel Service Management Portal | Submit your service requests in advance!
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-3 text-center text-sm">
        <p>2026 © NMIMS Hyderabad - All rights reserved.</p>
      </footer>
    </div>
  );
}
