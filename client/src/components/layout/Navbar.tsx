import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Menu, LogOut, User as UserIcon, MapPin, Layers, Search, Bell, ChevronDown } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface NavbarProps {
  onToggleMobileDrawer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileDrawer }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-gov-sm">
      {/* Top Official Gov Ribbon */}
      <div className="bg-govnavy-950 text-slate-300 text-[11px] py-1 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-govnavy-900">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-govgreen-500 inline-block" />
          <span className="font-semibold text-white tracking-wide">Government Digital Service</span>
          <span className="hidden sm:inline text-slate-400">• Smart India Hackathon Production Service</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="hidden md:inline">Language: English (हिन्दी)</span>
          <Link to="/map" className="hover:text-white transition-colors">
            Cadastral GIS
          </Link>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Mobile Drawer Hamburger Button */}
          <button
            type="button"
            onClick={onToggleMobileDrawer}
            className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-govnavy-900"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-md bg-govnavy-900 text-white flex items-center justify-center shadow-gov-sm border border-govnavy-800">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg text-govnavy-900 tracking-tight leading-none">
                Bhoomi<span className="text-govblue-600">Setu</span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                Land Record Digitization & Validation
              </div>
            </div>
          </Link>
        </div>

        {/* Global Links on Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/records"
            className="text-sm font-semibold text-slate-600 hover:text-govnavy-900 transition-colors flex items-center gap-1.5"
          >
            <Search className="w-4 h-4 text-slate-500" />
            Registry Directory
          </Link>
          <Link
            to="/map"
            className="text-sm font-semibold text-slate-600 hover:text-govnavy-900 transition-colors flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4 text-slate-500" />
            Cadastral GIS
          </Link>
        </nav>

        {/* User Auth and Profile Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-govnavy-900 text-white flex items-center justify-center text-xs font-bold shadow-gov-sm">
                  {user.fullName.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] font-semibold text-govblue-700 uppercase tracking-wide">
                    {user.role.replace(/_/g, ' ')}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-gov-lg border border-slate-200 py-1.5 z-50 text-xs text-slate-700">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1.5">
                        <Badge variant="navy" size="sm">
                          {user.role.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>

                    <Link
                      to={
                        user.role === 'ADMIN'
                          ? '/admin/dashboard'
                          : user.role === 'REVENUE_OFFICER'
                          ? '/officer/dashboard'
                          : '/citizen/dashboard'
                      }
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-3.5 py-2 hover:bg-slate-50 text-slate-800 font-medium"
                    >
                      My Dashboard
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-govred-50 text-govred-700 font-medium flex items-center gap-2 border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="secondary" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" className="hidden sm:inline-block">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
