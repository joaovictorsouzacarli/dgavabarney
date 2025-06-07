import { supabase, type MorEntry } from "./supabase"

// Função para salvar MOR
export async function saveMor(playerId: string, playerName: string, discordMessageId: string | null): Promise<boolean> {
  const { error } = await supabase
    .from("mor_list")
    .insert([{ player_id: playerId, player_name: playerName, discord_message_id: discordMessageId }])

  if (error) {
    console.error("Erro ao salvar MOR:", error)
    return false
  }

  return true
}

// Função para obter lista de MOR
export async function getMorList(): Promise<MorEntry[]> {
  const { data, error } = await supabase.from("mor_list").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar lista MOR:", error)
    return []
  }

  return data || []
}

// Função para remover MOR
export async function removeMor(playerId: string): Promise<MorEntry | null> {
  // Primeiro buscar o registro para retornar
  const { data: morEntry } = await supabase.from("mor_list").select("*").eq("player_id", playerId).single()

  // Depois deletar
  const { error } = await supabase.from("mor_list").delete().eq("player_id", playerId)

  if (error) {
    console.error("Erro ao remover MOR:", error)
    return null
  }

  return morEntry
}

// Função para verificar se um jogador tem MOR
export async function hasMor(playerId: string): Promise<boolean> {
  const { data, error } = await supabase.from("mor_list").select("id").eq("player_id", playerId)

  if (error) {
    console.error("Erro ao verificar MOR:", error)
    return false
  }

  return (data && data.length > 0) || false
}

// Função para limpar toda a lista MOR
export async function clearAllMor(): Promise<boolean> {
  const { error } = await supabase.from("mor_list").delete().neq("id", "00000000-0000-0000-0000-000000000000") // Condição para deletar todos

  if (error) {
    console.error("Erro ao limpar lista MOR:", error)
    return false
  }

  return true
}
