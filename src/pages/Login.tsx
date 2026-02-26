import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import { LogIn, UserPlus, ArrowLeft, ShieldCheck, KeyRound, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import nmimsLogo from '@/assets/nmims-logo.png';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

type AuthView = 'home' | 'signin' | 'signup' | 'superuser' | 'forgot-password';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  role: z.enum(['student', 'admin', 'vendor', 'barber', 'laundry']),
  gender: z.enum(['male', 'female']).optional(),
  sapId: z.string().optional(),
  roomNumber: z.string().optional(),
  hostelBlock: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function Login() {
  const [currentView, setCurrentView] = useState<AuthView>('home');
  const { login, signup, resetPassword, isAuthenticated, role, isLoading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login Form
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
    reset: resetLoginForm
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Super User Login Form (re-use login schema as fields are same)
  const {
    register: registerSuper,
    handleSubmit: handleSubmitSuper,
    formState: { errors: superErrors },
    reset: resetSuperForm
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Signup Form
  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    control: controlSignup,
    watch,
    setValue: setSignupValue,
    formState: { errors: signupErrors },
    reset: resetSignupForm
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'student',
    },
  });

  const selectedRole = watch('role');
  const selectedGender = watch('gender');

  // Reset hostel block when gender changes for students
  useEffect(() => {
    if (selectedRole === 'student') {
      setSignupValue('hostelBlock', '');
    }
  }, [selectedGender, selectedRole, setSignupValue]);

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
        case 'barber':
          navigate('/barber');
          break;
        case 'laundry':
          navigate('/laundry');
          break;
        case 'super_user':
          navigate('/super-user');
          break;
      }
    }
  }, [isAuthenticated, role, authLoading, navigate]);

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('Login successful!');
      } else {
        toast.error(result.error || 'Invalid credentials');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await signup(
        data.email,
        data.password,
        data.fullName,
        data.role,
        data.sapId,
        data.roomNumber,
        data.hostelBlock,
        data.gender
      );

      if (result.success) {
        if (result.pendingApproval) {
          toast.success('Account created! Your request has been sent to the Super User for approval.');
          setCurrentView('home');
          resetSignupForm();
        } else {
          toast.success('Account created successfully!');
        }
      } else {
        toast.error(result.error || 'Failed to create account');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');

  const resetAllForms = () => {
    resetLoginForm();
    resetSuperForm();
    resetSignupForm();
    setResetEmail('');
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

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
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
                  resetAllForms();
                  setCurrentView('signin');
                }}
                className="nmims-btn"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </button>

              <button
                onClick={() => {
                  resetAllForms();
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

            {/* Super User Button */}
            <div className="mt-8">
              <button
                onClick={() => {
                  resetAllForms();
                  setCurrentView('superuser');
                }}
                className="text-sm text-muted-foreground hover:text-nmims-maroon transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Super User Login
              </button>
            </div>
          </>
        ) : currentView === 'superuser' ? (
          <Card className="w-full max-w-md bg-card/95 backdrop-blur border-0 shadow-xl animate-scale-in">
            <CardHeader className="pb-4 text-center relative">
              <button
                onClick={() => setCurrentView('home')}
                className="absolute left-4 top-4 p-2 text-muted-foreground hover:text-nmims-maroon transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex justify-center mb-3">
                <ShieldCheck className="w-8 h-8 text-nmims-maroon" />
              </div>
              <CardTitle className="text-xl text-nmims-maroon">
                Super User Login
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Approve Admin & Vendor accounts
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={handleSubmitSuper(onLoginSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="superEmail" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="superEmail"
                    type="email"
                    placeholder="Enter super user email"
                    className="bg-background h-11"
                    autoComplete="email"
                    {...registerSuper('email')}
                  />
                  {superErrors.email && (
                    <p className="text-sm text-destructive">{superErrors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="superPassword" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="superPassword"
                    type="password"
                    placeholder="Enter your password"
                    className="bg-background h-11"
                    autoComplete="current-password"
                    {...registerSuper('password')}
                  />
                  {superErrors.password && (
                    <p className="text-sm text-destructive">{superErrors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-nmims-maroon hover:bg-nmims-dark-maroon text-white font-medium"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Sign In as Super User
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : currentView === 'signin' ? (
          <Card className="w-full max-w-md bg-card/95 backdrop-blur border-0 shadow-xl animate-scale-in">
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
              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-background h-11"
                    autoComplete="email"
                    {...registerLogin('email')}
                  />
                  {loginErrors.email && (
                    <p className="text-sm text-destructive">{loginErrors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="bg-background h-11"
                    autoComplete="current-password"
                    {...registerLogin('password')}
                  />
                  {loginErrors.password && (
                    <p className="text-sm text-destructive">{loginErrors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-nmims-maroon hover:bg-nmims-dark-maroon text-white font-medium"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => {
                    setCurrentView('forgot-password');
                  }}
                  className="text-sm text-nmims-maroon hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <p className="text-sm text-center text-muted-foreground pt-2">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    resetAllForms();
                    setCurrentView('signup');
                  }}
                  className="text-nmims-maroon hover:underline font-medium"
                >
                  Create one
                </button>
              </p>
            </CardContent>
          </Card>
        ) : currentView === 'forgot-password' ? (
          <Card className="w-full max-w-md bg-card/95 backdrop-blur border-0 shadow-xl animate-scale-in">
            <CardHeader className="pb-4 text-center relative">
              <button
                onClick={() => setCurrentView('signin')}
                className="absolute left-4 top-4 p-2 text-muted-foreground hover:text-nmims-maroon transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex justify-center mb-3">
                <KeyRound className="w-8 h-8 text-nmims-maroon" />
              </div>
              <CardTitle className="text-xl text-nmims-maroon">
                Reset Password
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your email to receive a reset link
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                   className="bg-background h-11"
                  autoComplete="email"
                />
              </div>

              <Button
                onClick={async () => {
                  if (!resetEmail) {
                    toast.error('Please enter your email');
                    return;
                  }
                  setIsSubmitting(true);
                  const result = await resetPassword(resetEmail);
                  setIsSubmitting(false);
                  if (result.success) {
                    toast.success('Password reset link sent! Check your email.');
                    setCurrentView('signin');
                    setResetEmail('');
                  } else {
                    toast.error(result.error || 'Failed to send reset link');
                  }
                }}
                disabled={isSubmitting}
                className="w-full h-11 bg-nmims-maroon hover:bg-nmims-dark-maroon text-white font-medium"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground pt-2">
                Remember your password?{' '}
                <button
                  onClick={() => {
                    resetAllForms();
                    setCurrentView('signin');
                  }}
                  className="text-nmims-maroon hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md bg-card/95 backdrop-blur border-0 shadow-xl animate-scale-in">
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
              <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    className="bg-background h-11"
                    autoComplete="name"
                    {...registerSignup('fullName')}
                  />
                  {signupErrors.fullName && (
                    <p className="text-sm text-destructive">{signupErrors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signupEmail" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-background h-11"
                    autoComplete="email"
                    {...registerSignup('email')}
                  />
                  {signupErrors.email && (
                    <p className="text-sm text-destructive">{signupErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signupPassword" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="signupPassword"
                    type="password"
                    placeholder="Create a password"
                    className="bg-background h-11"
                    autoComplete="new-password"
                    {...registerSignup('password')}
                  />
                  {signupErrors.password && (
                    <p className="text-sm text-destructive">{signupErrors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    I am a
                  </Label>
                  <Controller
                    name="role"
                    control={controlSignup}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-background h-11">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="vendor">Store Vendor</SelectItem>
                          <SelectItem value="barber">Barber</SelectItem>
                          <SelectItem value="laundry">Laundry Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {signupErrors.role && (
                    <p className="text-sm text-destructive">{signupErrors.role.message}</p>
                  )}
                </div>

                {(selectedRole === 'admin' || selectedRole === 'vendor' || selectedRole === 'barber' || selectedRole === 'laundry') && (
                  <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-xs text-warning-foreground">
                      <strong>Note:</strong> {selectedRole === 'barber' ? 'Barber' : selectedRole === 'laundry' ? 'Laundry Owner' : 'Admin and Vendor'} accounts require Super User approval before you can login.
                    </p>
                  </div>
                )}

                {/* Gender selector for all roles */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Gender</Label>
                  <Controller
                    name="gender"
                    control={controlSignup}
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-background h-11">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {signupErrors.gender && (
                    <p className="text-sm text-destructive">{signupErrors.gender.message}</p>
                  )}
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
                        className="bg-background h-11"
                        {...registerSignup('sapId')}
                      />
                      {signupErrors.sapId && (
                        <p className="text-sm text-destructive">{signupErrors.sapId.message}</p>
                      )}
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
                          className="bg-background h-11"
                          {...registerSignup('roomNumber')}
                        />
                        {signupErrors.roomNumber && (
                          <p className="text-sm text-destructive">{signupErrors.roomNumber.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Hostel Block
                        </Label>
                        <Controller
                          name="hostelBlock"
                          control={controlSignup}
                          render={({ field }) => (
                            <Select
                              value={field.value || ''}
                              onValueChange={field.onChange}
                              disabled={!selectedGender}
                            >
                              <SelectTrigger className="bg-background h-11 z-50">
                                <SelectValue placeholder={selectedGender ? "Select hostel block" : "Select gender first"} />
                              </SelectTrigger>
                              <SelectContent className="bg-popover z-50">
                                {selectedGender === 'male' && (
                                  <>
                                    <SelectItem value="Hostel B1">Hostel B1</SelectItem>
                                    <SelectItem value="Hostel B2">Hostel B2</SelectItem>
                                  </>
                                )}
                                {selectedGender === 'female' && (
                                  <>
                                    <SelectItem value="Hostel G1">Hostel G1</SelectItem>
                                    <SelectItem value="Hostel G2">Hostel G2</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {signupErrors.hostelBlock && (
                          <p className="text-sm text-destructive">{signupErrors.hostelBlock.message}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-nmims-maroon hover:bg-nmims-dark-maroon text-white font-medium"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>

              <p className="text-sm text-center text-muted-foreground pt-2">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    resetAllForms();
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
