/**
 * External Addon Integration Module
 * 
 * Integra Torrentio, MediaFusion e Comet per aggregare risultati da addon esterni.
 * Gestisce chiamate parallele, normalizzazione e deduplicazione.
 */

// ✅ VERBOSE LOGGING - configurabile via ENV
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

// ============================================================================
// CONFIGURATION - URL completi degli addon esterni con configurazione base64
// ============================================================================

// Get Torrentio base domain from env to hide the real URL
const TORRENTIO_BASE_DOMAIN = process.env.TORRENTIO_BASE_URL || '';

const EXTERNAL_ADDONS = {
    torrentio: {
        // Proxy URL (hides upstream Torrentio). The direct torrentio.strem.fun does NOT work from
        // the user's server — only this proxy is reachable. Do NOT add a fallback.
        baseUrl: TORRENTIO_BASE_DOMAIN
            ? `${TORRENTIO_BASE_DOMAIN}/oResults=false/aHR0cHM6Ly90b3JyZW50aW8uc3RyZW0uZnVuL3Byb3ZpZGVycz15dHMsZXp0dixyYXJiZywxMzM3eCx0aGVwaXJhdGViYXksa2lja2Fzc3RvcnJlbnRzLHRvcnJlbnRnYWxheHksbWFnbmV0ZGwsaG9ycmlibGVzdWJzLG55YWFzaSx0b2t5b3Rvc2hvLGFuaWRleCxydXRvcixydXRyYWNrZXIsY29tYW5kbyxibHVkdix0b3JyZW50OSxpbGNvcnNhcm9uZXJvLG1lam9ydG9ycmVudCx3b2xmbWF4NGssY2luZWNhbGlkYWQsYmVzdHRvcnJlbnRzfGxhbmd1YWdlPWl0YWxpYW58cXVhbGl0eWZpbHRlcj1zY3IsY2Ft`
            : null,
        name: 'Torrentio',
        emoji: '🅣',
        timeout: 2000  // Increased from 1500ms - Torrentio can be slow
    },
    mediafusion: {
        baseUrl: 'https://mediafusionfortheweebs.midnightignite.me/D--MuTCQ99t0sh23nd3nx2xZCCqMkr4MPwy5I9suo3Ej2tUYTqimnxZBJ34hbNRwoL5AIvPt4N8KPnl50LWHT5YLDcrwnX_dhOq3vHO0aCNKBlnXeki7olZAUDoHepPCTDFLFtZVcZcohYRa83aT2Vbig3W5Qz3qErPqw2Zdb676ioZa452Mb35T0IX-ftQcNF0oGJerUTZhfvv9w4wrEIiW8wx0jdSxAfcrnM6yKFEcYMP-3dRWYAL2wy13Gcvwr2j4ax2z6TQ35xlcW9WWsKjA',
        name: 'MediaFusion',
        emoji: '🅜',
        timeout: 1500
    },
    comet: {
        baseUrl: 'https://comet.feels.legal/eyJtYXhSZXN1bHRzUGVyUmVzb2x1dGlvbiI6MCwibWF4U2l6ZSI6MCwiY2FjaGVkT25seSI6ZmFsc2UsInNvcnRDYWNoZWRVbmNhY2hlZFRvZ2V0aGVyIjpmYWxzZSwicmVtb3ZlVHJhc2giOnRydWUsInJlc3VsdEZvcm1hdCI6WyJhbGwiXSwiZGVicmlkU2VydmljZXMiOltdLCJlbmFibGVUb3JyZW50Ijp0cnVlLCJkZWR1cGxpY2F0ZVN0cmVhbXMiOmZhbHNlLCJzY3JhcGVEZWJyaWRBY2NvdW50VG9ycmVudHMiOmZhbHNlLCJkZWJyaWRTdHJlYW1Qcm94eVBhc3N3b3JkIjoiIiwibGFuZ3VhZ2VzIjp7InJlcXVpcmVkIjpbIml0Il0sImFsbG93ZWQiOlsibXVsdGkiLCJpdCJdLCJleGNsdWRlIjpbImVuIiwiamEiLCJ6aCIsInJ1IiwiYXIiLCJwdCIsImVzIiwiZnIiLCJkZSIsImtvIiwiaGkiLCJibiIsInBhIiwibXIiLCJndSIsInRhIiwidGUiLCJrbiIsIm1sIiwidGgiLCJ2aSIsImlkIiwidHIiLCJoZSIsImZhIiwidWsiLCJlbCIsImx0IiwibHYiLCJldCIsInBsIiwiY3MiLCJzayIsImh1Iiwicm8iLCJiZyIsInNyIiwiaHIiLCJzbCIsIm5sIiwiZGEiLCJmaSIsInN2Iiwibm8iLCJtcyIsImxhIl0sInByZWZlcnJlZCI6WyJpdCJdfSwicmVzb2x1dGlvbnMiOnsicjI0MHAiOmZhbHNlfSwib3B0aW9ucyI6eyJyZW1vdmVfcmFua3NfdW5kZXIiOi0xMDAwMDAwMDAwMCwiYWxsb3dfZW5nbGlzaF9pbl9sYW5ndWFnZXMiOmZhbHNlLCJyZW1vdmVfdW5rbm93bl9sYW5ndWFnZXMiOmZhbHNlfX0=',
        name: 'Comet',
        emoji: '🅒',
        timeout: 1500
    },
    stremthru_torz: {
        baseUrl: process.env.STREMTHRU_TORZ_URL || 'https://stremthru.13377001.xyz/stremio/torz/eyJpbmRleGVycyI6bnVsbCwic3RvcmVzIjpbeyJjIjoicDJwIiwidCI6IiJ9XSwiZmlsdGVyIjoiXCJpdFwiIGluIExhbmd1YWdlcyBcdTAwMjZcdTAwMjYgUXVhbGl0eSAhPSBcIkNBTVwiIn0=',
        name: 'StremThru Torz',
        emoji: '🆂',
        timeout: 2000
    },
    meteor: {
        baseUrl: process.env.METEOR_URL || 'https://meteorfortheweebs.midnightignite.me/eyJkZWJyaWRTZXJ2aWNlIjoidG9ycmVudCIsImRlYnJpZEFwaUtleSI6IiIsImNhY2hlZE9ubHkiOnRydWUsImVuYWJsZVlvdXJNZWRpYSI6ZmFsc2UsInlvdXJNZWRpYUxlZ2FjeU1vZGUiOmZhbHNlLCJzaG93WW91ck1lZGlhU3RyZWFtcyI6ZmFsc2UsInlvdXJNZWRpYVNvdXJjZXMiOlsidG9ycmVudCJdLCJyZW1vdmVUcmFzaCI6ZmFsc2UsInJlbW92ZVNhbXBsZXMiOmZhbHNlLCJyZW1vdmVBZHVsdCI6ZmFsc2UsImV4Y2x1ZGUzRCI6ZmFsc2UsImVuYWJsZVNlYURleCI6ZmFsc2UsImVuYWJsZVVzZW5ldCI6ZmFsc2UsInVzZW5ldEN1c3RvbUVuZ2luZXMiOmZhbHNlLCJtaW5TZWVkZXJzIjowLCJtYXhSZXN1bHRzIjowLCJtYXhSZXN1bHRzUGVyUmVzIjowLCJtYXhTaXplIjowLCJyZXNvbHV0aW9ucyI6W10sImxhbmd1YWdlcyI6eyJwcmVmZXJyZWQiOlsibXVsdGkiLCJpdCJdLCJyZXF1aXJlZCI6WyJpdCIsIm11bHRpIl0sImV4Y2x1ZGUiOltdfSwicmVzdWx0Rm9ybWF0IjpbInRpdGxlIiwicXVhbGl0eSIsInNpemUiLCJhdWRpbyJdLCJzb3J0T3JkZXIiOlsicGFjayIsImNhY2hlZCIsInlvdXJtZWRpYSIsInNlYWRleCIsInJlc29sdXRpb24iLCJzaXplIiwicXVhbGl0eSIsInNlZWRlcnMiLCJsYW5ndWFnZSIsInR5cGUiXX0',
        name: 'Meteor',
        emoji: '☄️',
        timeout: 2000
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Estrae info hash dal formato magnet o direttamente
 */
function extractInfoHash(stream) {
    // Prima controlla infoHash diretto
    if (stream.infoHash) {
        return stream.infoHash.toUpperCase();
    }
    // Poi prova a trovarlo nel magnet URL se presente
    if (stream.url && stream.url.includes('btih:')) {
        const match = stream.url.match(/btih:([A-Fa-f0-9]{40}|[A-Za-z2-7]{32})/i);
        if (match) return match[1].toUpperCase();
    }
    return null;
}

/**
 * Estrae la qualità dal titolo/nome dello stream
 */
function extractQuality(text) {
    if (!text) return '';
    const qualityPatterns = [
        /\b(2160p|4k|uhd)\b/i,
        /\b(1080p)\b/i,
        /\b(720p)\b/i,
        /\b(480p|sd)\b/i
    ];
    for (const pattern of qualityPatterns) {
        const match = text.match(pattern);
        if (match) return match[1].toLowerCase();
    }
    return '';
}

/**
 * Estrae seeders dal titolo formattato dell'addon
 */
function extractSeeders(text) {
    if (!text) return 0;
    // Pattern: 👤 23 o S: 23 o Seeders: 23
    const match = text.match(/👤\s*(\d+)|[Ss](?:eeders)?:\s*(\d+)/);
    if (match) return parseInt(match[1] || match[2]) || 0;
    return 0;
}

/**
 * Estrae la dimensione del file
 */
function extractSize(text) {
    if (!text) return { formatted: '', bytes: 0 };

    // Pattern: 📦 111.78 GB o 💾 111.78 GB o Size: 111.78 GB
    const match = text.match(/(?:📦|💾|Size:?)\s*([\d.,]+)\s*(B|KB|MB|GB|TB)/i);
    if (!match) return { formatted: '', bytes: 0 };

    const value = parseFloat(match[1].replace(',', '.'));
    const unit = match[2].toUpperCase();

    const multipliers = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 ** 2,
        'GB': 1024 ** 3,
        'TB': 1024 ** 4
    };

    const bytes = Math.round(value * (multipliers[unit] || 1));
    return { formatted: `${value} ${unit}`, bytes };
}

/**
 * Estrae il provider originale dal titolo (es. 🔍 ilCorSaRoNeRo)
 */
function extractOriginalProvider(text) {
    if (!text) return null;
    // Torrentio: 🔍 ilCorSaRoNeRo
    const torrentioMatch = text.match(/🔍\s*([^\n]+)/);
    if (torrentioMatch) return torrentioMatch[1].trim();

    // MediaFusion: 🔗 BT4G
    const mfMatch = text.match(/🔗\s*([^\n]+)/);
    if (mfMatch) return mfMatch[1].trim();

    // Comet: 🔎 StremThru
    const cometMatch = text.match(/🔎\s*([^\n]+)/);
    if (cometMatch) return cometMatch[1].trim();

    // StremThru: 🔎 o 🔍 in base al formato
    const stremthruMatch = text.match(/[🔍🔎]\s*([^\n]+)/);
    if (stremthruMatch && text.includes('StremThru')) return stremthruMatch[1].trim();

    return null;
}

/**
 * Normalizza i provider Comet usando solo l'ultimo elemento della catena.
 * Esempio: "Comet|Comet|TorBox|EXT Torrents" -> "EXT Torrents".
 */
function normalizeCometProvider(provider) {
    if (!provider) return provider;
    const parts = provider.split('|').map(part => part.trim()).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : provider.trim();
}

/**
 * Usa il provider Comet solo se inizia con lettera maiuscola (A-Z).
 */
function isCometProviderCapitalized(provider) {
    if (!provider) return false;
    return /^[A-Z]/.test(provider);
}

/**
 * Normalizza il provider MediaFusion per i Contribution Stream.
 * Esempio: "Contribution Stream 🧑‍💻 Affolly" -> "Contribution Stream".
 */
function normalizeMediaFusionProvider(provider) {
    if (!provider) return provider;
    if (/^Contribution Stream\b/i.test(provider)) return 'Contribution Stream';
    return provider;
}

/**
 * Estrae il pack title dal campo 📁 nel title/description o da behaviorHints.folderName
 * Questo è il nome della cartella/pack, NON il singolo file
 * ✅ FIX: Ignora folderName se è un filename (contiene estensione video)
 */
function extractPackTitle(stream) {
    const text = stream.title || stream.description || '';

    // 1. Prima prova 📁 nel testo (più affidabile)
    const match = text.match(/📁\s*([^\n]+)/);
    if (match) return match[1].trim();

    // 2. Poi prova behaviorHints.folderName - MA ignora se è un filename!
    // Comet a volte passa il nome del FILE come folderName (bug di Comet)
    const folderName = stream.behaviorHints?.folderName;
    if (folderName) {
        // ✅ FIX: Se folderName contiene estensione video, è un filename NON un folder!
        const isFilename = /\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|ts|m2ts)$/i.test(folderName);
        if (!isFilename) {
            return folderName;
        }
        // Se è un filename, ignoriamo e torniamo null (useremo filename invece)
    }

    return null;
}

/**
 * Estrae il filename dal campo behaviorHints o dal titolo
 * 📄 indica il singolo file (episodio) all'interno di un pack
 */
function extractFilename(stream) {
    if (stream.behaviorHints?.filename) {
        return stream.behaviorHints.filename;
    }
    // Prova a estrarre da 📄 nel title/description
    const text = stream.title || stream.description || '';
    const match = text.match(/📄\s*([^\n]+)/);
    if (match) return match[1].trim();
    return stream.name || '';
}

// ============================================================================
// 🛡️ PROTECTION LAYER
// Per evitare di bombardare gli addon esterni (es. ban IP da Meteor):
//  1. Cache in-memory per addon (TTL 10 min) → deduplica nel tempo
//  2. In-flight dedup → N richieste simultanee allo stesso URL = 1 sola fetch
//  3. Circuit breaker per-addon → dopo 3 errori consecutivi, blocca l'addon per 5 min
//  4. Concurrency limit per-addon → max 3 richieste simultanee in volo
//  5. Niente retry su 429 (rispetta il rate limit invece di insistere)
// ============================================================================

const ADDON_CACHE_TTL = 10 * 60 * 1000;          // 10 minuti
const ADDON_CACHE_MAX_ENTRIES = 500;
const CIRCUIT_BREAKER_ERROR_THRESHOLD = 3;       // errori consecutivi prima del blocco
const CIRCUIT_BREAKER_COOLDOWN_MS = 5 * 60 * 1000; // 5 minuti di blocco
const ADDON_MAX_CONCURRENCY = 3;                 // max richieste simultanee per addon

// Cache: chiave = `${addonKey}|${type}|${id}` → { data: Array, timestamp: number }
const _addonCache = new Map();

// In-flight: chiave uguale alla cache → Promise condivisa
const _addonInFlight = new Map();

// Circuit breaker per-addon: { errors: number, blockedUntil: number }
const _addonBreaker = new Map();

// Concurrency semaphore per-addon: { active: number, queue: Array<() => void> }
const _addonSemaphore = new Map();

// Stats per logging
const _addonStats = new Map();

function _bumpStat(addonKey, field) {
    let s = _addonStats.get(addonKey);
    if (!s) { s = { hits: 0, misses: 0, dedup: 0, blocked: 0, errors: 0, fetched: 0 }; _addonStats.set(addonKey, s); }
    s[field] = (s[field] || 0) + 1;
}

// Cleanup periodico cache (ogni ora) — evita crescita illimitata in memoria
setInterval(() => {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of _addonCache.entries()) {
        if (now - entry.timestamp > ADDON_CACHE_TTL) {
            _addonCache.delete(key);
            removed++;
        }
    }
    // Hard cap: se la cache resta troppo grande, droppa le entry più vecchie
    if (_addonCache.size > ADDON_CACHE_MAX_ENTRIES) {
        const sorted = [..._addonCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toDrop = _addonCache.size - ADDON_CACHE_MAX_ENTRIES;
        for (let i = 0; i < toDrop; i++) {
            _addonCache.delete(sorted[i][0]);
            removed++;
        }
    }
    if (removed > 0 && DEBUG_MODE) {
        console.log(`🧹 [External Cache] Cleanup: removed ${removed} entries (size now: ${_addonCache.size})`);
    }
}, 60 * 60 * 1000);

// Log periodico delle statistiche (ogni 5 min) — utile per monitorare l'efficacia
setInterval(() => {
    if (_addonStats.size === 0) return;
    const lines = [];
    for (const [addonKey, s] of _addonStats.entries()) {
        const total = s.hits + s.misses;
        const hitRate = total > 0 ? Math.round((s.hits / total) * 100) : 0;
        lines.push(`  ${addonKey}: ${s.fetched} req → ${s.hits} cache-hit (${hitRate}%), ${s.dedup} dedup, ${s.blocked} blocked, ${s.errors} errors`);
    }
    console.log(`📊 [External Addons Stats - last 5min]\n${lines.join('\n')}`);
    _addonStats.clear();
}, 5 * 60 * 1000);

/**
 * Circuit breaker: registra un errore e blocca l'addon se sopra soglia.
 */
function _recordError(addonKey, addonName) {
    let b = _addonBreaker.get(addonKey);
    if (!b) { b = { errors: 0, blockedUntil: 0 }; _addonBreaker.set(addonKey, b); }
    b.errors++;
    if (b.errors >= CIRCUIT_BREAKER_ERROR_THRESHOLD) {
        b.blockedUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
        b.errors = 0;
        console.warn(`🔴 [Circuit Breaker] ${addonName} BLOCKED for ${CIRCUIT_BREAKER_COOLDOWN_MS / 60000} min (too many consecutive errors)`);
    }
    _bumpStat(addonKey, 'errors');
}

function _recordSuccess(addonKey) {
    const b = _addonBreaker.get(addonKey);
    if (b) b.errors = 0;
}

function _isBlocked(addonKey) {
    const b = _addonBreaker.get(addonKey);
    if (!b) return false;
    if (b.blockedUntil > Date.now()) return true;
    if (b.blockedUntil > 0) {
        // Cooldown scaduto: reset
        b.blockedUntil = 0;
        b.errors = 0;
    }
    return false;
}

/**
 * Acquisisce uno slot del semaforo per l'addon. Restituisce una funzione release().
 */
function _acquireSlot(addonKey) {
    let sem = _addonSemaphore.get(addonKey);
    if (!sem) { sem = { active: 0, queue: [] }; _addonSemaphore.set(addonKey, sem); }

    if (sem.active < ADDON_MAX_CONCURRENCY) {
        sem.active++;
        return () => _releaseSlot(addonKey);
    }
    // Coda: aspetta un release
    return new Promise(resolve => {
        sem.queue.push(() => {
            sem.active++;
            resolve(() => _releaseSlot(addonKey));
        });
    });
}

function _releaseSlot(addonKey) {
    const sem = _addonSemaphore.get(addonKey);
    if (!sem) return;
    sem.active--;
    if (sem.queue.length > 0) {
        const next = sem.queue.shift();
        next();
    }
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Esegue effettivamente la fetch HTTP verso l'addon (senza cache/dedup/breaker).
 * Chiamata interna: tutta la logica di protezione è in fetchExternalAddon().
 */
async function _doFetchExternalAddon(addonKey, addon, url) {
    // 🔁 Retry SOLO su timeout/connection error/5xx, MAI su 429
    //    Su 429 rispettiamo il rate limit — il circuit breaker farà il resto.
    const MAX_ATTEMPTS = 2;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), addon.timeout);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'IlCorsaroViola/1.0 (Stremio Addon)',
                    'Accept': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // 🚫 Niente retry su 429 — è esattamente quello che ci ha fatto bannare
                if (response.status === 429) {
                    console.error(`🚫 [${addon.name}] HTTP 429 Rate Limited — NOT retrying (will count toward circuit breaker)`);
                    return { ok: false, status: 429, streams: [] };
                }
                // Retry solo su 5xx transienti
                const transient = response.status >= 500;
                if (transient && attempt < MAX_ATTEMPTS) {
                    const backoff = 350 * attempt;
                    console.warn(`⚠️ [${addon.name}] HTTP ${response.status} (attempt ${attempt}/${MAX_ATTEMPTS}) — retrying in ${backoff}ms`);
                    await new Promise(r => setTimeout(r, backoff));
                    continue;
                }
                console.error(`❌ [${addon.name}] HTTP ${response.status}${attempt > 1 ? ` after ${attempt} attempts` : ''}`);
                return { ok: false, status: response.status, streams: [] };
            }

            const data = await response.json();
            const streams = data.streams || [];

            if (DEBUG_MODE) console.log(`✅ [${addon.name}] Received ${streams.length} streams${attempt > 1 ? ` (after ${attempt} attempts)` : ''}`);

            if (DEBUG_MODE && streams.length > 0) {
                console.log(`🔍 [${addon.name}] First stream sample:`, JSON.stringify(streams[0], null, 2).substring(0, 500));
            }

            return { ok: true, status: 200, streams: streams.map(s => normalizeExternalStream(s, addonKey)) };

        } catch (error) {
            const isTimeout = error.name === 'AbortError';
            if (attempt < MAX_ATTEMPTS) {
                const backoff = 350 * attempt;
                if (isTimeout) {
                    console.warn(`⏱️ [${addon.name}] Timeout (attempt ${attempt}/${MAX_ATTEMPTS}) after ${addon.timeout}ms — retrying in ${backoff}ms`);
                } else {
                    console.warn(`⚠️ [${addon.name}] ${error.message} (attempt ${attempt}/${MAX_ATTEMPTS}) — retrying in ${backoff}ms`);
                }
                await new Promise(r => setTimeout(r, backoff));
                continue;
            }
            if (isTimeout) {
                console.error(`⏱️ [${addon.name}] Timeout after ${addon.timeout}ms (${attempt} attempts)`);
            } else {
                console.error(`❌ [${addon.name}] Error after ${attempt} attempts:`, error.message);
            }
            return { ok: false, status: 0, streams: [] };
        }
    }

    return { ok: false, status: 0, streams: [] };
}

/**
 * Chiama un singolo addon esterno con TUTTE le protezioni:
 * cache → in-flight dedup → circuit breaker → concurrency limit → fetch.
 *
 * @param {string} addonKey - Chiave dell'addon (torrentio, mediafusion, comet, ...)
 * @param {string} type - Tipo media (movie, series)
 * @param {string} id - ID Stremio (es. tt0120737 o tt0120737:1:5)
 * @returns {Promise<Array>} Array di stream normalizzati (mai throw, mai null)
 */
async function fetchExternalAddon(addonKey, type, id) {
    const addon = EXTERNAL_ADDONS[addonKey];
    if (!addon) {
        console.error(`❌ [External] Unknown addon: ${addonKey}`);
        return [];
    }

    if (!addon.baseUrl) {
        if (DEBUG_MODE) console.log(`⏭️ [${addon.name}] Skipped - base URL not configured`);
        return [];
    }

    const cacheKey = `${addonKey}|${type}|${id}`;

    // 1️⃣ CACHE HIT → ritorna subito, zero richieste in rete
    const cached = _addonCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < ADDON_CACHE_TTL) {
        _bumpStat(addonKey, 'hits');
        if (DEBUG_MODE) {
            const ageSec = Math.round((Date.now() - cached.timestamp) / 1000);
            console.log(`⚡ [${addon.name}] CACHE HIT (age ${ageSec}s, ${cached.data.length} streams)`);
        }
        return cached.data;
    }

    // 2️⃣ CIRCUIT BREAKER → se l'addon è bloccato, ritorna [] senza chiamarlo
    if (_isBlocked(addonKey)) {
        _bumpStat(addonKey, 'blocked');
        const b = _addonBreaker.get(addonKey);
        const remainingSec = Math.round((b.blockedUntil - Date.now()) / 1000);
        if (DEBUG_MODE) console.log(`🔴 [${addon.name}] BLOCKED by circuit breaker (${remainingSec}s remaining) — returning []`);
        return [];
    }

    // 3️⃣ IN-FLIGHT DEDUP → se la stessa richiesta è già in volo, condividi la Promise
    const inFlight = _addonInFlight.get(cacheKey);
    if (inFlight) {
        _bumpStat(addonKey, 'dedup');
        if (DEBUG_MODE) console.log(`🔗 [${addon.name}] DEDUP: joining in-flight request for ${type}/${id}`);
        return inFlight;
    }

    _bumpStat(addonKey, 'misses');

    // 4️⃣ + 5️⃣ Crea la promise condivisa: aspetta uno slot del semaforo, poi fetcha
    const fetchPromise = (async () => {
        const release = await _acquireSlot(addonKey);
        try {
            const url = `${addon.baseUrl}/stream/${type}/${id}.json`;
            if (DEBUG_MODE) console.log(`🌐 [${addon.name}] Fetching: ${type}/${id}`);
            _bumpStat(addonKey, 'fetched');

            const result = await _doFetchExternalAddon(addonKey, addon, url);

            if (result.ok) {
                _recordSuccess(addonKey);
                // Salva in cache solo i successi
                _addonCache.set(cacheKey, { data: result.streams, timestamp: Date.now() });
                return result.streams;
            } else {
                _recordError(addonKey, addon.name);
                // Cache breve sui fallimenti per evitare retry immediati (1 min)
                // — protegge ulteriormente l'upstream da raffiche di richieste sullo stesso ID fallito
                _addonCache.set(cacheKey, { data: [], timestamp: Date.now() - (ADDON_CACHE_TTL - 60_000) });
                return [];
            }
        } finally {
            release();
            _addonInFlight.delete(cacheKey);
        }
    })();

    _addonInFlight.set(cacheKey, fetchPromise);
    return fetchPromise;
}

/**
 * Normalizza uno stream dall'addon esterno nel formato interno
 * 
 * @param {Object} stream - Stream originale dall'addon
 * @param {string} addonKey - Chiave addon sorgente
 * @returns {Object} Stream normalizzato
 */
function normalizeExternalStream(stream, addonKey) {
    const addon = EXTERNAL_ADDONS[addonKey];
    const text = stream.title || stream.description || stream.name || '';

    const infoHash = extractInfoHash(stream);

    // Debug: log infoHash extraction result (solo in verbose mode)
    if (DEBUG_MODE) console.log(`🔍 [Normalize] infoHash=${infoHash ? infoHash.substring(0, 8) + '...' : 'NULL'}, url=${stream.url?.substring(0, 60) || 'none'}...`);

    const filename = extractFilename(stream);
    const packTitle = extractPackTitle(stream); // 📁 = nome del pack/cartella
    const quality = extractQuality(stream.name || filename || text);
    const sizeInfo = extractSize(text);
    const seeders = extractSeeders(text);
    let originalProvider = extractOriginalProvider(text);
    if (addonKey === 'comet') {
        const cometProvider = normalizeCometProvider(originalProvider || '');
        originalProvider = isCometProviderCapitalized(cometProvider) ? cometProvider : null;
    } else if (addonKey === 'mediafusion') {
        originalProvider = normalizeMediaFusionProvider(originalProvider || null);
    }

    // Estrai dimensione da behaviorHints se disponibile
    let sizeBytes = sizeInfo.bytes;
    if (stream.behaviorHints?.videoSize) {
        sizeBytes = stream.behaviorHints.videoSize;
    }
    if (stream.video_size) {
        sizeBytes = stream.video_size;
    }

    // 🔧 FIX: Per i PACK, usa il pack title (📁) come titolo principale
    // Il filename (📄) è solo il nome dell'episodio singolo
    // Il pack title è il nome corretto del torrent
    const torrentTitle = packTitle || filename;

    return {
        // Campi principali per streaming
        infoHash: infoHash,
        fileIdx: stream.fileIdx ?? 0,

        // 🔧 FIX: Metadati - usa pack title se disponibile
        title: torrentTitle,           // Pack name (📁) oppure filename se non è un pack
        filename: filename,            // Sempre il nome del singolo file (📄)
        websiteTitle: torrentTitle,    // Same as title
        file_title: filename,          // 🔧 NEW: Preserva sempre il nome file episodio
        quality: quality || stream.resolution?.replace(/[^0-9kp]/gi, '') || '',
        size: sizeInfo.formatted || formatBytes(sizeBytes),
        mainFileSize: sizeBytes,
        seeders: seeders || stream.peers || 0,
        leechers: 0,

        // 🔧 Pack detection: if we have a pack title, it's definitely a pack
        rawDescription: text,  // Full description from addon (e.g. "📁 Filmografia Disney... 📄 Le Follie...")
        potentialPack: !!packTitle || (filename && text && !text.startsWith(filename) && text.length > filename.length + 20),
        packTitle: packTitle,  // 🔧 NEW: Store pack title separately for reference

        // Sorgente e tracking
        source: originalProvider ? `${addon.name} (${originalProvider})` : addon.name,
        externalAddon: addonKey,
        externalProvider: originalProvider,
        sourceEmoji: addon.emoji,

        // Magnet link (costruito da infoHash + trackers se disponibili)
        magnetLink: buildMagnetLink(infoHash, stream.sources),

        // Timestamp
        pubDate: new Date().toISOString()
    };
}

/**
 * Formatta bytes in stringa leggibile
 */
function formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Costruisce magnet link da infoHash e trackers
 */
function buildMagnetLink(infoHash, sources) {
    if (!infoHash) return null;

    let magnet = `magnet:?xt=urn:btih:${infoHash}`;

    // Aggiungi trackers se disponibili
    if (sources && Array.isArray(sources)) {
        const trackers = sources
            .filter(s => s.startsWith('tracker:') || s.startsWith('udp://') || s.startsWith('http'))
            .map(s => s.replace(/^tracker:/, ''))
            .slice(0, 10); // Limita a 10 trackers

        for (const tracker of trackers) {
            magnet += `&tr=${encodeURIComponent(tracker)}`;
        }
    }

    return magnet;
}

/**
 * Chiama TUTTI gli addon esterni in parallelo
 * 
 * @param {string} type - Tipo media (movie, series)
 * @param {string} id - ID Stremio
 * @param {Object} options - Opzioni: { enabledAddons: ['torrentio', 'mediafusion', 'comet'] }
 * @returns {Promise<Object>} Risultati per addon { torrentio: [...], mediafusion: [...], comet: [...] }
 */
async function fetchAllExternalAddons(type, id, options = {}) {
    const enabledAddons = options.enabledAddons || Object.keys(EXTERNAL_ADDONS);

    if (DEBUG_MODE) console.log(`\n🔗 [External Addons] Fetching from: ${enabledAddons.join(', ')}`);
    const startTime = Date.now();

    // Crea promise per ogni addon abilitato
    const promises = enabledAddons.map(async (addonKey) => {
        const results = await fetchExternalAddon(addonKey, type, id);
        return { addonKey, results };
    });

    // Esegui tutte in parallelo
    const settledResults = await Promise.allSettled(promises);

    // Organizza risultati per addon
    const resultsByAddon = {};
    let totalResults = 0;

    for (const result of settledResults) {
        if (result.status === 'fulfilled') {
            const { addonKey, results } = result.value;
            resultsByAddon[addonKey] = results;
            totalResults += results.length;
        } else {
            console.error(`❌ [External] Promise rejected:`, result.reason);
        }
    }

    const elapsed = Date.now() - startTime;
    if (DEBUG_MODE) console.log(`✅ [External Addons] Total: ${totalResults} results in ${elapsed}ms`);

    return resultsByAddon;
}

/**
 * Ritorna un array "flat" di tutti i risultati esterni, già normalizzati
 * 
 * @param {string} type - Tipo media
 * @param {string} id - ID Stremio
 * @param {Object} options - Opzioni
 * @returns {Promise<Array>} Array flat di tutti i risultati
 */
async function fetchExternalAddonsFlat(type, id, options = {}) {
    const resultsByAddon = await fetchAllExternalAddons(type, id, options);

    // Flatten tutti i risultati in un unico array
    const allResults = [];
    for (const addonKey of Object.keys(resultsByAddon)) {
        allResults.push(...resultsByAddon[addonKey]);
    }

    return allResults;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    EXTERNAL_ADDONS,
    fetchExternalAddon,
    fetchAllExternalAddons,
    fetchExternalAddonsFlat,
    normalizeExternalStream,
    extractInfoHash
};
