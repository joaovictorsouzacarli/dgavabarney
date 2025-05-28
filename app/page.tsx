"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle } from "lucide-react"
import Image from "next/image"

interface ParticipantData {
  id: string
  playerName: string
  role: string
  ip: number
  timestamp: number
}

const roles = [
  "Off Tank",
  "Elevado",
  "Silence",
  "Healer",
  "Raiz Ferrea (Party Heal)",
  "DPS - Frost",
  "DPS - Fire",
  "DPS - Aguia",
  "DPS - Xbow",
  "DPS - Raiz Ferrea",
  "Roletroll",
  "Scout",
  "Oculto",
  "Debuff - Quebrareinos",
  "Debuff - Incubo",
  "Debuff - Bruxo",
]

export default function ParticipantForm() {
  const [formData, setFormData] = useState({
    playerName: "",
    role: "",
    ip: 0,
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simular envio dos dados
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const participantData: ParticipantData = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      timestamp: Date.now(),
    }

    // Salvar no localStorage temporariamente para demonstração
    const existingData = JSON.parse(localStorage.getItem("participants") || "[]")
    existingData.push(participantData)
    localStorage.setItem("participants", JSON.stringify(existingData))

    console.log("Dados enviados:", participantData)

    setIsSubmitted(true)
    setIsLoading(false)
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
          <CardHeader className="text-center">
            <Image src="/logo.png" alt="Barney Logo" width={80} height={80} className="mx-auto mb-4 rounded-full" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-white">Obrigado!</h2>
              <p className="text-slate-300">
                Seus dados foram enviados com sucesso. O caller irá revisar as inscrições e definir a composição da
                party.
              </p>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">Seus dados:</p>
                <div className="space-y-1 text-left">
                  <p className="text-white">
                    <span className="text-slate-400">Nome:</span> {formData.playerName}
                  </p>
                  <p className="text-white">
                    <span className="text-slate-400">Função:</span> {formData.role}
                  </p>
                  <p className="text-white">
                    <span className="text-slate-400">IP:</span> {formData.ip.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
        <CardHeader className="text-center">
          <Image src="/logo.png" alt="Barney Logo" width={100} height={100} className="mx-auto mb-4 rounded-full" />
          <CardTitle className="text-2xl font-bold text-white">DG Avalon - Inscrição</CardTitle>
          <CardDescription className="text-slate-300">Preencha seus dados para participar da disputa</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName" className="text-white">
                Nome do Jogador
              </Label>
              <Input
                id="playerName"
                type="text"
                placeholder="Digite seu nome no jogo"
                value={formData.playerName}
                onChange={(e) => handleInputChange("playerName", e.target.value)}
                required
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-white">
                Função
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)} required>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione sua função" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {roles.map((role) => (
                    <SelectItem key={role} value={role} className="text-white hover:bg-slate-700">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip" className="text-white">
                IP da Disputa
              </Label>
              <Input
                id="ip"
                type="number"
                placeholder="Digite seu IP"
                value={formData.ip || ""}
                onChange={(e) => handleInputChange("ip", Number.parseInt(e.target.value) || 0)}
                required
                min="0"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Confirmar Inscrição"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
