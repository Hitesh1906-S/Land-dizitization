import React, { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { X, Shield, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@land-digitization/shared';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navigationItems: {
    section: string;
    items: { name: string; path: string; icon: React.ComponentType<{ className?: string }> }[];
  }[];
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, navigationItems }) => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-gov-lg flex flex-col justify-between z-10">
        <div>
          {/* Header */}
          <div className="h-16 px-4 bg-govnavy-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="font-bold text-base tracking-tight">
                Bhoomi<span className="text-govblue-300">Setu</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card on mobile */}
          {user && (
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-govnavy-900 text-white flex items-center justify-center text-xs font-bold">
                  {user.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="mt-2.5">
                <Badge variant="navy" size="sm">
                  {user.role.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-14rem)]">
            {navigationItems.map((group) => (
              <div key={group.section}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                  {group.section}
                </p>
                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors ${
                            isActive
                              ? 'bg-govnavy-900 text-white shadow-gov-sm'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          {user ? (
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start text-govred-700 hover:text-govred-800 hover:bg-govred-50 border-govred-200"
              onClick={() => {
                logout();
                onClose();
              }}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out of Session
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/login" onClick={onClose}>
                <Button variant="secondary" size="sm" className="w-full">
                  Login
                </Button>
              </Link>
              <Link to="/register" onClick={onClose}>
                <Button variant="primary" size="sm" className="w-full">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
