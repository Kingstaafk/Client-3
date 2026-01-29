import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#1A1A1A] text-white" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] rounded-full flex items-center justify-center">
                <span className="text-white font-serif font-bold text-xl">L</span>
              </div>
              <span className="text-2xl font-serif font-medium">Luxe Jewels</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Discover timeless elegance with our exclusive collection of handcrafted jewellery.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors" data-testid="social-facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors" data-testid="social-instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors" data-testid="social-twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-serif mb-4 text-[#D4AF37]">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/products?subcategory=gold" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                  Gold Collection
                </Link>
              </li>
              <li>
                <Link to="/products?subcategory=diamond" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                  Diamond Collection
                </Link>
              </li>
              <li>
                <Link to="/sell" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                  Sell Jewellery
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-serif mb-4 text-[#D4AF37]">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                  Shipping Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                  Return Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-serif mb-4 text-[#D4AF37]">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">
                  123 Jewellery Street, Mumbai, Maharashtra 400001
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-[#D4AF37] flex-shrink-0" />
                <span className="text-sm text-gray-400">+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-[#D4AF37] flex-shrink-0" />
                <span className="text-sm text-gray-400">support@luxejewels.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-gray-400 text-center md:text-left">
            © {new Date().getFullYear()} Luxe Jewels. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-6">
            <a href="#" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;