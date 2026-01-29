import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingCart, User, Menu, X, Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E5] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" data-testid="logo-link">
            <div className="w-10 h-10 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] rounded-full flex items-center justify-center">
              <span className="text-white font-serif font-bold text-xl">L</span>
            </div>
            <span className="text-2xl font-serif font-medium text-[#1A1A1A]">Luxe Jewels</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/products?subcategory=gold"
              className="text-[#1A1A1A] hover:text-[#D4AF37] transition-colors duration-200 uppercase tracking-wide text-xs font-bold"
              data-testid="nav-gold"
            >
              Gold
            </Link>
            <Link
              to="/products?subcategory=diamond"
              className="text-[#1A1A1A] hover:text-[#D4AF37] transition-colors duration-200 uppercase tracking-wide text-xs font-bold"
              data-testid="nav-diamond"
            >
              Diamond
            </Link>
            <Link
              to="/products?subcategory=silver"
              className="text-[#1A1A1A] hover:text-[#D4AF37] transition-colors duration-200 uppercase tracking-wide text-xs font-bold"
              data-testid="nav-silver"
            >
              Silver
            </Link>
            <Link
              to="/sell"
              className="text-[#1A1A1A] hover:text-[#D4AF37] transition-colors duration-200 uppercase tracking-wide text-xs font-bold"
              data-testid="nav-sell"
            >
              Sell Jewellery
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <Link to="/cart" data-testid="cart-link">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5 text-[#1A1A1A]" />
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="user-menu-trigger">
                    <User className="h-5 w-5 text-[#1A1A1A]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium text-[#1A1A1A]">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {user.role === "admin" ? (
                    <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="admin-dashboard-link">
                      Admin Dashboard
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => navigate("/dashboard")} data-testid="customer-dashboard-link">
                      My Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button
                  className="bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full px-6 py-2 uppercase tracking-widest text-xs font-bold"
                  data-testid="login-button"
                >
                  Login
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-[#1A1A1A]" />
              ) : (
                <Menu className="h-6 w-6 text-[#1A1A1A]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[#E5E5E5]" data-testid="mobile-menu">
            <div className="flex flex-col space-y-4">
              <Link
                to="/products?subcategory=gold"
                className="text-[#1A1A1A] hover:text-[#D4AF37] transition-colors duration-200 uppercase tracking-wide text-xs font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Gold
              </Link>
              <Link
                to="/products?subcategory=diamond"
                className="text-[#1A1A1A] hover:text-[#D4AF37] transition-colors duration-200 uppercase tracking-wide text-xs font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Diamond
              </Link>
              <Link
                to="/products?subcategory=silver"
                className="text-[#1A1A1A] hover:text-[#D4AF37] transition-colors duration-200 uppercase tracking-wide text-xs font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Silver
              </Link>
              <Link
                to="/sell"
                className="text-[#1A1A1A] hover:text-[#D4AF37] transition-colors duration-200 uppercase tracking-wide text-xs font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sell Jewellery
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;