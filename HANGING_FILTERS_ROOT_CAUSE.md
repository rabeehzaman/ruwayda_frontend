# Root Cause Analysis: Why Filters Hang After Idle Periods

## Quick Summary

Filters hang because the dashboard lacks mechanisms to detect and respond to:
1. Window/tab becoming invisible (Page backgrounded)
2. Browser window losing focus
3. Extended idle time without user interaction
4. Network connectivity changes triggering stale data

When filters change after these events, the application doesn't validate that the session is still active or refetch fresh data.

---

## The Seven Root Causes

### 1. No Visibility Change Detection

**Where it should be:** Root layout or Dashboard component

**What's missing:**
```javascript
// NOT IMPLEMENTED ANYWHERE
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page went into background
    // Should: Pause subscriptions, stop polling
  } else {
    // Page came back to foreground  
    // Should: Validate session, refresh all data
  }
})
```

**Current reality:**
- Only `/src/hooks/use-pwa.ts` has event listeners
- It only tracks `online`/`offline` status for a badge display
- No automatic data refresh when page returns

**Impact on filters:**
- If user has dashboard open but switches to another tab for 5+ minutes
- Then switches back and changes a filter
- The session may have expired, but app doesn't know
- Filters appear to "hang" because Supabase auth fails silently

---

### 2. No Window Focus/Blur Handlers

**Where it should be:** Root layout or Dashboard component

**What's missing:**
```javascript
// NOT IMPLEMENTED ANYWHERE
window.addEventListener('focus', () => {
  // Window gained focus - should refresh stale data
})

window.addEventListener('blur', () => {
  // Window lost focus - could pause background operations
})
```

**Current reality:**
- No focus/blur event listeners anywhere in the codebase
- Data fetching happens only when filters change
- No validation of data freshness when user returns

**Impact on filters:**
- User leaves dashboard open, steps away for 30 minutes
- Session expires on Supabase server
- User comes back and changes filters
- Request fails because token is expired
- Error is silently logged, UI appears to hang

---

### 3. No Idle Activity Detection

**Where it should be:** Root layout or Dashboard component

**What's missing:**
```javascript
// NOT IMPLEMENTED ANYWHERE
let idleTimeout = null
const IDLE_TIME = 5 * 60 * 1000 // 5 minutes

function resetIdleTimer() {
  clearTimeout(idleTimeout)
  idleTimeout = setTimeout(() => {
    console.log('User has been idle for 5 minutes')
    // Should: Warn user, force session refresh, or trigger re-auth
  }, IDLE_TIME)
}

window.addEventListener('mousemove', resetIdleTimer)
window.addEventListener('keypress', resetIdleTimer)
```

**Current reality:**
- No idle timer tracking at all
- No detection of how long user has been inactive
- Session can silently expire

**Impact on filters:**
- This is the PRIMARY cause of hanging filters
- User goes idle for >5 minutes
- Session/token expires server-side
- User changes a filter
- Request fails with auth error
- Error handler doesn't properly notify user or refetch
- UI appears to hang (loading state, no data, no error message)

---

### 4. No Automatic Session Validation

**Location:** `/src/contexts/auth-context.tsx`

**Current implementation:**
```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      // ...
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      // ...
    })

    return () => subscription.unsubscribe()
  }, []) // Only on mount!
}
```

**What's missing:**
```typescript
// NOT IMPLEMENTED:

// 1. No periodic validation during idle
// 2. No validation when page returns from background
// 3. No validation before filter changes
// 4. No re-auth prompt for expired sessions

// Missing:
const validateSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    // Session expired - need to handle this!
  }
}

// Should be called on visibility change, focus, etc.
```

**Impact on filters:**
- Auth state is checked only on initial app load
- If session expires after app is loaded, app doesn't know
- Next filter change silently fails with auth error

---

### 5. No Network Reconnection Handling

**Location:** `/src/hooks/use-pwa.ts`

**Current implementation:**
```typescript
useEffect(() => {
  setIsOnline(navigator.onLine)
  
  const handleOnline = () => setIsOnline(true)  // Just updates UI
  const handleOffline = () => setIsOnline(false) // Just updates UI
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])
```

**What's missing:**
```typescript
// NOT IMPLEMENTED:
const handleOnline = () => {
  setIsOnline(true)
  // Should also:
  // - Validate session
  // - Refetch all current data
  // - Clear error states
}
```

**Impact on filters:**
- User loses internet briefly
- UI shows "Offline" badge
- Connection restored
- App only updates badge, doesn't refetch data
- Cached data might be stale
- Next filter change might show stale results or fail

---

### 6. No Request Timeout

**Location:** All hooks in `/src/hooks/use-optimized-data.ts`

**Current implementation:**
```typescript
export function useOptimizedKPIs(dateRange?: DateRange, locationIds?: string[]) {
  useEffect(() => {
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await getOptimizedKPIs(startDate, endDate, locationIds)
        // No timeout on this call!
        setKpis(result)
      } catch (err) {
        // Could hang indefinitely if no response
      }
    }, 300)
  }, [...])
}
```

**What's missing:**
```typescript
// NOT IMPLEMENTED:
async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ])
}

// Then use it:
const result = await fetchWithTimeout(
  getOptimizedKPIs(startDate, endDate, locationIds),
  10000 // 10 second timeout
)
```

**Impact on filters:**
- Supabase query can hang indefinitely
- Browser might throttle/suspend background connections when tab is hidden
- When user returns, filter change triggers request
- If previous request is still pending, creates resource leak
- New request also hangs
- UI stuck in loading state

---

### 7. Error Handling Without Visibility to User

**Location:** `/src/lib/database-optimized.ts` and hooks

**Current implementation:**
```typescript
if (error) {
  console.error('Error fetching KPIs:', error)
  return null
}

// In hooks:
if (result) {
  setKpis(result)
} else {
  setError('Failed to load KPIs')
}
```

**What's wrong:**
```typescript
// When getOptimizedKPIs() returns null due to timeout or network error:
// 1. Error is logged to console
// 2. setError() is called with generic message
// 3. But the generic error message might not be shown to user
// 4. UI just stays in loading state

// No distinction between:
// - Network timeout (request took >10s)
// - Session expired (401 auth error)
// - Invalid data returned (parsing error)
// - Server error (500)
```

**Impact on filters:**
- User changes filter after being idle
- Request fails (for any reason)
- User sees generic error or nothing
- Doesn't know if they need to log back in
- Might try changing filters again (repeated failures)
- Appearance of "hanging" filters

---

## The Sequence of Events: How Filters Hang

```
1. User opens dashboard
   → Session is valid
   → Filters work fine

2. User steps away for 10 minutes (page stays open in browser)
   → Session expiration timer triggers server-side
   → Browser tab may be backgrounded/deprioritized
   → App doesn't know session expired (no validation)

3. User returns to browser and changes a filter
   → Custom hook detects filter change
   → 300ms debounce delay
   → After debounce, calls getOptimizedKPIs()
   → Supabase RPC call is made with expired token
   
4. Supabase returns 401 Unauthorized
   → (But also might return slowly or timeout due to network throttling)
   
5. Error handler runs:
   → Calls setError('Failed to load KPIs')
   → Sets loading to false
   → But error might not display properly to user
   → No automatic retry
   → No session refresh attempt

6. User sees:
   → Loading spinner briefly
   → Then nothing (error not visible)
   → Filters don't update
   → Appears to "hang"

7. If user tries again:
   → Same sequence repeats
   → Still doesn't work
   → Frustration builds
```

---

## Why These Root Causes Aren't Caught

### React Query is installed but unused
- `/package.json` includes `"@tanstack/react-query": "^5.90.6"`
- But no `QueryClientProvider` in app structure
- No `useQuery` hooks anywhere
- This would have provided:
  - `refetchOnWindowFocus: true` (automatic refresh when returning)
  - `refetchOnReconnect: true` (automatic refresh when online restored)
  - `staleTime` configuration (marks data as stale after duration)
  - Automatic retry with exponential backoff

### Custom hooks don't have these features
- Each hook manages its own state
- No cache awareness
- No coordination between components
- No built-in retry logic
- No stale data marking

### PWA Service Worker doesn't help
- SW caches static assets and pages
- But doesn't know about data freshness
- Doesn't validate API responses
- Doesn't trigger refresh on visibility change

---

## Prevention: The Fix

### Immediate (1-2 hours)

1. Add idle detection with refresh
2. Add visibility change handler  
3. Add focus/blur handlers
4. Add request timeout (10 seconds)

### Short term (1-2 days)

1. Implement React Query properly
2. Add session validation before filter changes
3. Add user-facing error messages
4. Add automatic retry logic

### Medium term (ongoing)

1. Configure all query options (staleTime, gcTime, retry, retryDelay)
2. Add background refresh periodic polling
3. Implement activity tracking
4. Add analytics for errors

---

## File Locations Summary

| Issue | File | Line(s) | Status |
|-------|------|---------|--------|
| No visibility change handler | Root layout | N/A | Not implemented |
| No focus/blur handler | Root layout | N/A | Not implemented |
| No idle detection | Root layout | N/A | Not implemented |
| No session validation | `/src/contexts/auth-context.tsx` | 67-94 | Only on mount |
| No reconnection refetch | `/src/hooks/use-pwa.ts` | 24-25 | Only badge update |
| No request timeout | All data fetching | Various | All hooks affected |
| Poor error display | All hooks | Various | Console only |
| Unused React Query | `/package.json` | Line 27 | Installed but not used |

