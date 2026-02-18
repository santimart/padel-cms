import Link from 'next/link'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  href: string
  title: string
  description: string
  icon: React.ReactNode
  borderColor?: string
  className?: string;
}

export function DashboardCard({ href, title, description, icon, className, borderColor = "border-border/50" }: DashboardCardProps) {
  return (
    <Link href={href}>
      <Card className={cn("hover:border-primary transition-colors cursor-pointer h-full py-6", borderColor, className)}>
        <CardHeader>
          <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-4 text-primary">
            {icon}
          </div>
          <CardTitle className='text-2xl font-medium'>{title}</CardTitle>
          <CardDescription className='text-md'>
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
