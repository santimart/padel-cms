import { cn } from "@/lib/utils"

interface TournamentDetailItemProps {
  label: string
  children: React.ReactNode
  className?: string
  border?: boolean
}

export function TournamentDetailItem({ label, children, className, border = true }: TournamentDetailItemProps) {
  return (
    <div className={cn("flex flex-col mb-2", className, border  && "border-b border-border pb-2 last:border-b-0 last:pb-0")}>
      <div className="text-sm uppercase tracking-wider">{label}</div>
      <div className="text-md text-muted-foreground mt-1">
        {children}
      </div>
    </div>
  )
}
