import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import nmimsLogo from '@/assets/nmims-logo.png';

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

  const navLinks = [
    { label: 'About', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Instructions', href: '#' },
    { label: 'Hostel Rules', href: '#' },
  ];

  return (
    <header className="nmims-header text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={nmimsLogo} 
              alt="NMIMS Logo" 
              className="h-8 w-auto brightness-0 invert"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-tight">NMIMS Hyderabad</p>
              <p className="text-xs opacity-80">Hostel Services</p>
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-6">
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

          {/* Role Badge and User Info - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">
              {getRoleLabel()}
            </span>
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs opacity-80">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-white/10 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20 animate-slide-up">
            <div className="space-y-4">
              <div className="px-2">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">
                  {getRoleLabel()}
                </span>
              </div>
              <div className="px-2">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs opacity-80">{user?.email}</p>
              </div>
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="px-2 py-2 text-sm hover:bg-white/10 rounded"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-white/10 w-full justify-start"
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
