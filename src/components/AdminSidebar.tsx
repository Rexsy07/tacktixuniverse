import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, Users, Wallet, Gamepad2, Trophy, 
  BarChart3, Bell, Settings, LogOut, Menu, Megaphone, DollarSign,
  BookOpen, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/admin", count: null },
    { icon: Users, label: "Users", href: "/admin/users", count: 1250 },
    { icon: Wallet, label: "Wallet", href: "/admin/wallet", count: 15 },
    { icon: Gamepad2, label: "Matches", href: "/admin/matches", count: 8 },
    { icon: Trophy, label: "Tournaments", href: "/admin/tournaments", count: 3 },
    { icon: BookOpen, label: "Blog", href: "/admin/blog", count: null },
    { icon: Star, label: "Creators", href: "/admin/creators", count: null },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics", count: null },
    { icon: Bell, label: "Notifications", href: "/admin/notifications", count: null },
    { icon: Megaphone, label: "Advertising", href: "/admin/advertise", count: null },
    { icon: DollarSign, label: "Payouts", href: "/admin/payouts", count: null },
    { icon: Settings, label: "Settings", href: "/admin/settings", count: null },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-background/95 backdrop-blur border-r border-border/50 transition-all duration-300 z-40",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        {!collapsed && (
          <Link to="/admin" className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Panel
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-muted"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground/70 hover:text-foreground hover:bg-muted",
                  collapsed && "justify-center"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.count && (
                      <Badge variant="secondary" className="text-xs">
                        {item.count}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 p-2">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground/70 hover:text-foreground hover:bg-muted transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Back to Site</span>}
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;