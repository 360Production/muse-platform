'use client';

import Image from 'next/image';
import Link from 'next/link';

interface ModelCardProps {
  id: string;
  name: string;
  image_url: string;
  gender: string;
  is_available: boolean;
}

export default function ModelCard({ id, name, image_url, gender, is_available }: ModelCardProps) {
  return (
    <Link href={`/models/${id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-[#1a1a1a] border border-white/10 hover:border-white/30 transition-all duration-300">
        <div className="aspect-[3/4] relative">
          <Image src={image_url} alt={name} fill={true} className="object-cover group-hover:soale-105 transition-transform duration-500" />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-widest">{name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${is_available ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>{is_available ? 'AVAILABLE' : 'LICENSED'}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">{fender}</p>
        </div>
      </div>
    </Link>
  );
}
