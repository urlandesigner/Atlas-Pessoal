"use client"

import { Copy, FileText, MessageSquare } from "lucide-react"

import type { SiteFactoryProjectRecord } from "@/components/site-factory/site-factory-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function CopyButton({
  content,
  onCopy,
}: {
  content: string
  onCopy: (value: string, label: string) => void
}) {
  return (
    <Button variant="outline" size="sm" onClick={() => onCopy(content, "conteúdo")}>
      <Copy className="size-3.5" />
      Copiar
    </Button>
  )
}

export function SiteFactoryTabs({
  project,
  onCopy,
}: {
  project: SiteFactoryProjectRecord
  onCopy: (value: string, label: string) => void
}) {
  return (
    <Tabs defaultValue="files">
      <TabsList className="mb-5 flex w-full flex-wrap justify-start">
        <TabsTrigger value="files">Arquivos AI</TabsTrigger>
        <TabsTrigger value="prompts">Prompts</TabsTrigger>
      </TabsList>

      <TabsContent value="files" className="mt-0">
        <div className="grid gap-4">
          {project.files.map((file) => (
            <Card key={file.name} className="py-0">
              <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="size-4" />
                    <span className="truncate">{file.name}</span>
                  </CardTitle>
                </div>
                <CopyButton content={file.content} onCopy={onCopy} />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ScrollArea className="h-52 rounded-lg border bg-muted/20">
                  <pre className="whitespace-pre-wrap p-4 text-xs leading-5 text-muted-foreground">
                    {file.content}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="prompts" className="mt-0">
        <div className="grid gap-4">
          {project.prompts.map((prompt) => (
            <Card key={prompt.id} className="py-0">
              <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MessageSquare className="size-4" />
                    <span className="truncate">{prompt.title}</span>
                  </CardTitle>
                  <Badge variant="outline" className="mt-2 font-normal">
                    {prompt.id}
                  </Badge>
                </div>
                <CopyButton content={prompt.content} onCopy={onCopy} />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ScrollArea className="h-52 rounded-lg border bg-muted/20">
                  <pre className="whitespace-pre-wrap p-4 text-xs leading-5 text-muted-foreground">
                    {prompt.content}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
