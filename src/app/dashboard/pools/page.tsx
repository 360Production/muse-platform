'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Copy, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

interface Pool {
  id: string;
  name: string;
  share_token: string;
  created_at: string;
  model_count: number;
}

export default function PoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchPools() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push('/login');
          return;
        }

        setUser(currentUser);

        const { data: poolsData, error: poolsError } = await supabase
          .from('pools')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (poolsError) throw poolsError;

        // Get model counts for each pool
        if (poolsData) {
          const poolsWithCounts = await Promise.all(
            poolsData.map(async (pool) => {
              const { count, error: countError } = await supabase
                .from('pool_models')
                .select('*', { count: 'exact', head: true })
                .eq('pool_id', pool.id);

              return {
                ...pool,
                model_count: count || 0,
              };
            })
          );
          setPools(poolsWithCounts);
        }
      } catch (error) {
        console.error('Error fetching pools:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPools();
  }, [supabase, router]);

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    setSuccess('');

    if (!newPoolName.trim()) {
      setError('Pool name is required');
      setIsCreating(false);
      return;
    }

    try {
      const { data: newPool, error: createError } = await supabase
        .from('pools')
        .insert({
          user_id: user.id,
          name: newPoolName,
          share_token: crypto.randomUUID(),
        })
        .select()
        .single();

      if (createError) throw createError;

      setPools([{ ...newPool, model_count: 0 }, ...pools]);
      setNewPoolName('');
      setShowCreateForm(false);
      setSuccess('Pool created successfully!');

      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to create pool');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePool = async (poolId: string) => {
    if (!confirm('Are you sure you want to delete this pool?')) return;

    try {
      // Delete pool models first
      await supabase.from('pool_models').delete().eq('pool_id', poolId);

      // Delete pool
      const { error: deleteError } = await supabase
        .from('pools')
        .delete()
        .eq('id', poolId);

      if (deleteError) throw deleteError;

      setPools(pools.filter((p) => p.id !== poolId));
      setSuccess('Pool deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting pool:', error);
      setError('Failed to delete pool');
    }
  };

  const handleCopyToken = (token: string) => {
    const shareUrl = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
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
            <h1 className="text-5xl font-bold mb-2">Curated Pools</h1>
            <p className="text-zinc-400">Share model selections with clients</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus size={20} />
            New Pool
          </button>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mb-12 border-b border-zinc-800">
          <Link
            href="/dashboard"
            className="px-4 py-3 font-semibold border-b-2 border-transparent text-zinc-400 hover:text-white"
          >
            Active Licenses
          </Link>
          <Link
            href="/dashboard/pools"
            className="px-4 py-3 font-semibold border-b-2 border-emerald-600 text-white"
          >
            Pools
          </Link>
        </div>

        {/* Create Pool Form */}
        {showCreateForm && (
          <div className="bg-zinc-900 rounded-lg p-8 mb-12 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-6">Create New Pool</h2>
            <form onSubmit={handleCreatePool} className="space-y-6">
              <div>
                <label htmlFor="poolName" className="block text-sm font-semibold mb-2">
                  Pool Name
                </label>
                <input
                  id="poolName"
                  type="text"
                  value={newPoolName}
                  onChange={(e) => setNewPoolName(e.target.value)}
                  placeholder="e.g., Summer Campaign 2024"
                  className="w-full px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {error && (
                <div className="bg-red-600/20 text-red-400 p-4 rounded-lg flex items-start gap-3">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create Pool'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 border border-zinc-700 hover:bg-zinc-900 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {success && (
          <div className="bg-emerald-600/20 text-emerald-400 p-4 rounded-lg flex items-start gap-3 mb-8">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        {/* Pools List */}
        {pools.length === 0 ? (
          <div className="bg-zinc-900 rounded-lg p-12 text-center border border-zinc-800">
            <p className="text-zinc-400 mb-6">No pools yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pools.map((pool) => (
              <div
                key={pool.id}
                className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/pools/${pool.id}`}
                      className="text-xl font-bold hover:text-emerald-400 transition-colors"
                    >
                      {pool.name}
                    </Link>
                    <p className="text-sm text-zinc-500 mt-1">
                      {pool.model_count} model{pool.model_count !== 1 ? 's' : ''} * Created{' '}
                      {new Date(pool.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleCopyToken(pool.share_token)}
                      className="flex items-center gap-2 px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-white rounded-lg transition-colors"
                      title="Copy share link"
                    >
                      <Copy size={18} />
                      {copiedToken === pool.share_token ? 'Copied!' : 'Share'}
                    </button>

                    <button
                      onClick={() => handleDeletePool(pool.id)}
                      className="flex items-center gap-2 px-4 py-2 border border-red-900 hover:bg-red-900/20 text-red-400 rounded-lg transition-colors"
                      title="Delete pool"
                    >
                      <Trash2 size={18} />
                    </button>
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
