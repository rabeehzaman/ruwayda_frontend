# Dashboard Architecture Analysis - Data Fetching & State Management

## Executive Summary

This dashboard uses a custom hook-based architecture with Supabase for data fetching. **React Query/TanStack Query is installed but NOT actively used**. The system lacks visibility/focus change handlers and automatic refresh mechanisms, which could cause filters to hang during idle periods.

---

## 1. SUPABASE CLIENT INITIALIZATION

### Configuration Location
**File:** `/src/lib/supabase.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
```

### Key Characteristics:
- **Client Type:** Browser-based SSR client (not server-side)
- **Authentication:** Anon key based (public access)
- **Initialization:** Singleton pattern, initialized on module load
- **No custom configuration:** Uses Supabase defaults with no custom timeouts, retry policies, or connection management

### Critical Issue Identified:
- No explicit timeout configuration for database connections
- No automatic reconnection logic on network failures
- No connection pooling or session management

---

## 2. REACT QUERY / TANSTACK QUERY CONFIGURATION

### Status: **INSTALLED BUT NOT USED**

**Package.json:**
```json
"@tanstack/react-query": "^5.90.6"
```

### Current Usage:
- **React Query is imported in package.json BUT NOT instantiated anywhere**
- **No QueryClientProvider found in layout or app structure**
- **All data fetching is done via direct Supabase calls in custom hooks**
- **No query caching, no automatic refetching, no staleTime/cacheTime configuration**

### Implications:
- Every filter change triggers a fresh database query (no caching)
- No built-in retry logic or exponential backoff
- No automatic stale query handling
- No background refetch capability
- No normalized caching across components

---

## 3. CUSTOM HOOKS DATA FETCHING ARCHITECTURE

### Primary Data Hooks
**Location:** `/src/hooks/use-optimized-data.ts`

#### Hook: `useOptimizedKPIs`
```typescript
export function useOptimizedKPIs(dateRange?: DateRange, locationIds?: string[]) {
  const [kpis, setKpis] = useState<OptimizedKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Debounce by 300ms
    debounceTimerRef.current = setTimeout(async () => {
      // Fetch with abort signal...
    }, 300)
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [dateRange?.from?.getTime(), dateRange?.to?.getTime(), locationKey])
```

**Characteristics:**
- **Debounce:** 300ms delay on filter changes
- **Abort Control:** Uses AbortController to cancel in-flight requests
- **No Cache:** State is local to component, recreated on mount
- **No Retry Logic:** Single attempt per filter change
- **Dependencies:** Fully depends on dateRange and locationIds changes

#### Hook: `useOptimizedProfitByInvoice`
```typescript
export function useOptimizedProfitByInvoice(
  dateRange?: DateRange,
  locationIds?: string[],
  pageSize: number = 10000,
  customerFilter?: string,
  invoiceFilter?: string
) {
  // Similar structure with pagination
  // 300ms debounce, AbortController, no caching
  
  useEffect(() => {
    // Debounce the load by 300ms
    debounceTimerRef.current = setTimeout(() => {
      loadPage(0)
    }, 300)
    
    // Cleanup...
  }, [dateRange, locationIds, pageSize, customerFilter, invoiceFilter])
}
```

**Characteristics:**
- Pagination handled server-side (RPC functions)
- 300ms debounce for filter changes
- **Missing:** Idle time refresh, visibility change detection
- **Missing:** Automatic retry after network reconnection

---

## 4. SERVICE WORKER & PWA CONFIGURATION

### Manifest
**File:** `/public/manifest.json`
```json
{
  "name": "Business Analytics Dashboard",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAF9F5",
  "theme_color": "#FAF9F5"
}
```

### Service Worker
**File:** `/public/swe-worker-5c72df51bb1f6ee0.js`
- Minified Next.js SWE worker (auto-generated)
- Handles caching strategies:
  - `__START_URL_CACHE__`: Cache home page
  - `__FRONTEND_NAV_CACHE__`: Cache navigated pages
  - `__STATIC_STYLE_ASSETS__`: Cache stylesheets
  - `__NEXT_STATIC_JS_ASSETS__`: Cache JS chunks

### PWA Hook
**File:** `/src/hooks/use-pwa.ts`
```typescript
useEffect(() => {
  setIsOnline(navigator.onLine)
  
  const handleOnline = () => setIsOnline(true)
  const handleOffline = () => setIsOnline(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])
```

**Characteristics:**
- **Only tracks online/offline status** - displays badge
- **No automatic refetch on reconnection**
- **No visibility change handling**
- **No page focus/blur event handling**

### Critical Missing Feature:
```typescript
// THIS IS NOT IMPLEMENTED:
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause data fetching
  } else {
    // Resume and refresh data
  }
})

window.addEventListener('focus', () => {
  // Refetch potentially stale data
})
```

---

## 5. AUTH TOKEN REFRESH LOGIC

### Location: `/src/contexts/auth-context.tsx`

```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchPermissions(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        const perms = await fetchPermissions(session.user.id)
        setPermissions(perms)
      }
    })

    return () => subscription.unsubscribe()
  }, [])
```

**Characteristics:**
- **Initial session check:** One-time on mount
- **Auth state listener:** Supabase SDK handles auto-refresh internally
- **No manual token refresh:** Relies entirely on Supabase SDK's default behavior
- **No token expiry handling:** No explicit timeout for token refresh
- **Permission cache:** Fetched once per auth state change, never manually refreshed

### Token Refresh Details:
- **Mechanism:** Supabase's `onAuthStateChange` subscription handles background refresh
- **No timeout:** Supabase uses default JWT refresh interval (likely based on token expiry)
- **No idle timer reset:** Doesn't track user activity for session extension

---

## 6. TIMEOUT CONFIGURATIONS

### Locations Found:

#### A. Filter Debounce (300ms)
```typescript
// In use-optimized-data.ts hooks
debounceTimerRef.current = setTimeout(async () => {
  // Execute fetch after 300ms delay
}, 300)
```

#### B. Tab Switch Animation (0ms)
```typescript
// In optimized-tabbed-tables.tsx
setTimeout(() => {
  setContentTab(newTab)
  setSwitchingTab(false)
}, 0) // Deferred to next frame
```

#### C. Database Wait (100ms) - Fallback Logic
```typescript
// In database-optimized.ts
await new Promise(resolve => setTimeout(resolve, 100))
```

### Critical Missing Timeouts:
- **No network request timeout:** Supabase calls can hang indefinitely
- **No idle timeout:** No inactivity detection
- **No session timeout:** No logout after X minutes of idle time
- **No refresh interval:** No periodic data refresh while user is idle
- **No connection timeout:** Service Worker cache never expires

---

## 7. ERROR HANDLING PATTERNS IN DATA FETCHING HOOKS

### Pattern 1: Basic Error State Capture
```typescript
try {
  const result = await getOptimizedKPIs(startDate, endDate, locationIds)
  
  if (result) {
    setKpis(camelCaseKpis)
  } else {
    setError('Failed to load KPIs')
  }
} catch (err) {
  console.error('Error loading KPIs:', err)
  setError('Failed to load KPIs')
  setKpis(null)
} finally {
  if (!signal.aborted) {
    setLoading(false)
  }
}
```

### Pattern 2: RPC Function Fallback
```typescript
let { data, error } = await supabase.rpc('get_dashboard_kpis_2025_optimized', {...})

if (error || !data) {
  console.log('2025 function failed, trying fallback...')
  const fallback = await supabase.rpc('get_dashboard_kpis', {...})
  data = fallback.data
  error = fallback.error
}

if (error) {
  console.error('Error fetching KPIs:', error)
  return null
}
```

### Issues with Current Error Handling:
- **Silent failures:** Errors only logged to console
- **No user notification:** No toast/alert for failures
- **No retry mechanism:** Failed requests not retried
- **No exponential backoff:** Immediate fallback or failure
- **No network error detection:** Treats all errors the same
- **No timeout errors:** Hanging requests never timeout

---

## 8. VISIBILITY CHANGE & FOCUS HANDLERS

### Current Implementation: NONE

**Search Results:** No `visibilitychange`, `focus`, or `blur` event listeners found in dashboard code.

### Only Found:
1. **Online/Offline Detection** (use-pwa.ts):
   ```typescript
   window.addEventListener('online', handleOnline)
   window.addEventListener('offline', handleOffline)
   ```
   - Only updates UI badge, doesn't trigger refetch

2. **PWA Install Listeners** (use-pwa.ts):
   ```typescript
   window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
   window.addEventListener('appinstalled', handleAppInstalled)
   ```
   - Installation events only, no data refresh

### Missing Critical Handlers:
```typescript
// NOT IMPLEMENTED:
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page became visible - refetch data
    // Check if session expired
    // Reset idle timers
  }
})

window.addEventListener('focus', () => {
  // Window gained focus
  // Refresh stale data
})

window.addEventListener('blur', () => {
  // Window lost focus
  // Pause background operations
})
```

---

## 9. OVERALL ARCHITECTURE SUMMARY

### Data Flow:
```
User Action (Filter Change)
    ↓
[300ms Debounce]
    ↓
Custom Hook (useOptimized*)
    ↓
Direct Supabase RPC/Query
    ↓
Parse Response
    ↓
Local Component State (No Cache)
    ↓
UI Update
```

### State Management:
- **Provider:** Auth Context only (not Query Provider)
- **Data Caching:** None (no React Query)
- **Cache Strategy:** Each component manages its own state
- **Cache Invalidation:** Happens when dependencies change (filter, date, etc.)

### Why Filters Hang During Idle:

1. **No Activity Detection:**
   - No tracking of user keyboard/mouse events
   - No detection of page visibility changes

2. **No Automatic Refresh:**
   - Data is only fetched when filters change
   - No background refresh during idle time
   - No periodic polling

3. **No Session Validation:**
   - Auth token refresh happens at Supabase level
   - No application-level session check
   - Token could be invalid but app doesn't know

4. **No Network Reconnection Handling:**
   - Online/offline status tracked but doesn't trigger refetch
   - Service Worker caches may become stale
   - No automatic retry on network restoration

5. **No Idle Timeout:**
   - User can stay idle indefinitely
   - Session might expire silently
   - Filters would fail silently on next interaction

---

## 10. RECOMMENDATIONS TO FIX HANGING FILTERS

### Priority 1: Add Idle Detection & Refresh
```typescript
// Add to root layout or dashboard
useEffect(() => {
  let idleTimer: NodeJS.Timeout
  let isIdle = false

  const resetIdleTimer = () => {
    clearTimeout(idleTimer)
    if (isIdle) {
      isIdle = false
      // Trigger data refresh
      queryClient.invalidateQueries()
    }
    idleTimer = setTimeout(() => {
      isIdle = true
    }, 5 * 60 * 1000) // 5 minutes
  }

  window.addEventListener('mousemove', resetIdleTimer)
  window.addEventListener('keypress', resetIdleTimer)
  
  return () => {
    window.removeEventListener('mousemove', resetIdleTimer)
    window.removeEventListener('keypress', resetIdleTimer)
  }
}, [])
```

### Priority 2: Add Visibility Change Handler
```typescript
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (!document.hidden) {
      // Page became visible - refresh data
      await authContext.refreshPermissions()
      queryClient.invalidateQueries()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [])
```

### Priority 3: Implement React Query
```typescript
// Replace custom hooks with React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['kpis', dateRange, locationIds],
  queryFn: () => getOptimizedKPIs(startDate, endDate, locationIds),
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: 2,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
})
```

### Priority 4: Add Request Timeout
```typescript
// Wrap Supabase calls with timeout
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    )
  ])
}

const result = await withTimeout(
  supabase.rpc('get_dashboard_kpis_2025_optimized', {...}),
  10000 // 10 second timeout
)
```

### Priority 5: Add Online/Offline Reconnection
```typescript
useEffect(() => {
  const handleOnline = () => {
    console.log('Connection restored')
    // Validate session and refresh data
    authContext.refreshPermissions()
    queryClient.invalidateQueries()
  }

  window.addEventListener('online', handleOnline)
  return () => window.removeEventListener('online', handleOnline)
}, [])
```

---

## 11. DEPENDENCY SUMMARY

| Aspect | Current | Status | Impact |
|--------|---------|--------|--------|
| Caching | None (custom state) | Missing | No reuse of previous queries |
| Auto-refresh | Debounce only | Incomplete | No idle refresh |
| Retry Logic | Fallback RPC only | Basic | No exponential backoff |
| Timeout | None on requests | Missing | Can hang indefinitely |
| Visibility | PWA status only | Missing | No pause on tab switch |
| Offline | Status badge only | Incomplete | No auto-refetch on reconnect |
| Session | Supabase auto-refresh | Partial | No app-level validation |
| Error Recovery | Silent failures | Poor | No user feedback |

