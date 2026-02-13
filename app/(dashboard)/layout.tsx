import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch complex for this user
  const { data: complex } = await (supabase
    .from('complexes')
    .select('name, logo_url')
    .eq('owner_id', user.id)
    .single() as any)

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader 
        complexName={complex?.name} 
        logoUrl={complex?.logo_url} 
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
