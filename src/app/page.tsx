'use client';

import Link from 'next/link';
import ModelCard from '@/components/ModelCard';
import { ArrowRight, Check } from 'lucide-react';

const placeholderModels = [
  {
    id: 'ARIA-01',
    name: 'ARIA',
    image_url: 'https://picsum.photos/seed/ARIA-01/400/500',
    gender: 'Female',
    is_available: true,
  },
  {
    id: 'NOVA-03',
    name: 'NOVA',
    image_url: 'https://picsum.photos/seed/NOVA-03/400/500',
    gender: 'Female',
    is_available: true,
  },
  {
    id: 'KAEL-01',
    name: 'KAEL',
    image_url: 'https://picsum.photos/seed/KAEL-01/400/500',
    gender: 'Male',
    is_available: false,
  },
  {
    id: 'LUNA-02',
    name: 'LUNA',
    image_url: 'https://picsum.photos/seed/LUNA-02/400/500',
    gender: 'Female',
    is_available: true,
  },
  {
    id: 'ZEPH-01',
    name: 'ZEPH',
    image_url: 'https://picsum.photos/seed/ZEPH-01/400/500',
    gender: 'Male',
    is_available: true,
  },
  {
    id: 'EMBER-04',
    name: 'EMBER',
    image_url: 'https://picsum.photos/seed/EMBER-04/400/500',
    gender: 'Non-Binary',
    is_available: true,
  },
];

const steps = [
  {
    number: '01',
    title: 'Browse Models',
    description: 'Explore our curated collection of AI-generated model identities with unique styles and characteristics.',
  },
  {
    number: '02',
    title: 'License Exclusive Access',
    description: 'Choose your licensing period and secure exclusive rights to use a model for campaigns.',
  },
  {
    number: '03',
    title: 'Share & Collaborate',
    description: 'Create pools and share curated model selections with your team and clients for approval.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
              MUSE
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 mb-12 leading-relaxed">
              The AI Model Marketplace. Browse, license, and manage AI-generated model identities for your creative campaigns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/models"
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Explore Models <ArrowRight size={20} />
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 border border-zinc-700 hover:bg-zinc-900 text-white font-semibold rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Model Grid Preview */}
      <section className="py-24 px-4 bg-zinc-950">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-4 text-center">Featured Models</h2>
          <p className="text-zinc-400 text-center mb-16">
            A selection of our latest AI model identities available for licensing
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {placeholderModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
          <div className="text-center mt-16">
            <Link
              href="/models"
              className="inline-block px-8 py-3 border border-emerald-600 text-emerald-400 hover:bg-emerald-600 hover:text-white font-semibold rounded-lg transition-colors"
            >
              View All Models
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-4 text-center">How It Works</h2>
          <p className="text-zinc-400 text-center mb-16">
            Three simple steps to access and license exclusive model identities
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-lg">
                  {step.number}
                </div>
                <div className="bg-zinc-900 rounded-lg p-8 h-full border border-zinc-800">
                  <h3 className="text-xl font-semibold mb-4 mt-4">{step.title}</h3>
                  <p className="text-zinc-400">{step.description}</p>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute -right-6 top-1/2 transform -translate-y-1/2 text-zinc-700">
                      <ArrowRight size={24} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Find Your Perfect Model?</h2>
          <p className="text-zinc-400 mb-8">
            Join creative teams worldwide who are discovering and licensing the best AI models.
          </p>
          <Link
            href="/models"
            className="inline-block px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            Start Browsing Now
          </Link>
        </div>
      </section>
    </div>
  );
}
