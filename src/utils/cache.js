// src/utils/cache.js
class SimpleCache {
    constructor(defaultTTL = 300) {
        this.cache = {};
        this.defaultTTL = defaultTTL;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }

    set(key, value, ttl = this.defaultTTL) {
        const expiresAt = Date.now() + (ttl * 1000);
        this.cache[key] = {
            value,
            expiresAt
        };
        this.stats.sets++;
        this.cleanup();
        return true;
    }

    get(key) {
        const entry = this.cache[key];
        if (!entry) {
            this.stats.misses++;
            return null;
        }
        
        if (Date.now() > entry.expiresAt) {
            delete this.cache[key];
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        return entry.value;
    }

    del(key) {
        if (this.cache[key]) {
            delete this.cache[key];
            this.stats.deletes++;
            return true;
        }
        return false;
    }

    keys() {
        return Object.keys(this.cache);
    }

    cleanup() {
        const now = Date.now();
        const expiredKeys = [];
        
        for (const key in this.cache) {
            if (this.cache[key] && now > this.cache[key].expiresAt) {
                expiredKeys.push(key);
            }
        }
        
        expiredKeys.forEach(key => delete this.cache[key]);
        
        if (expiredKeys.length > 0) {
            console.log(`🧹 Cleaned ${expiredKeys.length} expired cache entries`);
        }
    }

    getStats() {
        return {
            ...this.stats,
            totalEntries: Object.keys(this.cache).length,
            hitRate: this.stats.hits + this.stats.misses > 0 
                ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    flushAll() {
        const count = Object.keys(this.cache).length;
        this.cache = {};
        console.log(`🧹 Flushed ${count} cache entries`);
        return count;
    }
}

module.exports = new SimpleCache(300); // 5 minutes default TTL