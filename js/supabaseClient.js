/**
 * Simple Supabase Client
 * Lightweight client for Supabase authentication and database operations
 */

class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.auth = new SupabaseAuth(this);
        this.currentSession = null;
    }

    // Create a table query builder
    from(table) {
        return new SupabaseQueryBuilder(this, table);
    }

    // Make authenticated request
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'apikey': this.key,
            ...options.headers
        };

        if (this.currentSession?.access_token) {
            headers['Authorization'] = `Bearer ${this.currentSession.access_token}`;
        }

        const response = await fetch(`${this.url}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }
}

class SupabaseAuth {
    constructor(client) {
        this.client = client;
        this.listeners = [];
    }

    // Get current session
    async getSession() {
        try {
            const session = localStorage.getItem('supabase_session');
            if (session) {
                const parsed = JSON.parse(session);
                // Check if session is still valid
                if (parsed.expires_at && new Date(parsed.expires_at) > new Date()) {
                    this.client.currentSession = parsed;
                    return { data: { session: parsed }, error: null };
                } else {
                    localStorage.removeItem('supabase_session');
                }
            }
            return { data: { session: null }, error: null };
        } catch (error) {
            return { data: { session: null }, error };
        }
    }

    // Sign in with email and password
    async signInWithPassword({ email, password }) {
        try {
            const response = await this.client.request('/auth/v1/token?grant_type=password', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            const session = {
                access_token: response.access_token,
                refresh_token: response.refresh_token,
                expires_at: new Date(Date.now() + response.expires_in * 1000).toISOString(),
                user: response.user
            };

            this.client.currentSession = session;
            localStorage.setItem('supabase_session', JSON.stringify(session));

            // Notify listeners
            this.notifyListeners('SIGNED_IN', session);

            return { data: { session, user: response.user }, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Sign up new user
    async signUp({ email, password, options = {} }) {
        try {
            const response = await this.client.request('/auth/v1/signup', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password,
                    data: options.data || {}
                })
            });

            return { data: response, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Sign out
    async signOut() {
        try {
            if (this.client.currentSession?.access_token) {
                await this.client.request('/auth/v1/logout', {
                    method: 'POST'
                });
            }

            this.client.currentSession = null;
            localStorage.removeItem('supabase_session');

            // Notify listeners
            this.notifyListeners('SIGNED_OUT', null);

            return { error: null };
        } catch (error) {
            return { error };
        }
    }

    // Update user
    async updateUser(attributes) {
        try {
            const response = await this.client.request('/auth/v1/user', {
                method: 'PUT',
                body: JSON.stringify(attributes)
            });

            return { data: { user: response }, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Listen for auth state changes
    onAuthStateChange(callback) {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // Notify all listeners
    notifyListeners(event, session) {
        this.listeners.forEach(callback => {
            try {
                callback(event, session);
            } catch (error) {
                console.error('Auth listener error:', error);
            }
        });
    }
}

class SupabaseQueryBuilder {
    constructor(client, table) {
        this.client = client;
        this.table = table;
        this.query = {
            select: '*',
            filters: [],
            order: null,
            limit: null
        };
    }

    // Select columns
    select(columns = '*') {
        this.query.select = columns;
        return this;
    }

    // Add filter
    eq(column, value) {
        this.query.filters.push(`${column}=eq.${encodeURIComponent(value)}`);
        return this;
    }

    // Add not equal filter
    neq(column, value) {
        this.query.filters.push(`${column}=neq.${encodeURIComponent(value)}`);
        return this;
    }

    // Add greater than filter
    gt(column, value) {
        this.query.filters.push(`${column}=gt.${encodeURIComponent(value)}`);
        return this;
    }

    // Add greater than or equal filter
    gte(column, value) {
        this.query.filters.push(`${column}=gte.${encodeURIComponent(value)}`);
        return this;
    }

    // Add less than filter
    lt(column, value) {
        this.query.filters.push(`${column}=lt.${encodeURIComponent(value)}`);
        return this;
    }

    // Add less than or equal filter
    lte(column, value) {
        this.query.filters.push(`${column}=lte.${encodeURIComponent(value)}`);
        return this;
    }

    // Add order
    order(column, options = {}) {
        const direction = options.ascending === false ? 'desc' : 'asc';
        this.query.order = `${column}.${direction}`;
        return this;
    }

    // Add limit
    limit(count) {
        this.query.limit = count;
        return this;
    }

    // Get single record
    single() {
        this.query.single = true;
        return this;
    }

    // Execute select query
    async execute() {
        try {
            let url = `/rest/v1/${this.table}?select=${this.query.select}`;
            
            if (this.query.filters.length > 0) {
                url += '&' + this.query.filters.join('&');
            }
            
            if (this.query.order) {
                url += `&order=${this.query.order}`;
            }
            
            if (this.query.limit) {
                url += `&limit=${this.query.limit}`;
            }

            const headers = {};
            if (this.query.single) {
                headers['Accept'] = 'application/vnd.pgrst.object+json';
            }

            const data = await this.client.request(url, { headers });
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Insert data
    async insert(data) {
        try {
            const response = await this.client.request(`/rest/v1/${this.table}`, {
                method: 'POST',
                body: JSON.stringify(Array.isArray(data) ? data : [data]),
                headers: {
                    'Prefer': 'return=representation'
                }
            });

            return { data: response, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Update data
    async update(data) {
        try {
            let url = `/rest/v1/${this.table}`;
            
            if (this.query.filters.length > 0) {
                url += '?' + this.query.filters.join('&');
            }

            const response = await this.client.request(url, {
                method: 'PATCH',
                body: JSON.stringify(data),
                headers: {
                    'Prefer': 'return=representation'
                }
            });

            return { data: response, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Delete data
    async delete() {
        try {
            let url = `/rest/v1/${this.table}`;
            
            if (this.query.filters.length > 0) {
                url += '?' + this.query.filters.join('&');
            }

            await this.client.request(url, {
                method: 'DELETE'
            });

            return { data: null, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }
}

// Create global supabase object
window.supabase = {
    createClient: (url, key) => new SupabaseClient(url, key)
};