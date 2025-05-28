"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Dice6, CheckCircle, XCircle, Clock, Settings, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { sendMorToDiscord, notifyMorRemovalToDiscord } from "@/lib/discord"
import { saveMor, removeMor, hasMor, getMorList } from "@/lib/mor-storage"

interface ParticipantData {
  id: string
  playerName: string
  role: string
  ip: number
  timestamp: number
  status?: "selected" | "mor" | "pending"
}

interface GroupedParticipants {
  [role: string]: ParticipantData[]
}

// Cores para cada tipo de função/classe
const roleCategories = {
  // Tanques
  "Off Tank": { color: "bg-blue-600", category: "Tank" },
  Elevado: { color: "bg-blue-700", category: "Tank" },

  // Controle
  Silence: { color: "bg-indigo-600", category: "Controle" },

  // Cura
  Healer: { color: "bg-green-600", category: "Healer" },
  "Raiz Ferrea (Party Heal)": { color: "bg-green-700", category: "Healer" },

  // DPS
  "DPS - Frost": { color: "bg-cyan-500", category: "DPS" },
  "DPS - Fire": { color: "bg-red-600", category: "DPS" },
  "DPS - Aguia": { color: "bg-amber-500", category: "DPS" },
  "DPS - Xbow": { color: "bg-orange-600", category: "DPS" },
  "DPS - Raiz Ferrea": { color: "bg-emerald-600", category: "DPS" },

  // Especiais
  Roletroll: { color: "bg-purple-600", category: "Especial" },
  Scout: { color: "bg-teal-600", category: "Especial" },
  Oculto: { color: "bg-slate-500", category: "Especial" },

  // Debuff
  "Debuff - Quebrareinos": { color: "bg-pink-600", category: "Debuff" },
  "Debuff - Incubo": { color: "bg-rose-600", category: "Debuff" },
  "Debuff - Bruxo": { color: "bg-fuchsia-600", category: "Debuff" },
}

export default function AdminPanel() {
  const [participants, setParticipants] = useState<ParticipantData[]>([])
  const [groupedParticipants, setGroupedParticipants] = useState<GroupedParticipants>({})
  const [selectedParticipants, setSelectedParticipants] = useState<ParticipantData[]>([])
  const [morParticipants, setMorParticipants] = useState<ParticipantData[]>([])
  const [loading, setLoading] = useState(false)
  const [morListFromStorage, setMorListFromStorage] = useState<any[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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

    // Carregar dados do localStorage
    const data = JSON.parse(localStorage.getItem("participants") || "[]")

    // Verificar MORs existentes para marcar participantes
    const existingMorList = getMorList()
    setMorListFromStorage(existingMorList)

    // Marcar participantes que já têm MOR
    const dataWithMorStatus = data.map((participant: ParticipantData) => {
      if (hasMor(participant.id)) {
        return { ...participant, status: "mor" }
      }
      return participant
    })

    setParticipants(dataWithMorStatus)

    // Agrupar por função
    const grouped = dataWithMorStatus.reduce((acc: GroupedParticipants, participant: ParticipantData) => {
      if (!acc[participant.role]) {
        acc[participant.role] = []
      }
      acc[participant.role].push(participant)
      return acc
    }, {})

    // Ordenar por IP (maior para menor)
    Object.keys(grouped).forEach((role) => {
      grouped[role].sort((a, b) => b.ip - a.ip)
    })

    setGroupedParticipants(grouped)

    // Contar participantes já selecionados ou com MOR
    const selected = dataWithMorStatus.filter((p: ParticipantData) => p.status === "selected")
    const mor = dataWithMorStatus.filter((p: ParticipantData) => p.status === "mor")

    setSelectedParticipants(selected)
    setMorParticipants(mor)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("adminAuth")
    localStorage.removeItem("adminAuthTime")
    router.push("/admin/login")
  }

  const handleSelectParticipant = async (participant: ParticipantData) => {
    setLoading(true)

    // Verificar se já foi selecionado para evitar duplicação
    if (participant.status === "selected") {
      alert("Este jogador já foi selecionado!")
      setLoading(false)
      return
    }

    // Verificar se o participante tinha MOR e notificar a remoção
    if (hasMor(participant.id)) {
      const morData = removeMor(participant.id)

      // Notificar no Discord que o MOR foi usado
      if (morData) {
        await notifyMorRemovalToDiscord(participant.playerName)
      }
    }

    // Adicionar à lista de selecionados
    setSelectedParticipants((prev) => [...prev, participant])
    setParticipants((prev) => prev.map((p) => (p.id === participant.id ? { ...p, status: "selected" } : p)))
    setMorParticipants((prev) => prev.filter((p) => p.id !== participant.id))

    setLoading(false)
  }

  const handleDeselectParticipant = (participant: ParticipantData) => {
    // Remover da lista de selecionados
    setSelectedParticipants((prev) => prev.filter((p) => p.id !== participant.id))

    // Voltar status para pendente
    setParticipants((prev) => prev.map((p) => (p.id === participant.id ? { ...p, status: undefined } : p)))

    // Atualizar o groupedParticipants
    setGroupedParticipants((prev) => {
      const updated = { ...prev }
      if (updated[participant.role]) {
        updated[participant.role] = updated[participant.role].map((p) =>
          p.id === participant.id ? { ...p, status: undefined } : p,
        )
      }
      return updated
    })
  }

  const handleMorParticipant = async (participant: ParticipantData) => {
    setLoading(true)

    // Verificar se o webhook está configurado
    const webhookUrl = localStorage.getItem("discordWebhook")

    let discordMessageId = null

    if (webhookUrl) {
      // Enviar para o Discord apenas se o webhook estiver configurado
      discordMessageId = await sendMorToDiscord(participant.playerName)
    } else {
      // Mostrar aviso amigável se não estiver configurado
      alert(
        "⚠️ Webhook do Discord não configurado. O MOR foi salvo localmente, mas não foi enviado para o Discord. Configure o webhook em Configurações.",
      )
    }

    // Salvar MOR com o ID da mensagem (ou null se não enviou)
    saveMor(participant.id, participant.playerName, discordMessageId)

    // Atualizar interface
    setMorParticipants((prev) => [...prev, participant])
    setParticipants((prev) => prev.map((p) => (p.id === participant.id ? { ...p, status: "mor" } : p)))

    setLoading(false)

    if (webhookUrl) {
      alert(`${participant.playerName} foi adicionado à lista MOR e notificado no Discord!`)
    } else {
      alert(
        `${participant.playerName} foi adicionado à lista MOR! (Configure o webhook do Discord para enviar notificações automáticas)`,
      )
    }
  }

  const handleTrollRaffle = (trollParticipants: ParticipantData[]) => {
    if (trollParticipants.length === 0) return

    const availableTrolls = trollParticipants.filter((p) => !p.status)
    if (availableTrolls.length === 0) {
      alert("Todos os Roletrolls já foram selecionados ou estão em MOR!")
      return
    }

    const randomIndex = Math.floor(Math.random() * availableTrolls.length)
    const selectedTroll = availableTrolls[randomIndex]

    handleSelectParticipant(selectedTroll)
    alert(`🎲 Roletroll sorteado: ${selectedTroll.playerName}!`)
  }

  const getParticipantStatus = (participant: ParticipantData) => {
    if (participant.status === "selected") return "Selecionado"
    if (participant.status === "mor") return "MOR"
    return "Pendente"
  }

  const getStatusColor = (participant: ParticipantData) => {
    if (participant.status === "selected") return "bg-green-500"
    if (participant.status === "mor") return "bg-orange-500"
    return "bg-gray-500"
  }

  const clearData = () => {
    // Não limpar a lista MOR, apenas os participantes atuais
    localStorage.removeItem("participants")
    setParticipants([])
    setGroupedParticipants({})
    setSelectedParticipants([])
    // Não limpar MOR aqui: setMorParticipants([])

    alert("Dados limpos! A lista MOR foi mantida para a próxima disputa.")
  }

  const getRoleColor = (role: string) => {
    return roleCategories[role as keyof typeof roleCategories]?.color || "bg-gray-500"
  }

  if (!isAuthenticated) {
    return <div>Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6 bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-end absolute right-4 top-4 gap-2">
              <Link href="/admin/settings">
                <Button variant="ghost" size="icon" className="text-white hover:bg-slate-700/50">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="text-white hover:bg-slate-700/50" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
            <Image src="/logo.png" alt="Barney Logo" width={80} height={80} className="mx-auto mb-4 rounded-full" />
            <CardTitle className="text-3xl font-bold text-white">Painel do Caller - DG Avalon</CardTitle>
            <CardDescription className="text-slate-300">
              Gerencie as inscrições e monte a composição da party
            </CardDescription>
            {morListFromStorage.length > 0 && (
              <div className="mt-4">
                <Badge className="bg-orange-500 text-white">
                  {morListFromStorage.length} jogador(es) com prioridade MOR da disputa anterior
                </Badge>
              </div>
            )}
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Total de Inscrições
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-400">{participants.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Selecionados ({selectedParticipants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedParticipants.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedParticipants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between bg-slate-700/30 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{participant.playerName}</span>
                        <Badge className="bg-green-500 text-white text-xs">{participant.role}</Badge>
                      </div>
                      <Button
                        onClick={() => handleDeselectParticipant(participant)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 w-6 p-0"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-3xl font-bold text-green-400">0</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                MOR (Prioridade)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-400">{morParticipants.length + morListFromStorage.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedParticipants).map(([role, roleParticipants]) => (
            <Card key={role} className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${getRoleColor(role)}`} />
                    {role} ({roleParticipants.length})
                  </CardTitle>
                  {role === "Roletroll" && roleParticipants.length > 0 && (
                    <Button
                      onClick={() => handleTrollRaffle(roleParticipants)}
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={loading}
                    >
                      <Dice6 className="w-4 h-4 mr-2" />
                      Sortear Roletroll
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {roleParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-white font-semibold">{participant.playerName}</h3>
                          <p className="text-slate-400 text-sm">IP: {participant.ip.toLocaleString()}</p>
                        </div>
                        <Badge className={`${getStatusColor(participant)} text-white`}>
                          {getParticipantStatus(participant)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {!participant.status && (
                          <>
                            <Button
                              onClick={() => handleSelectParticipant(participant)}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                              disabled={loading}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Selecionar
                            </Button>
                            <Button
                              onClick={() => handleMorParticipant(participant)}
                              className="bg-orange-600 hover:bg-orange-700"
                              size="sm"
                              disabled={loading}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              MOR
                            </Button>
                          </>
                        )}
                        {participant.status === "mor" && (
                          <Button
                            onClick={() => handleSelectParticipant(participant)}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                            disabled={loading}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Remover MOR e Selecionar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {morListFromStorage.length > 0 && (
          <Card className="mt-6 bg-slate-800/50 border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Jogadores com Prioridade MOR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {morListFromStorage.map((mor) => (
                  <div key={mor.playerId} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <h3 className="text-white font-semibold">{mor.playerName}</h3>
                      <p className="text-slate-400 text-sm">Desde: {new Date(mor.timestamp).toLocaleString()}</p>
                    </div>
                    <Button
                      onClick={async () => {
                        setLoading(true)

                        // Notificar no Discord sobre a remoção
                        const webhookUrl = localStorage.getItem("discordWebhook")
                        if (webhookUrl) {
                          await notifyMorRemovalToDiscord(mor.playerName)
                        }

                        removeMor(mor.playerId)
                        setMorListFromStorage((prev) => prev.filter((m) => m.playerId !== mor.playerId))
                        setLoading(false)

                        if (webhookUrl) {
                          alert(`${mor.playerName} foi removido da lista MOR e notificado no Discord.`)
                        } else {
                          alert(`${mor.playerName} foi removido da lista MOR.`)
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700"
                      size="sm"
                      disabled={loading}
                    >
                      Remover MOR
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex justify-center gap-4">
          <Button onClick={clearData} variant="destructive" className="bg-red-600 hover:bg-red-700" disabled={loading}>
            Limpar Dados (Nova Disputa)
          </Button>
          <Link href="/admin/settings">
            <Button variant="outline" className="border-purple-500 text-purple-300 hover:bg-purple-900/30">
              <Settings className="mr-2 h-4 w-4" /> Configurações
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
