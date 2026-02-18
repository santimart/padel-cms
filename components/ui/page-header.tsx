import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  backHref = "/dashboard",
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
        <div className='flex items-center text-foreground rounded-full hover:bg-secondary/30 p-2 transition-colors duration-200'>
          <ChevronLeft className='w-6 h-6 ' />
        </div>
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">{title}</h1>
          {description && (
            <p className="text-foreground/50 text-lg">
              {description}
            </p>
          )}
        </div>
        {children && <div>{children}</div>}
      </div>
    </div>
  )
}
