import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
      <Card className="p-8 sm:p-10 max-w-md w-full space-y-4 border-slate-300 shadow-gov-md">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-govnavy-900 mx-auto border border-slate-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">404 - Page Not Found</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested page URL or cadastral parcel record could not be found on the government portal.
        </p>
        <div className="pt-3">
          <Link to="/">
            <Button size="md" variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Public Portal
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
