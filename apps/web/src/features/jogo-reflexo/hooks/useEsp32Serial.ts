'use client'

// Ligação com o ESP32 do jogo do reflexo pela Web Serial (Chrome ou Edge, 115200 bps).
//
// No "mestre mandou" quem sorteia a espera, mostra a ordem e mede o tempo é o site; o ESP32 só avisa o
// que acontece no botão. Ele manda um JSON por linha (o mesmo formato do jogo das cores):
//   {"evento":"pronto"}              quando liga
//   {"evento":"botao_pressionado"}   a cada aperto do botão
// O horário do aperto é o da chegada da mensagem (performance.now(), a mesma escala do event.timeStamp
// do clique e do teclado). Sem o ESP32, o ?simular na URL faz o clique e o espaço imitarem o botão.

import { useCallback, useEffect, useRef, useState } from 'react'

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
  readable: ReadableStream<Uint8Array> | null
}

interface NavigatorSerial {
  serial?: {
    requestPort(): Promise<SerialPort>
  }
}

export type EventoEsp32 = { evento: 'pronto' } | { evento: 'botao_pressionado' }

/** Uma linha que chegou do ESP32, como evento; null para o que não é evento do jogo (logs, lixo). */
export function lerEventoEsp32(linha: string): EventoEsp32 | null {
  const limpa = linha.trim()
  if (!limpa) return null
  try {
    const dados = JSON.parse(limpa) as { evento?: unknown } | null
    if (dados?.evento === 'pronto' || dados?.evento === 'botao_pressionado') return { evento: dados.evento }
  } catch {
    // não é JSON
  }
  return null
}

export function useEsp32Serial(onEvento: (evento: EventoEsp32, agora: number) => void) {
  const [conectado, setConectado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const portaRef = useRef<SerialPort | null>(null)
  const leitorRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const saindoRef = useRef(false) // desconexão pedida pela pessoa (não é erro)

  const onEventoRef = useRef(onEvento)
  useEffect(() => {
    onEventoRef.current = onEvento
  }, [onEvento])

  const conectar = useCallback(async () => {
    setErro(null)

    const nav = navigator as unknown as NavigatorSerial
    if (!nav.serial) {
      setErro('Navegador sem suporte a Web Serial API. Use Chrome ou Edge.')
      return
    }

    let port: SerialPort
    try {
      port = await nav.serial.requestPort()
      await port.open({ baudRate: 115200 })
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotFoundError') return // fechou a janela da porta
      setErro(
        err instanceof DOMException && err.name === 'InvalidStateError'
          ? 'Essa porta já está aberta em outro lugar (outra aba ou o Monitor Serial do Arduino).'
          : 'Não foi possível conectar ao ESP32. Confira o cabo e tente de novo.',
      )
      return
    }

    portaRef.current = port
    saindoRef.current = false
    setConectado(true)
    console.log('[ESP32 Reflexo] conectado')
    if (!port.readable) return

    const reader = port.readable.getReader()
    leitorRef.current = reader
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (!value) continue
        const agora = performance.now()

        buffer += decoder.decode(value, { stream: true })
        const linhas = buffer.split('\n')
        buffer = linhas.pop() ?? ''

        for (const linha of linhas) {
          const evento = lerEventoEsp32(linha)
          if (evento) onEventoRef.current(evento, agora)
          else if (linha.trim()) console.log('[ESP32 Reflexo] ignorado:', linha.trim())
        }
      }
    } catch {
      // o cabo saiu ou a porta foi fechada
    } finally {
      reader.releaseLock()
      leitorRef.current = null
    }

    // Saiu da leitura: a porta caiu (ou a pessoa desconectou).
    try {
      await port.close()
    } catch {
      // já fechada
    }
    portaRef.current = null
    setConectado(false)
    if (!saindoRef.current) setErro('O ESP32 foi desconectado. Confira o cabo e conecte de novo.')
  }, [])

  const desconectar = useCallback(async () => {
    saindoRef.current = true
    try {
      await leitorRef.current?.cancel() // termina a leitura; o conectar fecha a porta
    } catch {
      // já fechado
    }
    setConectado(false)
  }, [])

  // Sair da página fecha a porta (senão ela fica presa até recarregar).
  useEffect(
    () => () => {
      saindoRef.current = true
      void leitorRef.current?.cancel().catch(() => {})
    },
    [],
  )

  return { conectado, erro, conectar, desconectar }
}