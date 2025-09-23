import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, 
  X, 
  User, 
  Bell, 
  Wallet, 
  LogOut,
  Settings,
  Trophy,
  Shield,
  Gamepad2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { useMatches } from '@/hooks/useMatches';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const { wallet, loading: profileLoading } = useProfile();
  const { matches } = useMatches();
  const pendingNotifs = (matches || []).filter((m: any) => m.status === 'pending_result' || m.status === 'disputed').length;

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Games', href: '/games' },
    { name: 'Tournaments', href: '/tournaments' },
    { name: 'Leaderboards', href: '/leaderboards' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Support', href: '/support' },
  ];

  const base = (import.meta as any).env?.BASE_URL || '/';
  const logoSrc = `${base}IMG_9354-removebg-preview.png`;

const { maintenanceMode } = usePlatformSettings();

  return (
<header className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      {maintenanceMode && (
        <div className="w-full bg-warning text-warning-foreground text-center text-xs py-1">Maintenance mode is enabled</div>
      )}
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" to="/">
            <img src={logoSrc} alt="TacktixEdge" className="h-8 w-auto" />
            <span className="hidden font-bold sm:inline-block">TacktixEdge</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link className="inline-flex items-center space-x-2 md:hidden" to="/">
              <img src={logoSrc} alt="TacktixEdge" className="h-6 w-auto" />
              <span className="font-bold">TacktixEdge</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Dashboard Button */}
                <Button asChild variant="outline" className="hidden sm:inline-flex">
                  <Link to="/profile">Profile</Link>
                </Button>

                {/* Wallet Balance */}
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-md bg-muted">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {profileLoading ? '₦—' : `₦${(wallet?.balance || 0).toLocaleString()}`}
                  </span>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link to="/notifications">
                    <Bell className="h-4 w-4" />
                    {pendingNotifs > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs p-0 flex items-center justify-center">
                        {pendingNotifs}
                      </Badge>
                    )}
                  </Link>
                </Button>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wallet" className="flex items-center">
                        <Wallet className="mr-2 h-4 w-4" />
                        Wallet
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/matches" className="flex items-center">
                        <Trophy className="mr-2 h-4 w-4" />
                        My Matches
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="border-b bg-background md:hidden">
          <nav className="flex flex-col space-y-3 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/profile" className="block px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground">
                  Profile
                </Link>
                <Link to="/wallet" className="block px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground">
                  Wallet
                </Link>
                <Link to="/matches" className="block px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground">
                  My Matches
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="block px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground">
                    Admin Panel
                  </Link>
                )}
                <Link to="/settings" className="block px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground">
                  Settings
                </Link>
                <button 
                  onClick={signOut}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-accent"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-muted-foreground hover:text-foreground">
                  Login
                </Link>
                <Link to="/signup" className="block text-muted-foreground hover:text-foreground">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}