/**
 * Login page component
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mail, Lock, LogIn } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border-2 border-[#CBA0F5]">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#6A0DAD] to-[#8B2DC2] rounded-lg flex items-center justify-center">
            <LogIn className="w-6 h-6 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-[#6A0DAD] mb-2">GaavConnect</h1>
        <p className="text-center text-gray-600 mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#6A0DAD] to-[#8B2DC2] text-white hover:opacity-90"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-4">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="text-[#6A0DAD] hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </Card>
    </div>
  );
}
