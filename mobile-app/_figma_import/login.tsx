import { useState } from 'react';
import { Briefcase, Lock, Mail, UserPlus, Building2 } from 'lucide-react';

type LoginProps = {
  onLogin: (email: string, password: string) => void;
  onNavigate: (view: 'login' | 'register' | 'jobs') => void;
};

export function Login({ onLogin, onNavigate }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex flex-col">
      {/* Header */}
      <div className="p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-8 h-8" />
          <h1 className="text-white">HR Manager</h1>
        </div>
        <p className="text-blue-100">Professional HR Management System</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-t-3xl p-6 mt-4">
        {/* Job Seekers Notice */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 mb-1">Looking for a Job?</h3>
              <p className="text-gray-600 text-sm mb-3">
                Browse our open positions and create your candidate account to apply.
              </p>
              <button
                onClick={() => onNavigate('jobs')}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm active:scale-95 transition-transform"
              >
                View Job Openings & Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* Employee Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-gray-900 text-sm mb-1">Current Employees</h3>
              <p className="text-gray-600 text-xs leading-relaxed">
                Use the credentials sent to your email by the administrator. If you haven't received your login details, please contact HR.
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <h2 className="text-gray-900 mb-2">Sign In</h2>
        <p className="text-gray-600 mb-6 text-sm">Access your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl active:scale-95 transition-transform"
          >
            Sign In
          </button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-700 mb-2">Demo Accounts for Testing:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p>• Admin: admin@company.com</p>
            <p>• Manager: manager@company.com</p>
            <p>• Employee: employee@company.com</p>
            <p>• Candidate: candidate@email.com</p>
            <p className="text-gray-500 mt-2">Password: any</p>
          </div>
        </div>
      </div>
    </div>
  );
}