'use client'

import React from 'react'
import Link from 'next/link'
import { ProfileMenu } from '@/components/dashboard/profile-menu'
import { useScrollDirection } from '@/hooks/use-scroll-direction'

interface DashboardHeaderProps {
  complexName?: string
  logoUrl?: string | null
}

export function DashboardHeader({ complexName, logoUrl }: DashboardHeaderProps) {
  const { scrollDirection, isTop } = useScrollDirection();

  return (
    <header className={`sticky top-0 z-50 mb-10 bg-white/40 transition-transform duration-300 ease-in-out ${
      scrollDirection === 'down' && !isTop ? '-translate-y-full' : 'translate-y-0'
    }`}>
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
            {complexName || 'ReRank'}
          </span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <ProfileMenu />
        </nav>
      </div>
    </header>
  )
}
