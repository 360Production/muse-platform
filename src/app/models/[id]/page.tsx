'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

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
  expires_at: string;
}

const durations = [
  { days: 7, label: '7 Days', price: '$49' },
  { days: 30, label: '30 Days', price: '$129' },
  { days: 90, label: '90 Days', price: '$349' },
  { days: 365, label: '1 Year', price: '$999' },
];

export default function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = params.id as string;
  const supabase = createClient();

  const [model, setModel] = useState<Model | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [loading, setLoading] = useState(true);
  const [isLicensing, setIsLicensing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);

        // Fetch model
        const { data: modelData, error: modelError } = await supabase
          .from('models')
          .select('*')
          .eq('id', modelId)
          .single();

        if (modelError) throw modelError;
        setModel(modelData);

        // Check availability
        const { data: licenses, error: licError } = await supabase
          .from('licenses')
          .select('expires_at')
          .eq('model_id', modelId)
          .gt('expires_at', new Date().toISOString());

        if (licError) throw licError;
        setIsAvailable(!licenses || licenses.length === 0);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load model details');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [modelId, supabase]);

  const handleLicense = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLicensing(true);
    setError('');
    setSuccess('');

    try {
      const startDate = new Date();
      const expiryDate = new Date(startDate.getTime() + selectedDuration * 24 * 60 * 60 * 1000);

      const { error: licenseError } = await supabase.from('licenses').insert({
        model_id: modelId,
        user_id: user.id,
        starts_at: startDate.toISOString(),
        expires_at: expiryDate.toISOString(),
        duration_days: selectedDuration,
      });

      if (licenseError) throw licenseError;

      setSuccess(`Successfully licensed ${model?.name} for ${selectedDuration} days!`);
      setIsAvailable(false);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error licensing model:', error);
      setError('Failed to license model. Please try again.');
    } finally {
      setIsLicensing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link
            href="/models"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-8"
          >
            <ArrowLeft size={20} /> Back to Models
          </Link>
          <p className="text-zinc-400">Model not found</p>
        </div>
      </div>
    );
  }

  const selectedPlan = durations.find((d) => d.days === selectedDuration);

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link
          href="/models"
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-12"
        >
          <ArrowLeft size={20} /> Back to Models
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image */}
          <div>
            <div className="relative w-full aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
              <img
                src={model.image_url}
                alt={model.name}
                className="w-full h-full object-cover"
              />
              {!isAvailable && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold">
                    Currently Unavailable
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-5xl font-bold mb-2">{model.name}</h1>
                  <p className="text-zinc-500 text-lg">{model.id}</p>
                </div>
                {isAvailable ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-full">
                    <CheckCircle size={18} />
                    <span className="text-sm font-semibold">Available</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-full">
                    <AlertCircle size={18} />
                    <span className="text-sm font-semibold">Unavailable</span>
                  </div>
                )}
              </div>

              <p className="text-zinc-300 text-lg leading-relaxed mb-8">
                {model.description}
              </p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <p className="text-zinc-500 text-sm mb-1">Gender</p>
                  <p className="text-white font-semibold">{model.gender}</p>
                </div>
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <p className="text-zinc-500 text-sm mb-1">Age Range</p>
                  <p className="text-white font-semibold">{model.age_range}</p>
                </div>
              </div>

              {model.style_tags && model.style_tags.length > 0 && (
                <div>
                  <p className="text-zinc-400 text-sm mb-3">Styles</p>
                  <div className="flex flex-wrap gap-2">
                    {model.style_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* License Section */}
            {isAvailable && (
              <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
                <h2 className="text-2xl font-bold mb-6">License Period</h2>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {durations.map((plan) => (
                    <button
                      key={plan.days}
                      onClick={() => setSelectedDuration(plan.days)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        selectedDuration === plan.days
                          ? 'border-emerald-600 bg-emerald-600/10'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <p className="font-semibold">{plan.label}</p>
                      <p className="text-sm text-zinc-400">{plan.price}</p>
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="bg-red-600/20 text-red-400 p-4 rounded-lg mb-6 flex items-start gap-3">
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-600/20 text-emerald-400 p-4 rounded-lg mb-6 flex items-start gap-3">
                    <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <p>{success}</p>
                  </div>
                )}

                <button
                  onClick={handleLicense}
                  disabled={isLicensing}
                  className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {isLicensing ? 'Processing...' : `License for ${selectedPlan?.label}`}
                </button>

                {!user && (
                  <p className="text-sm text-zinc-400 mt-4 text-center">
                    Sign in to license this model
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
