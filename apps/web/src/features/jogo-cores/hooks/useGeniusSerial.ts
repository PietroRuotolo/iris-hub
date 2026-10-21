'use client'

// Ligação com a caixa das cores (ESP32 com 5 botões e 5 luzes) pela Web Serial (Chrome ou Edge, 115200 bps).
//
// Quem sorteia as sequências, mostra, confere e mede o tempo é o site. A conversa é um JSON por linha:
//   ESP32 → site:  {"evento":"pronto"}                       quando liga
//                  {"evento":"botao_pressionado","cor":2}    a cada aperto (cor de 0 a 4)
//   site → ESP32:  {"cmd":"acender","cor":2,"ms":400}        acende a luz (e o som) da cor por ms
//                  {"cmd":"erro"}                            sinal de erro (luzes/som de erro)
// O horário do aperto é o da chegada da mensagem (performance.now(), a mesma escala do event.timeStamp).
// Sem a caixa, o ?simular na URL faz o clique nas cores e as teclas 1 a 5 imitarem os botões.

import { useCallback, useEffect, useRef, useState } from 'react'
import { TOTAL_CORES } from '@iris/contracts'

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
}

interface NavigatorSerial {
  serial?: { requestPort(): Promise<SerialPort> }
}

export type EventoCaixaCores = { evento: 'pronto' } | { evento: 'botao_pressionado'; cor: number }
export type ComandoCaixaCores = { cmd: 'acender'; cor: number; ms: number } | { cmd: 'erro' }

/** Uma linha que chegou da caixa, como evento; null para o resto (logs, lixo, cor inválida). */
export function lerEventoCores(linha: string): EventoCaixaCores | null {
  const limpa = linha.trim()
  if (!limpa) return null
  try {
    const dados = JSON.parse(limpa) as { evento?: unknown; cor?: unknown } | null
    if (dados?.evento === 'pronto') return { evento: 'pronto' }
    if (dados?.evento === 'botao_pressionado' && Number.isInteger(dados.cor) && (dados.cor as number) >= 0 && (dados.cor as number) < TOTAL_CORES) {
      return { evento: 'botao_pressionado', cor: dados.cor as number }
    }
  } catch {
    // não é JSON
  }
  return null
}

export function useGeniusSerial(onEvento: (evento: EventoCaixaCores, agora: number) => void) {
  const [conectado, setConectado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const leitorRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const escritorRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null)
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

    saindoRef.current = false
    escritorRef.current = port.writable?.getWriter() ?? null
    setConectado(true)
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
          const evento = lerEventoCores(linha)
          if (evento) onEventoRef.current(evento, agora)
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
      await escritorRef.current?.close()
    } catch {
      // já fechado
    }
    escritorRef.current = null
    try {
      await port.close()
    } catch {
      // já fechada
    }
    setConectado(false)
    if (!saindoRef.current) setErro('O ESP32 foi desconectado. Confira o cabo e conecte de novo.')
  }, [])

  /** Manda um comando para a caixa (acender uma cor, sinal de erro). Sem a caixa, não faz nada. */
  const enviar = useCallback((comando: ComandoCaixaCores) => {
    const escritor = escritorRef.current
    if (!escritor) return
    escritor.write(new TextEncoder().encode(JSON.stringify(comando) + '\n')).catch(() => {})
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

  return { conectado, erro, conectar, desconectar, enviar }
}