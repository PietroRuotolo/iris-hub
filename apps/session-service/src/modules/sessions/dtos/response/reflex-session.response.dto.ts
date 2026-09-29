export class TentativaReflexoResponseDto {
  rodada: number
  tempoEsperaMs: number
  tempoReacaoMs: number | null
  queimou: boolean
  acionamento: string
}

export class ReflexSessionResponseDto {
  id: string
  participanteId: string | null
  iniciadaEm: Date
  concluidaEm: Date | null
  status: string
  tempoMedioMs: number | null
  melhorTempoMs: number | null
  tentativas: TentativaReflexoResponseDto[]
}