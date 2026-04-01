'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Heart, AlertCircle } from 'lucide-react';

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
  is_favorited: boolean;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const supabase = createClient();

  const [poolName, setPoolName] = useState('');
  const [models, setModels] = useState<PoolModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('muse_session_id');
      if (existing) return existing;
      const newId = crypto.randomUUID();
      localStorage.setItem('muse_session_id', newId);
      return newId;
    }
    return crypto.randomUUID();
  });

  useEffect(() => {
    async function fetchPoolData() {
      try {
        // Find pool by share token
        const { data: pool, error: poolError } = await supabase
          .from('pools')
          .select('*')
          .eq('share_token', token)
          .single();

        if (poolError) throw new Error('Pool not found');

        setPoolName(pool.name);

        // Fetch models in pool
        const { data: poolModels, error: poolModelsError } = await supabase
          .from('pool_models')
          .select('model_id')
          .eq('pool_id', pool.id);

        if (poolModelsError) throw poolModelsError;

        const modelIds = poolModels?.map((pm) => pm.model_id) || [];

        if (modelIds.length === 0) {
          setModels([]);
          setLoading(false);
          return;
        }

        // Fetch model details
        const { data: modelDetails, error: modelsError } = await supabase
          .from('models')
          .select('*')
          .in('id', modelIds);

        if (modelsError) throw modelsError;

        // Fetch favorites for this session
        const { data: favorites, error: favError } = await supabase
          .from('pool_favorites')
          .select('model_id')
          .eq('pool_id', pool.id)
          .eq('session_id', sessionId);

        if (favError) throw favError;

        const favoriteIds = new Set(favorites?.map((f) => f.model_id) || []);

        const modelsWithFavorites = (modelDetails || []).map((model) => ({
          ...model,
          is_favorited: favoriteIds.has(model.id),
        }));

        setModels(modelsWithFavorites);
      } catch (error: any) {
        console.error('Error fetching pool:', error);
        setError(error.message || 'Failed to load pool');
      } finally {
        setLoading(false);
      }
    }

    fetchPoolData();
  }, [token, sessionId, supabase]);

  const handleFavorite = async (modelId: string, isFavorited: boolean) => {
    try {
      const { data: pool } = await supabase
        .from('pools')
        .select('id')
        .eq('share_token', token)
        .single();

      if (!pool) return;

      if (isFavorited) {
        // Remove favorite
        const { error: deleteError } = await supabase
          .from('pool_favorites')
          .delete()
          .eq('pool_id', pool.id)
          .eq('model_id', modelId)
          .eq('session_id', sessionId);

        if (deleteError) throw deleteError;
      } else {
        // Add favorite
        const { error: insertError } = await supabase
          .from('pool_favorites')
          .insert({
            pool_id: pool.id,
            model_id: modelId,
            session_id: sessionId,
          });

        if (insertError) throw insertError;
      }

      const updated = models.map((m) =>
        m.id === modelId ? { ...m, is_favorited: !m.is_favorited } : m
      );
      setModels(updated);
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const favoritedCount = models.filter((m) => m.is_favorited).length;

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <p className="text-zinc-400">Loading pool...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <div className="bg-red-600/20 text-red-400 p-6 rounded-lg flex items-start gap-3 max-w-md">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 bg-[#0a0a0a]">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-2">{poolName}</h1>
          <p className="text-zinc-400">
            A curated selection of AI models for your review
          </p>
        </div>

        {/* Favorites Bar */}
        {models.length > 0 && (
          <div className="bg-zinc-900 rounded-lg p-6 mb-12 border border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Your Selections</p>
                <p className="text-2xl font-bold">
                  {favoritedCount} model{favoritedCount !== 1 ? 's' : ''}
                </p>
              </div>
              <Heart
                size={32}
                className={`transition-colors ${
                  favoritedCount > 0 ? 'fill-red-600 text-red-600' : 'text-zinc-600'
                }`}
              />
            </div>
          </div>
        )}

        {/* Models Grid */}
        {models.length === 0 ? (
          <div className="bg-zinc-900 rounded-lg p-12 text-center border border-zinc-800">
            <p className="text-zinc-400">This pool has no models yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {models.map((model) => (
              <div
                key={model.id}
                className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors group"
              >
                {/* Image */}
                <div className="relative w-full aspect-[3/4] bg-zinc-800 overflow-hidden">
                  <img
                    src={model.image_url}
                    alt={model.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <button
                    onClick={() => handleFavorite(model.id, model.is_favorited)}
                    className="absolute top-4 right-4 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all backdrop-blur-sm"
                    aria-label={
                      model.is_favorited ? 'Remove from favorites' : 'Add to favorites'
                    }
                  >
                    <Heart
                      size={24}
                      className={`transition-all ${
                        model.is_favorited ? 'fill-red-600 text-red-600' : 'text-white'
                      }`}
                    />
                  </button>
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{model.name}</h3>
                  <p className="text-zinc-500 text-sm mb-4">{model.id}</p>

                  <p className="text-zinc-300 text-sm mb-4 line-clamp-2">
                    {model.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-zinc-800 p-3 rounded text-center">
                      <p className="text-xs text-zinc-500">Gender</p>
                      <p className="text-sm font-semibold">{model.gender}</p>
                    </div>
                    <div className="bg-zinc-800 p-3 rounded text-center">
                      <p className="text-xs text-zinc-500">Age</p>
                      <p className="text-sm font-semibold">{model.age_range}</p>
                    </div>
                  </div>

                  {model.style_tags && model.style_tags.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">Styles</p>
                      <div className="flex flex-wrap gap-2">
                        {model.style_tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
