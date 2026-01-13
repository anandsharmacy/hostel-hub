import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'student':
        return 'Student Portal';
      case 'admin':
        return 'Administration Portal';
      case 'vendor':
        return 'Store Vendor Portal';
      default:
        return '';
    }
  };

  return (
    <header className="bg-header text-header-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-header-foreground/10 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold">N</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold leading-tight">NMIMS Hyderabad</h1>
                <p className="text-xs text-header-foreground/80">Hostel Services</p>
              </div>
            </div>
          </div>

          {/* Role Badge - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <span className="px-3 py-1 bg-header-foreground/10 rounded-full text-sm font-medium">
              {getRoleLabel()}
            </span>
          </div>

          {/* User Info and Logout - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-header-foreground/80">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-header-foreground hover:bg-header-foreground/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-header-foreground/10 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-header-foreground/20 animate-slide-up">
            <div className="space-y-4">
              <div className="px-2">
                <span className="px-3 py-1 bg-header-foreground/10 rounded-full text-sm font-medium">
                  {getRoleLabel()}
                </span>
              </div>
              <div className="px-2">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-header-foreground/80">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-header-foreground hover:bg-header-foreground/10 w-full justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
