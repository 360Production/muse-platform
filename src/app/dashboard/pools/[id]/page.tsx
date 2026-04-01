'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  image_url: string;
  gender: string;
  age_range: string;
  style_tags: string[];
  description: string;
  is_active: boolean;
}

interface PoolModel extends Model {
  in_pool: boolean;
}

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const poolId = params.id as string;
  const supabase = createClient();

  const [poolName, setPoolName] = useState('');
  const [allModels, setAllModels] = useState<PoolModel[]>([]);
  const [poolModels, setPoolModels] = useState<PoolModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'in' | 'add'>('in');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch pool
        const { data: pool, error: poolError } = await supabase
          .from('pools')
          .select('*')
          .eq('id', poolId)
          .eq('user_id', user.id)
          .single();

        if (poolError) throw poolError;
        setPoolName(pool.name);

        // Fetch all models
        const { data: models, error: modelsError } = await supabase
          .from('models')
          .select('*')
          .eq('is_active', true);

        if (modelsError) throw modelsError;

        // Fetch pool models
        const { data: poolModelData, error: poolModelsError } = await supabase
          .from('pool_models')
          .select('model_id')
          .eq('pool_id', poolId);

        if (poolModelsError) throw poolModelsError;

        const poolModelIds = new Set(poolModelData?.map((pm) => pm.model_id) || []);
        const modelsWithPoolStatus = (models || []).map((model) => ({
          ...model,
          in_pool: poolModelIds.has(model.id),
        }));

        setAllModels(modelsWithPoolStatus);
        setPoolModels(modelsWithPoolStatus.filter((m) => m.in_pool));
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load pool');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [poolId, supabase, router]);

  const handleAddModel = async (modelId: string) => {
    try {
      const { error: addError } = await supabase.from('pool_models').insert({
        pool_id: poolId,
        model_id: modelId,
      });

      if (addError) throw addError;

      const updated = allModels.map((m) =>
        m.id === modelId ? { ...m, in_pool: true } : m
      );
      setAllModels(updated);
      setPoolModels(updated.filter((m) => m.in_pool));
      setSuccess('Model added to pool');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding model:', error);
      setError('Failed to add model');
    }
  };

  const handleRemoveModel = async (modelId: string) => {
    try {
      const { error: removeError } = await supabase
        .from('pool_models')
        .delete()
        .eq('pool_id', poolId)
        .eq('model_id', modelId);

      if (removeError) throw removeError;

      const updated = allModels.map((m) =>
        m.id === modelId ? { ...m, in_pool: false } : m
      );
      setAllModels(updated);
      setPoolModels(updated.filter((m) => m.in_pool));
      setSuccess('Model removed from pool');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error removing model:', error);
      setError('Failed to remove model');
    }
  };

  const filteredAddModels = allModels
    .filter((m) => !m.in_pool)
    .filter(
      (m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        <Link
          href="/dashboard/pools"
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-8"
        >
          <ArrowLeft size={20} /> Back to Pools
        </Link>

        <h1 className="text-4xl font-bold mb-12">{poolName}</h1>

        {error && (
          <div className="bg-red-600/20 text-red-400 p-4 rounded-lg flex items-start gap-3 mb-8">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-600/20 text-emerald-400 p-4 rounded-lg flex items-start gap-3 mb-8">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-12 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('in')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'in'
                ? 'border-emerald-600 text-white'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            In Pool ({poolModels.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'add'
                ? 'border-emerald-600 text-white'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Add Models ({allModels.filter((m) => !m.in_pool).length})
          </button>
        </div>

        {/* In Pool Tab */}
        {activeTab === 'in' && (
          <div>
            {poolModels.length === 0 ? (
              <div className="bg-zinc-900 rounded-lg p-12 text-center border border-zinc-800">
                <p className="text-zinc-400 mb-6">No models in this pool yet</p>
                <button
                  onClick={() => setActiveTab('add')}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                >
                  <Plus size={20} />
                  Add Models
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {poolModels.map((model) => (
                  <div
                    key={model.id}
                    className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <div className="relative w-full aspect-[3/4] bg-zinc-800 overflow-hidden">
                      <img
                        src={model.image_url}
                        alt={model.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveModel(model.id)}
                        className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-bold">{model.name}</h3>
                      <p className="text-sm text-zinc-500">{model.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Models Tab */}
        {activeTab === 'add' && (
          <div>
            <div className="mb-8">
              <input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 text-white border border-zinc-700 rounded-lg focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {filteredAddModels.length === 0 ? (
              <div className="bg-zinc-900 rounded-lg p-12 text-center border border-zinc-800">
                <p className="text-zinc-400">
                  {allModels.filter((m) => !m.in_pool).length === 0
                    ? 'All models are in this pool!'
                    : 'No models match your search'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAddModels.map((model) => (
                  <div
                    key={model.id}
                    className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <div className="relative w-full aspect-[3/4] bg-zinc-800 overflow-hidden">
                      <img
                        src={model.image_url}
                        alt={model.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-bold mb-4">{model.name}</h3>
                      <button
                        onClick={() => handleAddModel(model.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        <Plus size={20} />
                        Add to Pool
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
