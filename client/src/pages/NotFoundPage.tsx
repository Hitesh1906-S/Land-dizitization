import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ShieldAlert } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-center">
      <div className="glass-panel p-10 rounded-2xl border border-slate-800 max-w-md space-y-4">
        <ShieldAlert className="w-16 h-16 text-emerald-400 mx-auto" />
        <h1 className="text-3xl font-extrabold text-white">404 - Page Not Found</h1>
        <p className="text-sm text-slate-400">
          The requested page or cadastral registry parcel could not be located.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button size="md">Return to Safety</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
