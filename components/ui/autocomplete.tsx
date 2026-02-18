'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Option {
  id: string
  label: string
}

interface AutocompleteProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  loading?: boolean
  disabled?: boolean
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  emptyMessage = "No se encontraron resultados.",
  loading = false,
  disabled = false
}: AutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  
  // Find selected label
  const selectedOption = options.find(opt => opt.id === value) || options.find(opt => opt.label === value)
  
  // Helper to normalize strings (remove accents, lowercase)
  const normalize = (str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

  // Filter options based on input
  const filteredOptions = options.filter((option) =>
    normalize(option.label).includes(normalize(inputValue))
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal rounded-lg h-12 border-border bg-background/30 capitalize tracking-normal "
          disabled={disabled || loading}
        >
          {value
            ? (selectedOption?.label || value)
            : (loading ? "Cargando..." : placeholder)}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2 border-b">
          <Input 
            placeholder="Buscar..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Cargando...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className={cn(
                  "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
                  value === option.id ? "bg-accent text-accent-foreground" : ""
                )}
                onClick={() => {
                  onChange(option.id) // Or option.label if we want to store the name directly
                  setOpen(false)
                  setInputValue("") 
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
