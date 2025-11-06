"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange: (value: string | undefined) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  loading?: boolean
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  loading = false
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const selectedOption = options.find(option => option.value === value)

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  const handleSelect = (optionValue: string) => {
    if (optionValue === value) {
      onValueChange(undefined)
    } else {
      onValueChange(optionValue)
    }
    setOpen(false)
    setSearchTerm("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange(undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between hover:border-primary focus:ring-primary focus:border-primary min-w-0", className)}
          disabled={disabled || loading}
        >
          {loading ? (
            <span className="truncate">Loading...</span>
          ) : selectedOption ? (
            <div className="flex items-center justify-between w-full min-w-0">
              <span className="truncate flex-1 text-left pr-2" title={selectedOption.label}>
                {selectedOption.label}
              </span>
              <X 
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100" 
                onClick={handleClear}
              />
            </div>
          ) : (
            <span className="text-muted-foreground truncate flex-1 text-left">{placeholder}</span>
          )}
          {!selectedOption && <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0 w-[300px]")} align="start" sideOffset={8}>
        <div className="flex flex-col max-h-64">
          <div className="p-2 border-b">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="overflow-y-auto">
            {value && (
              <button
                key="__clear__"
                className="w-full px-3 py-2 text-left text-sm text-muted-foreground italic hover:bg-muted/50 flex items-center"
                onClick={() => {
                  onValueChange(undefined)
                  setOpen(false)
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear selection
              </button>
            )}
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No options found.
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value || `option-${index}`}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 hover:text-primary flex items-center min-w-0"
                  onClick={() => handleSelect(option.value)}
                  title={option.label}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === option.value ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                  <span className="truncate flex-1">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}