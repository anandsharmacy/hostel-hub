import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, ShieldCheck, Wrench, GraduationCap, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
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
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <RoleIcon className="w-3.5 h-3.5" />
              {label}
            </span>
            <span className="text-sm font-medium text-foreground hidden sm:inline">
              {profile?.full_name || 'User'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
