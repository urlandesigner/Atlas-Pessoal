import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="size-8 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-background text-sm font-bold">A</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Atlas</span>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Entrar</CardTitle>
            <CardDescription>Acesse sua conta para continuar</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input id="email" type="email" placeholder="seu@email.com" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="password">Senha</label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full">Entrar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
