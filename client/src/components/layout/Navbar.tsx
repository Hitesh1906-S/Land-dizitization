import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Menu, LogOut, User as UserIcon, MapPin, Layers, Search, Bell, ChevronDown, Sparkles, Scan, FileText } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Official Gov Ribbon */}
      <div className="bg-govnavy-950 text-slate-300 text-[11px] py-1 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-govnavy-900">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-xs animate-pulse" />
          <span className="font-semibold text-white tracking-wide">Government of India • Land Records Mission</span>
          <span className="hidden sm:inline text-slate-400">• Smart India Hackathon Live Production</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <Link to="/ocr-scanner" className="text-amber-300 hover:text-white transition-colors flex items-center gap-1 font-bold">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" /> AI OCR Live
          </Link>
          <span className="hidden md:inline text-slate-400">|</span>
          <Link to="/map" className="text-blue-400 hover:text-white transition-colors flex items-center gap-1 font-semibold">
            <MapPin className="w-3 h-3" /> Cadastral GIS
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
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo Brand with Rich Gradient Glow */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-govnavy-900 via-govnavy-950 to-blue-900 text-white flex items-center justify-center shadow-md shadow-govnavy-900/20 border border-blue-500/30 group-hover:scale-105 transition-transform duration-200">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-black text-xl text-slate-900 tracking-tight leading-none font-display">
                Bhoomi<span className="text-blue-600">Setu</span>
              </div>
              <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-0.5">
                Land Record Digitization & Validation
              </div>
            </div>
          </Link>
        </div>

        {/* Global Links on Desktop */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            to="/ocr-scanner"
            className="text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs group"
          >
            <Sparkles className="w-4 h-4 text-blue-600 group-hover:rotate-12 transition-transform" />
            <span>AI OCR Scanner</span>
            <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
              LIVE
            </span>
          </Link>
          <Link
            to="/records"
            className="text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            Registry Directory
          </Link>
          <Link
            to="/map"
            className="text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            Cadastral GIS Map
          </Link>
        </nav>

        {/* User Auth and Profile Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-all border border-slate-200/80 bg-slate-50/50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-govnavy-900 to-blue-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user.fullName.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
                    {user.role.replace(/_/g, ' ')}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu with Glassmorphism */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white/95 backdrop-blur-xl shadow-xl border border-slate-200 py-2 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="font-bold text-slate-900 text-sm">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                      <div className="mt-2">
                        <Badge variant="navy" size="sm">
                          {user.role.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={
                          user.role === 'ADMIN'
                            ? '/admin/dashboard'
                            : user.role === 'REVENUE_OFFICER'
                            ? '/officer/dashboard'
                            : '/citizen/dashboard'
                        }
                        onClick={() => setProfileDropdownOpen(false)}
                        className="block px-4 py-2 hover:bg-blue-50 text-slate-800 font-semibold transition-colors"
                      >
                        My Dashboard
                      </Link>
                      <Link
                        to="/records"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="block px-4 py-2 hover:bg-blue-50 text-slate-800 font-medium transition-colors"
                      >
                        Public Land Directory
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-semibold flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="secondary" size="sm" className="font-bold shadow-xs">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" className="hidden sm:inline-block">
                <Button variant="primary" size="sm" className="bg-govnavy-900 hover:bg-govnavy-950 font-bold shadow-sm">
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
