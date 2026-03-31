'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#0a0a0a] border-b border-zinc-800 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tight">
          MUSE
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/models"
            className="text-zinc-400 hover:text-white transition-colors font-medium"
          >
            Models
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-zinc-400 hover:text-white transition-colors font-medium"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-zinc-700 hover:bg-zinc-900 text-white rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-zinc-400 hover:text-white transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-white"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-zinc-900 border-t border-zinc-800 p-4 space-y-4">
          <Link
            href="/models"
            className="block text-zinc-400 hover:text-white transition-colors font-medium"
            onClick={() => setIsOpen(false)}
          >
            Models
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="block text-zinc-400 hover:text-white transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-white rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block text-zinc-400 hover:text-white transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-center"
                onClick={() => setIsOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
