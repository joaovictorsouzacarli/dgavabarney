"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getDiscordWebhook, saveDiscordWebhook } from "@/lib/supabase"
import { clearAllMor } from "@/lib/mor-storage"

export default function AdminSettings() {
  const [webhookUrl, setWebhookUrl] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificar autenticação
    const authToken = localStorage.getItem("adminAuth")
    const authTime = localStorage.getItem("adminAuthTime")

    if (!authToken || authToken !== "authenticated") {
      router.push("/admin/login")
      return
    }

    // Verificar se o token não expirou (24 horas)
    if (authTime) {
      const tokenAge = Date.now() - Number.parseInt(authTime)
      const twentyFourHours = 24 * 60 * 60 * 1000

      if (tokenAge > twentyFourHours) {
        localStorage.removeItem("adminAuth")
        localStorage.removeItem("adminAuthTime")
        router.push("/admin/login")
        return
      }
    }

    setIsAuthenticated(true)

    // Carregar webhook URL do banco de dados
    const loadWebhook = async () => {
      try {
        const webhook = await getDiscordWebhook()
        setWebhookUrl(webhook)
      } catch (error) {
        console.error("Erro ao carregar webhook:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWebhook()
  }, [router])

  const handleSaveWebhook = async () => {
    // Validar URL
    if (webhookUrl && !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
      alert("Por favor, insira uma URL de webhook válida do Discord")
      return
    }

    setIsSaving(true)

    try {
      await saveDiscordWebhook(webhookUrl)
      alert("Webhook do Discord salvo com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar webhook:", error)
      alert("Erro ao salvar webhook. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  const testWebhook = async () => {
    if (!webhookUrl) {
      alert("Por favor, insira uma URL de webhook primeiro")
      return
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "✅ Conexão com o sistema DG Avalon testada com sucesso!",
          username: "Sistema DG Avalon - Teste",
        }),
      })

      if (response.ok) {
        alert("Webhook testado com sucesso! Verifique o canal no Discord.")
      } else {
        alert("Falha ao testar o webhook. Verifique a URL e as permissões.")
      }
    } catch (error) {
      alert("Erro ao testar webhook: " + error)
    }
  }

  const clearMorList = async () => {
    if (confirm("Tem certeza que deseja limpar toda a lista MOR? Esta ação não pode ser desfeita.")) {
      setIsSaving(true)

      try {
        await clearAllMor()
        alert("Lista MOR limpa com sucesso!")
      } catch (error) {
        console.error("Erro ao limpar lista MOR:", error)
        alert("Erro ao limpar lista MOR. Tente novamente.")
      } finally {
        setIsSaving(false)
      }
    }
  }

  if (!isAuthenticated) {
    return <div>Carregando...</div>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-white flex items-center mb-4 hover:text-purple-300">
          <ArrowLeft className="mr-2" /> Voltar ao Painel
        </Link>

        <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm mb-6">
          <CardHeader className="text-center">
            <Image src="/logo.png" alt="Barney Logo" width={80} height={80} className="mx-auto mb-4 rounded-full" />
            <CardTitle className="text-2xl font-bold text-white">Configurações do Sistema</CardTitle>
            <CardDescription className="text-slate-300">
              Configure a integração com o Discord e outras opções
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="webhook" className="text-white">
                URL do Webhook do Discord
              </Label>
              <Input
                id="webhook"
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
              <div className="text-sm text-slate-400">
                Este webhook será usado para enviar notificações MOR para o canal configurado
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveWebhook} className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isSaving ? "Salvando..." : "Salvar Webhook"}
                </Button>
                <Button
                  onClick={testWebhook}
                  variant="outline"
                  className="border-purple-500 text-purple-300 hover:bg-purple-900/30"
                  disabled={isSaving}
                >
                  Testar Conexão
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-lg font-medium text-white mb-3">Gerenciamento de MOR</h3>
              <div className="space-y-3">
                <Button
                  onClick={clearMorList}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isSaving}
                >
                  Limpar Lista MOR
                </Button>
                <div className="text-sm text-slate-400">
                  Esta ação irá remover todos os jogadores da lista de prioridade MOR
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Ajuda - Configuração de Webhook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-300">
            <p>Para configurar o webhook do Discord:</p>
            <ol className="list-decimal list-inside space-y-2 pl-4">
              <li>Acesse as configurações do servidor no Discord</li>
              <li>Vá para "Integrações" e depois "Webhooks"</li>
              <li>Clique em "Novo Webhook"</li>
              <li>Dê um nome como "DG Avalon Sistema"</li>
              <li>Selecione o canal "MOR" como destino</li>
              <li>Copie a URL do webhook e cole no campo acima</li>
              <li>Salve as configurações</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
