'use client';

import { state } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = state('');
  const [password, setPassword] = state('');
  const [error, setError] = state('');
  const [loading, setLoading] = state(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md p-8 bg-[#111111] rounded-2l border border-white/10">
        <h2 className="text-2xl font-bold mb-6 text-white">Sign In</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 bg-[#1a1a1a] border border-white/10 rounded text-white" required />
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 bg-[#1a1a1a] border border-white/10 rounded text-white" required />
          <button type="submit" disabled={loading} className="w-full py-3 bg-white text-black font-semibold rounded hover:bg-gray-100 transition">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p className="mt-4 text-center text-gray-400">Don't have an account? <Link href="/signup" className="text-white hover:underline">Sign Up</Link></p>
      </div>
    </div>
  );
}
