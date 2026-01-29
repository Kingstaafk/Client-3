import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingCart, User, Menu, X, Heart, LogOut, Sparkles, Gem, CircleDollarSign, Home, ShoppingBag } from "lucide-react";
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
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch cart count
  useEffect(() => {
    const fetchCartCount = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
          const response = await fetch(`${BACKEND_URL}/api/cart`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setCartCount(data.length);
          }
        } catch (error) {
          console.error("Failed to fetch cart count:", error);
        }
      }
    };
    fetchCartCount();
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setMobileMenuOpen(false);
      setSearchQuery("");
    }
  };

  const menuSections = [
    {
      title: "Shop",
      items: [
        { label: "Home", path: "/", icon: Home },
        { label: "All Products", path: "/products", icon: ShoppingBag },
      ]
    },
    {
      title: "Collections",
      items: [
        { label: "Gold Collection", path: "/products?subcategory=gold", icon: Sparkles },
        { label: "Diamond Collection", path: "/products?subcategory=diamond", icon: Gem },
        { label: "Silver Collection", path: "/products?subcategory=silver", icon: CircleDollarSign },
      ]
    },
    {
      title: "Services",
      items: [
        { label: "Sell Jewellery", path: "/sell", icon: CircleDollarSign },
      ]
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E5] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between md:justify-start h-16 md:h-20">
            {/* Mobile: Hamburger on Left */}
            <button
              className="md:hidden p-2 -ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              <Menu className="h-6 w-6 text-[#1A1A1A]" />
            </button>

            {/* Logo - Centered on Mobile, Left on Desktop */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 absolute left-1/2 -translate-x-1/2 md:relative md:left-auto md:translate-x-0" 
              data-testid="logo-link"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] rounded-full flex items-center justify-center">
                <span className="text-white font-serif font-bold text-lg md:text-xl">L</span>
              </div>
              <span className="text-xl md:text-2xl font-serif font-medium text-[#1A1A1A]">Luxe Jewels</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8 ml-auto">
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
            <div className="flex items-center space-x-2 md:space-x-4 md:ml-8">
              {/* Wishlist/Saved Items */}
              {user && (
                <Link to="/dashboard" data-testid="wishlist-link">
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10 hidden sm:flex">
                    <Heart className="h-5 w-5 text-[#1A1A1A]" />
                  </Button>
                </Link>
              )}
              
              {/* Cart with Badge */}
              <Link to="/cart" data-testid="cart-link">
                <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10">
                  <ShoppingCart className="h-5 w-5 text-[#1A1A1A]" />
                  {cartCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 bg-[#D4AF37] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                      data-testid="cart-count-badge"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10" data-testid="user-menu-trigger">
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
                <Link to="/login" className="hidden md:block">
                  <Button
                    className="bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full px-6 py-2 uppercase tracking-widest text-xs font-bold"
                    data-testid="login-button"
                  >
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
          data-testid="mobile-menu-overlay"
        />
      )}

      {/* Mobile Sidebar Menu */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="mobile-menu"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#E5E5E5]">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] rounded-full flex items-center justify-center">
                <span className="text-white font-serif font-bold text-xl">L</span>
              </div>
              <span className="text-xl font-serif font-medium text-[#1A1A1A]">Luxe Jewels</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-[#F9F9F7] rounded-full transition-colors"
              data-testid="mobile-menu-close"
            >
              <X className="h-6 w-6 text-[#1A1A1A]" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            {/* Search Bar */}
            <div className="px-4 mb-6">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-[#F9F9F7] border border-transparent focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-lg text-sm transition-all"
                  data-testid="sidebar-search-input"
                />
                <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </form>
            </div>

            {/* Grouped Menu Sections */}
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-6">
                <h3 className="px-7 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h3>
                <div className="space-y-1 px-3">
                  {section.items.map((item, index) => (
                    <Link
                      key={index}
                      to={item.path}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-[#1A1A1A] hover:bg-[#F9F9F7] hover:text-[#D4AF37] transition-all duration-200 group"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`mobile-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className="h-5 w-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-[#E5E5E5] p-4 space-y-3">
            {user ? (
              <>
                <div className="px-4 py-2 bg-[#F9F9F7] rounded-lg">
                  <p className="text-sm font-medium text-[#1A1A1A]">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={user.role === "admin" ? "/admin" : "/dashboard"}
                    className="flex flex-col items-center justify-center px-3 py-3 rounded-lg bg-[#F9F9F7] hover:bg-[#D4AF37] hover:text-white transition-colors group"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="sidebar-dashboard-button"
                  >
                    <User className="h-5 w-5 mb-1 text-[#D4AF37] group-hover:text-white" />
                    <span className="text-xs font-medium">Dashboard</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex flex-col items-center justify-center px-3 py-3 rounded-lg bg-[#F9F9F7] hover:bg-[#D4AF37] hover:text-white transition-colors group"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="sidebar-wishlist-button"
                  >
                    <Heart className="h-5 w-5 mb-1 text-[#D4AF37] group-hover:text-white" />
                    <span className="text-xs font-medium">Wishlist</span>
                  </Link>
                </div>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-[#1A1A1A] hover:bg-red-50 hover:text-red-600 transition-colors w-full"
                  data-testid="mobile-logout-button"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  className="w-full bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full py-3 uppercase tracking-widest text-xs font-bold"
                  data-testid="mobile-login-button"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;