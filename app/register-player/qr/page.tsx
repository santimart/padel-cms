'use client'

import { useState } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function QRGeneratorPage() {
  const [tournamentId, setTournamentId] = useState('')
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const registrationUrl = tournamentId 
    ? `${baseUrl}/register-player/public?tournament=${tournamentId}`
    : `${baseUrl}/register-player/public`

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')

      const downloadLink = document.createElement('a')
      downloadLink.download = `qr-registro-jugadores${tournamentId ? `-torneo-${tournamentId}` : ''}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationUrl)
    alert('Link copiado al portapapeles')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">P</span>
              </div>
              <span className="text-xl font-bold">Padel Manager</span>
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/players">Jugadores</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/players" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
              ← Volver a jugadores
            </Link>
            <h1 className="text-3xl font-bold mb-2">Generar Código QR</h1>
            <p className="text-muted-foreground">
              Crea un código QR para que los jugadores se registren fácilmente
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración</CardTitle>
                <CardDescription>
                  Personaliza el código QR para tu torneo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tournamentId">ID del Torneo (Opcional)</Label>
                  <Input
                    id="tournamentId"
                    type="text"
                    placeholder="Dejar vacío para registro general"
                    value={tournamentId}
                    onChange={(e) => setTournamentId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Si especificas un ID de torneo, el jugador podrá registrarse directamente en ese torneo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Link de Registro</Label>
                  <div className="flex gap-2">
                    <Input
                      value={registrationUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button onClick={handleCopyLink} variant="outline" size="sm">
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <h3 className="font-semibold">Instrucciones de Uso</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Imprime el código QR y colócalo en tu club</li>
                    <li>Los jugadores escanean el QR con su celular</li>
                    <li>Completan sus datos en el formulario</li>
                    <li>Se agregan automáticamente a la base de datos global</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* QR Code Display */}
            <Card>
              <CardHeader>
                <CardTitle>Código QR</CardTitle>
                <CardDescription>
                  Escanea o descarga para usar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center p-8 bg-white rounded-lg">
                  <QRCodeSVG
                    id="qr-code"
                    value={registrationUrl}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="space-y-2">
                  <Button onClick={handleDownloadQR} className="w-full">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar QR como PNG
                  </Button>
                  <Button onClick={handleCopyLink} variant="outline" className="w-full">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar Link
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Tip: Coloca el QR en la entrada de tu club o en las canchas para que los jugadores se registren fácilmente
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Base de Datos Global</h3>
                  <p className="text-sm text-muted-foreground">
                    Los jugadores que se registren a través de este QR se agregarán a la base de datos global compartida entre todos los clubes. Esto significa que podrán participar en torneos de cualquier club sin necesidad de registrarse nuevamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
