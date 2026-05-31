// ============================================================
// MoveHome CRM — Backend API Client (secure, no direct DB access)
// ============================================================

// All requests go through the Express backend which handles
// authentication, authorization, and database access securely.

const db = {
    // Token management
    _token: null,

    _headers() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this._token) {
            headers['Authorization'] = `Bearer ${this._token}`;
        }
        return headers;
    },

    setToken(token) {
        this._token = token;
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

        const res = await fetch(`/api/${segment}?${params}`, { headers: this._headers() });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Fetch error'); }
        const json = await res.json();
        return { data: json.data || [], total: json.pagination?.total || 0 };
    },

    // ── SELECT ONE ──────────────────────────────────────────
    async selectOne(table, id) {
        const segment = this._segmentFor(table);
        const res = await fetch(`/api/${segment}/${id}`, { headers: this._headers() });
        if (!res.ok) throw new Error('Not found');
        const json = await res.json();
        return json.data || null;
    },

    // ── INSERT ──────────────────────────────────────────────
    async insert(table, payload) {
        const segment = this._segmentFor(table);
        const res = await fetch(`/api/${segment}`, {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Insert error'); }
        const json = await res.json();
        return json.data;
    },

    // ── UPDATE ──────────────────────────────────────────────
    async update(table, id, payload) {
        const segment = this._segmentFor(table);
        const res = await fetch(`/api/${segment}/${id}`, {
            method: 'PUT',
            headers: this._headers(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Update error'); }
        const json = await res.json();
        return json.data;
    },

    // ── DELETE ──────────────────────────────────────────────
    async delete(table, id) {
        const segment = this._segmentFor(table);
        const res = await fetch(`/api/${segment}/${id}`, {
            method: 'DELETE',
            headers: this._headers()
        });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Delete error'); }
        return true;
    },

    // ── CUSTOM QUERY (for jobs views, logs filters) ─────────
    async query(table, params = '') {
        const segment = this._segmentFor(table);
        const res = await fetch(`/api/${segment}?${params}`, { headers: this._headers() });
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
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || 'Login failed');
        }

        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Login failed');

        const token = json.data.token;
        const user  = json.data.user;

        // Store token and user info
        db.setToken(token);
        localStorage.setItem('movehome_token', token);
        localStorage.setItem('movehome_user', JSON.stringify(user));

        return user;
    },

    logout() {
        db.setToken(null);
        localStorage.removeItem('movehome_token');
        localStorage.removeItem('movehome_user');
    },

    getUser() {
        return JSON.parse(localStorage.getItem('movehome_user') || 'null');
    },

    isLoggedIn() {
        const u = this.getUser();
        const t = localStorage.getItem('movehome_token');
        if (u && u.id && u.name && u.role && t) {
            // Restore token to db client on page load
            db.setToken(t);
            return true;
        }
        return false;
    }
};
