'use client'

import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { QrCode, Copy, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TournamentQRDialogProps {
  tournamentId: string
  tournamentName: string
}

export function TournamentQRDialog({ tournamentId, tournamentName }: TournamentQRDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Use a fallback for server-side rendering, but update on client
  const [origin, setOrigin] = useState('')
  
  // Update origin on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  })

  const liveUrl = `${origin}/live/${tournamentId}`

  const handleDownloadQR = () => {
    const svg = document.getElementById('tournament-qr-code')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    // A4 dimensions at 150 DPI (approx 1240 x 1754 pixels)
    // Scale up for better quality
    const width = 1240
    const height = 1754

    img.onload = () => {
      canvas.width = width
      canvas.height = height
      
      if (!ctx) return

      // 1. Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)

      // 2. Decorative elements (optional header/footer bars)
      ctx.fillStyle = '#111827' // gray-900 (primary-like)
      ctx.fillRect(0, 0, width, 100)
      ctx.fillRect(0, height - 60, width, 60)

      // 3. Text Configuration
      ctx.fillStyle = '#111827'
      ctx.textAlign = 'center'

      // Title
      ctx.font = 'bold 60px "Inter", sans-serif'
      ctx.fillText('¡SEGUÍ EL TORNEO EN VIVO!', width / 2, 300)

      // Tournament Name
      ctx.font = 'bold 90px "Inter", sans-serif'
      // Handle very long names by wrapping or scaling (simple scaling here)
      const maxTextWidth = width - 200
      let fontSize = 90
      ctx.font = `bold ${fontSize}px "Inter", sans-serif`
      while (ctx.measureText(tournamentName.toUpperCase()).width > maxTextWidth && fontSize > 40) {
        fontSize -= 5
        ctx.font = `bold ${fontSize}px "Inter", sans-serif`
      }
      ctx.fillStyle = '#2563EB' // blue-600 (brand color)
      ctx.fillText(tournamentName.toUpperCase(), width / 2, 450)

      // Subtitle
      ctx.fillStyle = '#4B5563' // gray-600
      ctx.font = 'normal 40px "Inter", sans-serif'
      ctx.fillText('Resultados • Horarios • Cuadros', width / 2, 550)

      // 4. Draw QR Code
      // Center the QR code. Let's make it 600x600?
      const qrSize = 800
      const qrX = (width - qrSize) / 2
      const qrY = 700
      
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize)

      // 5. Call to Action below QR
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 40px "Inter", sans-serif'
      ctx.fillText('Escaneá el código para ver todo al instante', width / 2, qrY + qrSize + 100)
      
      // Footer text
      ctx.fillStyle = '#ffffff'
      ctx.font = 'normal 24px "Inter", sans-serif'
      ctx.fillText('Powered by ReRank', width / 2, height - 25)
      
      const pngFile = canvas.toDataURL('image/png')

      const downloadLink = document.createElement('a')
      downloadLink.download = `cartel-qr-${tournamentName.replace(/\s+/g, '-').toLowerCase()}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl)
    // Could add toast here
    alert('Enlace copiado al portapapeles')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="mr-2 h-4 w-4" />
          QR Vivo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Código QR del Torneo</DialogTitle>
          <DialogDescription>
            Escanea para acceder a los resultados en vivo y el cuadro.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <QRCodeSVG
              id="tournament-qr-code"
              value={liveUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          
          <div className="w-full space-y-4">
            <div className="space-y-2">
               <Label>Enlace directo</Label>
               <div className="flex gap-2">
                 <Input readOnly value={liveUrl} className="font-mono text-xs" />
                 <Button size="icon" variant="secondary" onClick={handleCopyLink} title="Copiar enlace">
                   <Copy className="h-4 w-4" />
                 </Button>
               </div>
            </div>

            <Button className="w-full" onClick={handleDownloadQR}>
              <Download className="mr-2 h-4 w-4" />
              Descargar PNG
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center px-4">
            Imprimí este código y colócalo en el club para que los espectadores sigan el torneo.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
