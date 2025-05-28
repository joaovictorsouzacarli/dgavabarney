// Função para enviar MOR para o Discord
export async function sendMorToDiscord(playerName: string): Promise<string | null> {
  try {
    // Você precisará adicionar sua URL de webhook do Discord aqui
    const webhookUrl = localStorage.getItem("discordWebhook") || ""

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
      return null
    }

    // Retornar um ID único para controle interno
    return `mor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  } catch (error) {
    console.error("Erro ao enviar MOR para o Discord:", error)
    return null
  }
}

// Função para notificar remoção de MOR no Discord (unificada)
export async function notifyMorRemovalToDiscord(playerName: string): Promise<boolean> {
  try {
    const webhookUrl = localStorage.getItem("discordWebhook") || ""

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

// Função para remover MOR do Discord (mantida para compatibilidade)
export async function removeMorFromDiscord(messageId: string): Promise<boolean> {
  // Como webhooks têm limitações para deletar mensagens,
  // vamos usar a função de notificação em vez de tentar deletar
  return true
}
