'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Clock, LogOut } from 'lucide-react';

interface License {
  id: string;
  model_id: string;
  starts_at: string;
  expires_at: string;
  duration_days: number;
  model: {
    id: string;
    name: string;
    image_url: string;
    gender: string;
  };
}

export default function DashboardPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push('/login');
          return;
        }

        setUser(currentUser);

        const { data: licensesData, error } = await supabase
          .from('licenses')
          .select('*, model:models(*)')
          .eq('user_id', currentUser.id)
          .gt('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: true });

        if (error) throw error;
        setLicenses(licensesData || []);
      } catch (error) {
        console.error('Error fetching licenses:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const calculateProgress = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const totalMs = expiry.getTime() - new Date(expiresAt).getTime() + (now.getTime() - new Date(expiresAt).getTime());
    const remainingMs = expiry.getTime() - now.getTime();
    const progress = Math.max(0, (remainingMs / totalMs) * 100);
    return progress;
  };

  const daysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-bold mb-2">Dashboard</h1>
            <p className="text-zinc-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2 border border-zinc-700 hover:bg-zinc-900 text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mb-12 border-b border-zinc-800">
          <Link
            href="/dashboard"
            className="px-4 py-3 font-semibold border-b-2 border-emerald-600 text-white"
          >
            Active Licenses
          </Link>
          <Link
            href="/dashboard/pools"
            className="px-4 py-3 font-semibold border-b-2 border-transparent text-zinc-400 hover:text-white"
          >
            Pools
          </Link>
        </div>

        {/* Licenses Grid */}
        {licenses.length === 0 ? (
          <div className="bg-zinc-900 rounded-lg p-12 text-center border border-zinc-800">
            <p className="text-zinc-400 mb-6">No active licenses yet</p>
            <Link
              href="/models"
              className="inline-block px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
            >
              Browse Models
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {licenses.map((license) => (
              <div
                key={license.id}
                className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                {/* Image */}
                <div className="relative w-full aspect-[3/4] bg-zinc-800 overflow-hidden">
                  <img
                    src={license.model.image_url}
                    alt={license.model.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{license.model.name}</h3>
                  <p className="text-zinc-500 text-sm mb-4">{license.model.id}</p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-400">Time Remaining</span>
                      <span className="text-sm font-semibold">
                        {daysRemaining(license.expires_at)} days
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all"
                        style={{ width: `${calculateProgress(license.expires_at)}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-zinc-500 space-y-1">
                    <div>
                      Expires: {new Date(license.expires_at).toLocaleDateString()}
                    </div>
                    <div>Duration: {license.duration_days} days</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
