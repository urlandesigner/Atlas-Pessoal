import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function Metric({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  hint: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}
