import { supabase, type Participant } from "./supabase"

// Função para salvar um novo participante
export async function saveParticipant(playerName: string, role: string, ip: number): Promise<Participant | null> {
  const { data, error } = await supabase
    .from("participants")
    .insert([{ player_name: playerName, role, ip, status: "pending" }])
    .select()
    .single()

  if (error) {
    console.error("Erro ao salvar participante:", error)
    return null
  }

  return data
}

// Função para obter todos os participantes
export async function getAllParticipants(): Promise<Participant[]> {
  const { data, error } = await supabase.from("participants").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar participantes:", error)
    return []
  }

  return data || []
}

// Função para atualizar o status de um participante
export async function updateParticipantStatus(id: string, status: "pending" | "selected" | "mor"): Promise<boolean> {
  const { error } = await supabase.from("participants").update({ status }).eq("id", id)

  if (error) {
    console.error("Erro ao atualizar status do participante:", error)
    return false
  }

  return true
}

// Função para limpar todos os participantes (nova disputa)
export async function clearAllParticipants(): Promise<boolean> {
  const { error } = await supabase.from("participants").delete().neq("id", "00000000-0000-0000-0000-000000000000") // Condição para deletar todos

  if (error) {
    console.error("Erro ao limpar participantes:", error)
    return false
  }

  return true
}
