// Interface para armazenar os dados de MOR
interface MorData {
  playerId: string
  playerName: string
  discordMessageId: string | null
  timestamp: number
}

// Função para salvar MOR
export function saveMor(playerId: string, playerName: string, discordMessageId: string | null): void {
  const morData: MorData = {
    playerId,
    playerName,
    discordMessageId,
    timestamp: Date.now(),
  }

  // Obter lista atual de MORs
  const morList = getMorList()

  // Adicionar novo MOR
  morList.push(morData)

  // Salvar no localStorage
  localStorage.setItem("morList", JSON.stringify(morList))
}

// Função para obter lista de MOR
export function getMorList(): MorData[] {
  const morListString = localStorage.getItem("morList")
  return morListString ? JSON.parse(morListString) : []
}

// Função para remover MOR
export function removeMor(playerId: string): MorData | null {
  const morList = getMorList()
  const index = morList.findIndex((mor) => mor.playerId === playerId)

  if (index === -1) {
    return null
  }

  // Remover da lista
  const removedMor = morList.splice(index, 1)[0]

  // Atualizar localStorage
  localStorage.setItem("morList", JSON.stringify(morList))

  return removedMor
}

// Função para verificar se um jogador tem MOR
export function hasMor(playerId: string): boolean {
  const morList = getMorList()
  return morList.some((mor) => mor.playerId === playerId)
}
