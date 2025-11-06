"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  loading?: boolean
  maxDisplay?: number
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  loading = false,
  maxDisplay = 2
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const selectedOptions = options.filter(option => value.includes(option.value))

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onValueChange(value.filter(v => v !== optionValue))
    } else {
      onValueChange([...value, optionValue])
    }
  }

  const handleSelectAll = () => {
    onValueChange(options.map(o => o.value))
  }

  const handleClearAll = () => {
    onValueChange([])
  }

  const handleRemove = (optionValue: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onValueChange(value.filter(v => v !== optionValue))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between hover:border-primary focus:ring-primary focus:border-primary min-h-[44px] h-auto", className)}
          disabled={disabled || loading}
        >
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            {loading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, maxDisplay).map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="text-xs"
                  >
                    <span className="max-w-[150px] truncate">{option.label}</span>
                    <X
                      className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer"
                      onClick={(e) => handleRemove(option.value, e)}
                    />
                  </Badge>
                ))}
                {selectedOptions.length > maxDisplay && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedOptions.length - maxDisplay} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0 w-[350px]")} align="start" sideOffset={8}>
        <div className="flex flex-col max-h-80">
          <div className="p-2 border-b space-y-2">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 focus:ring-primary focus:border-primary"
            />
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleClearAll}
                disabled={value.length === 0}
              >
                Clear All
              </Button>
              {value.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {value.length} selected
                </span>
              )}
            </div>
          </div>
          <div className="overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No options found.
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = value.includes(option.value)
                return (
                  <button
                    key={option.value || `option-${index}`}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 hover:text-primary flex items-center min-w-0 gap-2"
                    onClick={() => handleToggle(option.value)}
                    title={option.label}
                  >
                    <div className={cn(
                      "h-4 w-4 border rounded flex items-center justify-center shrink-0",
                      isSelected ? "bg-primary border-primary" : "border-input"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="truncate flex-1">{option.label}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
