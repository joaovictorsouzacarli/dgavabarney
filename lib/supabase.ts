import { createClient } from "@supabase/supabase-js"

// Suas credenciais reais do Supabase
const supabaseUrl = "https://qortsefzphnsvkafrkkw.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcnRzZWZ6cGhuc3ZrYWZya2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNjY0MTgsImV4cCI6MjA2NDg0MjQxOH0.u4rKIASvBmfGsIw8bAbg4KCshSse3AFPxTIoT0F2DQ8"

// Cria o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas
export interface Participant {
  id: string
  player_name: string
  role: string
  ip: number
  status: "pending" | "selected" | "mor"
  created_at: string
}

export interface MorEntry {
  id: string
  player_id: string
  player_name: string
  discord_message_id: string | null
  created_at: string
}

export interface Setting {
  id: string
  key: string
  value: string
  updated_at: string
}

// Função para obter o webhook do Discord
export async function getDiscordWebhook(): Promise<string> {
  const { data, error } = await supabase.from("settings").select("value").eq("key", "discord_webhook").single()

  if (error) {
    console.error("Erro ao buscar webhook:", error)
    return ""
  }

  return data?.value || ""
}

// Função para salvar o webhook do Discord
export async function saveDiscordWebhook(url: string): Promise<boolean> {
  const { error } = await supabase
    .from("settings")
    .update({ value: url, updated_at: new Date().toISOString() })
    .eq("key", "discord_webhook")

  if (error) {
    console.error("Erro ao salvar webhook:", error)
    return false
  }

  return true
}
