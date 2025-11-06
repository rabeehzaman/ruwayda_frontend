import { useState, useEffect } from 'react'

/**
 * Custom hook for debounced search functionality
 * Prevents excessive API calls while user is typing
 */
export function useDebouncedSearch(initialValue: string = '', delay: number = 500) {
  const [searchValue, setSearchValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchValue)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [searchValue, delay])

  return {
    searchValue,
    debouncedValue,
    setSearchValue
  }
}