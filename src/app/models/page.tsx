'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ModelCard from '@/components/ModelCard';
import { Search } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  image_url: string;
  gender: string;
  age_range: string;
  style_tags: string[];
  description: string;
  is_active: boolean;
  created_at: string;
}

interface License {
  model_id: string;
  expires_at: string;
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function fetchModels() {
      try {
        const { data: modelsData, error: modelsError } = await supabase
          .from('models')
          .select('*')
          .eq('is_active', true);

        if (modelsError) throw modelsError;

        const { data: licensesData, error: licensesError } = await supabase
          .from('licenses')
          .select('model_id, expires_at')
          .gt('expires_at', new Date().toISOString());

        if (licensesError) throw licensesError;

        setModels(modelsData || []);
        setLicenses(licensesData || []);
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchModels();
  }, [supabase]);

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = !genderFilter || model.gender === genderFilter;
    const matchesStyle =
      !styleFilter || (model.style_tags && model.style_tags.includes(styleFilter));

    return matchesSearch && matchesGender && matchesStyle;
  });

  const getModelAvailability = (modelId: string) => {
    return !licenses.some((lic) => lic.model_id === modelId);
  };

  const genders = Array.from(new Set(models.map((m) => m.gender)));
  const allStyles = Array.from(
    new Set(models.flatMap((m) => m.style_tags || []))
  );

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <p className="text-zinc-400">Loading models...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">Model Catalog</h1>
          <p className="text-zinc-400 text-lg">
            Browse and license AI-generated model identities
          </p>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 rounded-lg p-8 mb-12 border border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold mb-3">Search</label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-3 text-zinc-500"
                />
                <input
                  type="text"
                  placeholder="Model name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-800 text-white pl-10 pr-4 py-2 rounded border border-zinc-700 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-semibold mb-3">Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full bg-zinc-800 text-white px-4 py-2 rounded border border-zinc-700 focus:border-emerald-600 focus:outline-none"
              >
                <option value="">All Genders</option>
                {genders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>

            {/* Style Filter */|
            <div>
              <label className="block text-sm font-semibold mb-3">Style</label>
              <select
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
                className="w-full bg-zinc-800 text-white px-4 py-2 rounded border border-zinc-700 focus:border-emerald-600 focus:outline-none"
              >
                <option value="">All Styles</option>
                {allStyles.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <p className="text-sm text-zinc-400">
                {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={{
                ...model,
                is_available: getModelAvailability(model.id),
              }}
            />
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-lg">
              No models match your filters. Try adjusting your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
