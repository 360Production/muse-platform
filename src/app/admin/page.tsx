'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle, Plus } from 'lucide-react';

interface NewModel {
  name: string;
  image_url: string;
  gender: string;
  age_range: string;
  style_tags: string;
  description: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<NewModel>({
    name: '',
    image_url: '',
    gender: 'Female',
    age_range: '18-25',
    style_tags: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push('/login');
          return;
        }

        setUser(currentUser);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [supabase, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.image_url.trim()) {
      setError('Name and image URL are required');
      setIsSubmitting(false);
      return;
    }

    try {
      const styleTags = formData.style_tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const { error: insertError } = await supabase.from('models').insert({
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
        image_url: formData.image_url,
        gender: formData.gender,
        age_range: formData.age_range,
        style_tags: styleTags,
        description: formData.description,
        is_active: true,
      });

      if (insertError) throw insertError;

      setSuccess('Model added successfully!');
      setFormData({
        name: '',
        image_url: '',
        gender: 'Female',
        age_range: '18-25',
        style_tags: '',
        description: '',
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to add model');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="container mx-auto max-w-2xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Add New Model</h1>
          <p className="text-zinc-400">Admin panel to add models to the catalog</p>
        </div>

        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Model Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-2">
                Model Name *
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., ARIA"
                className="w-full px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image_url" className="block text-sm font-semibold mb-2">
                Image URL *
              </label>
              <input
                id="image_url"
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                placeholder="https://picsum.photos/seed/ARIA-01/400/500"
                className="w-full px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-semibold mb-2">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:border-emerald-600 focus:outline-none"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-Binary">Non-Binary</option>
              </select>
            </div>

            {/* Age Range */}
            <div>
              <label htmlFor="age_range" className="block text-sm font-semibold mb-2">
                Age Range
              </label>
              <select
                id="age_range"
                name="age_range"
                value={formData.age_range}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:border-emerald-600 focus:outline-none"
              >
                <option value="18-25">18-25</option>
                <option value="26-35">26-35</option>
                <option value="36-45">36-45</option>
                <option value="46-55">46-55</option>
                <option value="55+">55+</option>
              </select>
            </div>

            {/* Style Tags */}
            <div>
              <label htmlFor="style_tags" className="block text-sm font-semibold mb-2">
                Style Tags (comma-separated)
              </label>
              <input
                id="style_tags"
                type="text"
                name="style_tags"
                value={formData.style_tags}
                onChange={handleInputChange}
                placeholder="e.g., Minimalist, Editorial, Luxury, Futuristic"
                className="w-full px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:border-emerald-600 focus:outline-none"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Separate multiple tags with commas
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="A brief description of the model..."
                rows={4}
                className="w-full px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:border-emerald-600 focus:outline-none resize-none"
              />
            </div>

            {/* Alerts */}
            {error && (
              <div className="bg-red-600/20 text-red-400 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-600/20 text-emerald-400 p-4 rounded-lg flex items-start gap-3">
                <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">{success}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              <Plus size={20} />
              {isSubmitting ? 'Adding Model...' : 'Add Model'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
