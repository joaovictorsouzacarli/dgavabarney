import { getDiscordWebhook } from "./supabase"

// Função para enviar MOR para o Discord
export async function sendMorToDiscord(playerName: string): Promise<string | null> {
  try {
    // Buscar webhook do banco de dados
    const webhookUrl = await getDiscordWebhook()

    if (!webhookUrl) {
      console.error("URL do webhook do Discord não configurada")
      return null
    }

    // Enviando mensagem para o Discord
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `🔁 ${playerName} recebeu MOR`,
        username: "Sistema DG Avalon",
      }),
    })

    if (!response.ok) {
      throw new Error("Falha ao enviar mensagem para o Discord")
    }

    // Retornar um ID único para controle interno
    return `mor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  } catch (error) {
    console.error("Erro ao enviar MOR para o Discord:", error)
    return null
  }
}

// Função para notificar remoção de MOR no Discord
export async function notifyMorRemovalToDiscord(playerName: string): Promise<boolean> {
  try {
    const webhookUrl = await getDiscordWebhook()

    if (!webhookUrl) {
      console.error("URL do webhook do Discord não configurada")
      return false
    }

    // Enviar mensagem informando que o MOR foi removido
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `🗑️ **${playerName}** foi removido da lista MOR`,
        username: "Sistema DG Avalon",
      }),
    })

    if (!response.ok) {
      throw new Error("Falha ao notificar remoção no Discord")
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao notificar remoção no Discord:", error)
    return false
  }
}
