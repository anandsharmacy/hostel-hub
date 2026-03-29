import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, ShieldCheck, Wrench, GraduationCap, Store, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import nmimsLogo from '@/assets/nmims-logo.png';

export function DashboardNavbar() {
  const { profile, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleConfig = () => {
    switch (role) {
      case 'student':
        return { label: 'Student', icon: GraduationCap };
      case 'admin':
        return { label: 'Administrator', icon: Wrench };
      case 'vendor':
        return { label: 'Store Vendor', icon: Store };
      case 'super_user':
        return { label: 'Super User', icon: ShieldCheck };
      default:
        return { label: 'User', icon: User };
    }
  };

  const { label, icon: RoleIcon } = getRoleConfig();
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/55 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55 shadow-[0_10px_32px_-30px_hsl(var(--nmims-maroon)/0.5)]">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        {/* Left: Logo + Portal name */}
        <div className="flex items-center gap-3">
          <img
            src={nmimsLogo}
            alt="NMIMS Logo"
            className="h-8 w-auto"
          />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight text-foreground">NMIMS Hostel</p>
            <p className="text-xs text-muted-foreground">{label} Portal</p>
          </div>
        </div>

        {/* Right: User info + Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-background/65 border border-white/60 text-primary text-xs font-medium shadow-[0_10px_24px_-22px_hsl(var(--nmims-maroon)/0.55)] backdrop-blur">
              <RoleIcon className="w-3.5 h-3.5" />
              {label}
            </span>
            <span className="text-sm font-medium text-foreground hidden sm:inline">
              {profile?.full_name || 'User'}
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-transparent hover:border-white/60 hover:bg-background/60 transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-foreground" /> : <Moon className="h-4 w-4 text-foreground" />}
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/25"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
