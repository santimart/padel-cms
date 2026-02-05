import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">P</span>
            </div>
            <span className="text-xl font-bold">Padel Manager</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Gestiona Torneos de Pádel
            <span className="block text-primary mt-2">Como un Profesional</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema completo para organizar torneos, gestionar rankings y seguir resultados en tiempo real. 
            Diseñado para clubes de pádel amateur.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Comenzar Gratis
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Ver Torneos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <CardTitle>Base de Datos Global</CardTitle>
              <CardDescription>
                Los jugadores se registran una vez y pueden competir en cualquier club del circuito
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <CardTitle>Gestión Automática</CardTitle>
              <CardDescription>
                Generación automática de zonas, cuadros de playoffs y cálculo de clasificaciones
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <CardTitle>Ranking Anual</CardTitle>
              <CardDescription>
                Sistema de puntos estilo ATP que motiva a los jugadores a competir en todo el circuito
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-20 bg-card/30 rounded-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">¿Cómo Funciona?</h2>
        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
              1
            </div>
            <h3 className="font-semibold">Registro QR</h3>
            <p className="text-sm text-muted-foreground">
              Los jugadores escanean un código QR para registrarse en segundos
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
              2
            </div>
            <h3 className="font-semibold">Fase de Zonas</h3>
            <p className="text-sm text-muted-foreground">
              Round-robin automático en grupos de 3-4 parejas
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
              3
            </div>
            <h3 className="font-semibold">Playoffs</h3>
            <p className="text-sm text-muted-foreground">
              Cuadro de eliminación directa con sistema de byes
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
              4
            </div>
            <h3 className="font-semibold">Ranking</h3>
            <p className="text-sm text-muted-foreground">
              Actualización automática de puntos y posiciones
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="max-w-2xl mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl">¿Listo para Empezar?</CardTitle>
            <CardDescription className="text-lg">
              Únete a los clubes que ya están usando Padel Manager para organizar sus torneos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/register">
              <Button size="lg" className="text-lg px-12">
                Crear Cuenta Gratis
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Padel Manager. Sistema profesional de gestión de torneos de pádel.</p>
        </div>
      </footer>
    </div>
  )
}
