'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

interface DashboardHeaderProps {
  complexName?: string
  logoUrl?: string | null
}

export function DashboardHeader({ complexName, logoUrl }: DashboardHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b border-border/40 bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            
            <img 
              src={logoUrl} 
              alt={complexName || 'Complex Logo'} 
              className="h-10 w-10 rounded-lg object-cover bg-muted"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">
                {complexName ? complexName.charAt(0).toUpperCase() : 'P'}
              </span>
            </div>
          )}
          <span className="text-xl font-bold truncate max-w-[200px] sm:max-w-none">
            {complexName || 'Padel Manager'}
          </span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}
