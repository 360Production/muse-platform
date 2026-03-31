// Simplified Supabase-like client using fetch
interface AuthResponse {
  user: { id: string; email: string } | null;
  session: { user: { id: string; email: string }; access_token: string } | null;
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    auth: {
      getUser: async () => {
        try {
          const token = localStorage.getItem('muse_auth_token');
          if (!token) return { data: { user: null }, error: null };
          const res = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) return { data: { user: null }, error: null };
          const user = await res.json();
          return { data: { user }, error: null };
        } catch (e) { return { data: { user: null }, error: null }; }
      },
      signUp: async (c: { email: string; password: string }) => {
        const res = await fetch(`${supabaseUrl}/auth/v1/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: supabaseKey! }, body: JSON.stringify(c) });
        if (!res.ok) { const e = await res.json(); return { data: null, error: { message: e.message } }; }
        const { user, session } = await res.json();
        if (session?.access_token) localStorage.setItem('muse_auth_token', session.access_token);
        return { data: { user, session }, error: null };
      },
      signInWithPassword: async (c: { email: string; password: string }) => {
        const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: supabaseKey! }, body: JSON.stringify(c) });
        if (!res.ok) { const e = await res.json(); return { data: null, error: { message: e.message } }; }
        const { user, access_token } = await res.json();
        localStorage.setItem('muse_auth_token', access_token);
        return { data: { user, session: { access_token } }, error: null };
      },
      signOut: async () => { localStorage.removeItem('muse_auth_token'); return { error: null }; },
      onAuthStateChange: (cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: (table: string) => {
      const getHeaders = () => { const t = localStorage.getItem('muse_auth_token'); return { apikey: supabaseKey!, ...(t ? { Authorization: `Bearer ${t}` } : {}) }; };
      return {
        select: (cols = '*') => {
          let query = `select=${cols}`;
          const builder = {
            eq: (c: string, v: any) => { query += `&${c}=eq.${encodeURIComponent(v)}`; return builder; },
            order: (c: string, o: any) => { query += `&order=${c}.${o.ascending ? 'asc' : 'desc'}`; return builder; },
            single: async () => {
              const r = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, { headers: getHeaders() });
              const d = await r.json(); return { data: Array.isArray(d) ? d[0] : d, error: r.ok ? null : d };
            },
            then: async (resolve: any) => {
              const r = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, { headers: getHeaders() });
              const d = await r.json(); resolve({ data: Array.isArray(d) ? d : [d], error: r.ok ? null : d });
            },
          };
          return builder;
        },
        insert: (d: any) => ({
          select: () => ({
            single: async () => {
              const r = await fetch(`${supabaseUrl}/rest/v1/${table}`, { method: 'POST', headers: { ...getHeaders(), 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(d) });
              const j = await r.json(); return { data: Array.isArray(j) ? j[0] : js, error: r.ok ? null : j };
            },
          }),
          then: async (resolve: any) => {
            const r = await fetch(`${supabaseUrl}/rest/v1/${table}`, { method: 'POST', headers: { ...getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
            const j = await r.json(); resolve({ data: j, error: r.ok ? null : z j });
          },
        }),
        delete: () => ({
          eq: async (c: string, v: any) => {
            const r = await fetch(`${supabaseUrl}/rest/v1/${table}?${c}=eq.${encodeURIComponent(v)}`, { method: 'DELETE', headers: getHeaders() });
            return { error: r.ok ? null : await r.json() };
          },
        }),
      };
    },
  };
}
