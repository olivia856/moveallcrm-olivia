// ============================================================
// MoveHome CRM — Backend API Client (secure, no direct DB access)
// ============================================================

// All requests go through the Express backend which handles
// authentication, authorization, and database access securely.

const db = {
    _fetchOpts(method = 'GET', body = null) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        };
        if (body) opts.body = JSON.stringify(body);
        return opts;
    },

    // ── SELECT (list) ──────────────────────────────────────────
    async select(table, { columns = '*', filters = {}, search = null, searchCols = [], order = null, limit = 50, offset = 0 } = {}) {
        const segment = this._segmentFor(table);
        const params = new URLSearchParams();
        params.set('limit', limit);
        params.set('offset', offset);

        for (const [col, val] of Object.entries(filters)) {
            if (val !== null && val !== undefined && val !== 'all') {
                params.set(col, val);
            }
        }
        if (search) params.set('search', search);

        const res = await fetch(`/api/${segment}?${params}`, this._fetchOpts('GET'));
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Fetch error'); }
        const json = await res.json();
        return { data: json.data || [], total: json.pagination?.total || 0 };
    },

    // ── SELECT ONE ──────────────────────────────────────────
    async selectOne(table, id) {
        const segment = this._segmentFor(table);
        const res = await fetch(`/api/${segment}/${id}`, this._fetchOpts('GET'));
        if (!res.ok) throw new Error('Not found');
        const json = await res.json();
        return json.data || null;
    },

    // ── INSERT ──────────────────────────────────────────────
    async insert(table, payload) {
        const segment = this._segmentFor(table);
        const res = await fetch(`/api/${segment}`, this._fetchOpts('POST', payload));
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Insert error'); }
        const json = await res.json();
        return json.data;
    },

    // ── UPDATE ──────────────────────────────────────────────
    async update(table, id, payload) {
        const segment = this._segmentFor(table);
        const res = await fetch(`/api/${segment}/${id}`, this._fetchOpts('PUT', payload));
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Update error'); }
        const json = await res.json();
        return json.data;
    },

    // ── DELETE ──────────────────────────────────────────────
    async delete(table, id) {
        const segment = this._segmentFor(table);
        const res = await fetch(`/api/${segment}/${id}`, this._fetchOpts('DELETE'));
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Delete error'); }
        return true;
    },

    // ── CUSTOM QUERY (for jobs views, logs filters) ─────────
    async query(table, params = '') {
        const segment = this._segmentFor(table);
        const res = await fetch(`/api/${segment}?${params}`, this._fetchOpts('GET'));
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Query error'); }
        const json = await res.json();
        return json.data || [];
    },

    // ── Helpers ─────────────────────────────────────────────
    _segmentFor(table) {
        const map = {
            'leads':              'leads',
            'jobs':               'jobs',
            'storage_masterlist': 'storage',
            'contacts':           'contacts',
            'contractors':        'contractors',
            'users':              'users',
            'activity_logs':      'logs',
            'lead_comments':      'leads'  // comments go through leads routes
        };
        return map[table] || table;
    }
};

// ============================================================
// AUTH — Login via backend Express API
// ============================================================
const supabaseAuth = {
    async login(email, password) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || 'Login failed');
        }

        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Login failed');

        const user = json.data.user;

        // Store user info (token is now in httpOnly cookie)
        localStorage.setItem('movehome_user', JSON.stringify(user));

        return user;
    },

    async logout() {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
        localStorage.removeItem('movehome_user');
        window.location.href = 'index.html';
    },

    getUser() {
        return JSON.parse(localStorage.getItem('movehome_user') || 'null');
    },

    isLoggedIn() {
        const u = this.getUser();
        // Since token is in a cookie, we just trust the presence of user metadata
        // Backend will reject if cookie is expired or missing.
        if (u && u.id && u.name && u.role) {
            return true;
        }
        return false;
    }
};
