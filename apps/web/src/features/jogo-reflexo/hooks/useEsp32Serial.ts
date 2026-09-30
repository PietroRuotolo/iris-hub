'use client'



//nao foi testado, a minha soldagem saiuuu
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

export interface EventoEsp32 {
  status: 'contagem' | 'esperando' | 'reagir' | 'queimou' | 'sucesso'
  valor?: number | string
}

export function useEsp32Serial(onEvento: (evento: EventoEsp32) => void) {
  const [conectado, setConectado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const portaRef = useRef<SerialPort | null>(null)

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

    try {
      console.log('%c[Serial] Solicitando porta USB...', 'color: #38bdf8; font-weight: bold;')
      const port = await nav.serial.requestPort()
      
      console.log('%c[Serial] Abrindo porta a 115200 bps...', 'color: #38bdf8; font-weight: bold;')
      await port.open({ baudRate: 115200 })
      
      portaRef.current = port
      setConectado(true)
      console.log('%c[Serial Conectado com Sucesso!]', 'color: #22c55e; font-weight: bold; font-size: 14px;')

      if (!port.readable) {
        console.warn('[Serial] port.readable está nulo!')
        return
      }

      const reader = port.readable.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) {
            console.log('[Serial] Leitura finalizada.')
            break
          }
          if (value) {
            const chunk = decoder.decode(value, { stream: true })
            console.log('%c[Dado Bruto Chegando]:', 'color: #f59e0b;', chunk)

            buffer += chunk
            const linhas = buffer.split('\n')
            buffer = linhas.pop() ?? ''

            for (const linha of linhas) {
              const limpa = linha.trim()
              if (!limpa) continue

              try {
                const evento: EventoEsp32 = JSON.parse(limpa)
                console.log('%c[JSON Válido]:', 'color: #10b981; font-weight: bold;', evento)
                onEventoRef.current(evento)
              } catch {
                console.log('[Texto recebido não-JSON]:', limpa)
              }
            }
          }
        }
      } catch (readErr) {
        console.error('[Serial Erro de Leitura]:', readErr)
      } finally {
        reader.releaseLock()
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        console.log('[Serial] Seleção de porta cancelada.')
        return
      }
      const msg = err instanceof Error ? err.message : 'Falha na conexão Serial'
      console.error('[Serial Erro]:', msg)
      setErro(msg)
      setConectado(false)
    }
  }, [])

  const desconectar = useCallback(async () => {
    if (portaRef.current) {
      await portaRef.current.close()
      portaRef.current = null
    }
    setConectado(false)
  }, [])

  return { conectado, erro, conectar, desconectar }
}