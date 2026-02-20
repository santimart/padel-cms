'use client'

import { useState } from 'react'
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

interface RankingQRDialogProps {
  rankingId: string
  rankingName: string
}

export function RankingQRDialog({ rankingId, rankingName }: RankingQRDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const [origin, setOrigin] = useState('')

  useState(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  })

  const publicUrl = `${origin}/ranking/${rankingId}`

  const handleDownloadQR = () => {
    const svg = document.getElementById('ranking-qr-code')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    const width = 1240
    const height = 1754

    img.onload = () => {
      canvas.width = width
      canvas.height = height

      if (!ctx) return

      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)

      // Header bar
      ctx.fillStyle = '#111827'
      ctx.fillRect(0, 0, width, 100)
      ctx.fillRect(0, height - 60, width, 60)

      // Title
      ctx.fillStyle = '#111827'
      ctx.textAlign = 'center'
      ctx.font = 'bold 60px "Inter", sans-serif'
      ctx.fillText('¡CONSULTÁ EL RANKING!', width / 2, 300)

      // Ranking Name
      const maxTextWidth = width - 200
      let fontSize = 90
      ctx.font = `bold ${fontSize}px "Inter", sans-serif`
      while (ctx.measureText(rankingName.toUpperCase()).width > maxTextWidth && fontSize > 40) {
        fontSize -= 5
        ctx.font = `bold ${fontSize}px "Inter", sans-serif`
      }
      ctx.fillStyle = '#2563EB'
      ctx.fillText(rankingName.toUpperCase(), width / 2, 450)

      // Subtitle
      ctx.fillStyle = '#4B5563'
      ctx.font = 'normal 40px "Inter", sans-serif'
      ctx.fillText('Posiciones • Puntos • Torneos', width / 2, 550)

      // Draw QR Code
      const qrSize = 800
      const qrX = (width - qrSize) / 2
      const qrY = 700

      ctx.drawImage(img, qrX, qrY, qrSize, qrSize)

      // CTA
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 40px "Inter", sans-serif'
      ctx.fillText('Escaneá el código para ver las posiciones', width / 2, qrY + qrSize + 100)

      // Footer
      ctx.fillStyle = '#ffffff'
      ctx.font = 'normal 24px "Inter", sans-serif'
      ctx.fillText('Powered by ReRank', width / 2, height - 25)

      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `cartel-ranking-${rankingName.replace(/\s+/g, '-').toLowerCase()}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    alert('Enlace copiado al portapapeles')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="mr-2 h-4 w-4" />
          QR Ranking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Código QR del Ranking</DialogTitle>
          <DialogDescription>
            Compartí el ranking públicamente para que los jugadores vean sus posiciones.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <QRCodeSVG
              id="ranking-qr-code"
              value={publicUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-2">
              <Label>Enlace directo</Label>
              <div className="flex gap-2">
                <Input readOnly value={publicUrl} className="font-mono text-xs" />
                <Button size="icon" variant="secondary" onClick={handleCopyLink} title="Copiar enlace">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={handleDownloadQR}>
              <Download className="mr-2 h-4 w-4" />
              Descargar Cartel PNG
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center px-4">
            Imprimí este código y colócalo en el club para que los jugadores consulten el ranking.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
