'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { EventoGenius } from '../cores.config'

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
}

interface NavigatorSerial {
  serial?: {
    requestPort(): Promise<SerialPort>
  }
}

export function useGeniusSerial(onEvento: (evento: EventoGenius) => void) {
  const [conectado, setConectado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const portaRef = useRef<SerialPort | null>(null)
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null)

  const onEventoRef = useRef(onEvento)
  useEffect(() => {
    onEventoRef.current = onEvento
  }, [onEvento])

  const conectar = useCallback(async () => {
    setErro(null)
    const nav = navigator as unknown as NavigatorSerial

    if (!nav.serial) {
      setErro('Web Serial API não suportada. Utilize o Google Chrome ou Edge.')
      return
    }

    try {
      const port = await nav.serial.requestPort()
      await port.open({ baudRate: 115200 })

      portaRef.current = port
      writerRef.current = port.writable?.getWriter() ?? null
      setConectado(true)

      const textDecoder = new TextDecoderStream()
      port.readable?.pipeTo(textDecoder.writable as WritableStream<Uint8Array>).catch(() => {})

      const reader = textDecoder.readable.getReader()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (!value) continue

        buffer += value
        const linhas = buffer.split('\n')
        buffer = linhas.pop() ?? ''

        for (const linha of linhas) {
          const limpa = linha.trim()
          if (!limpa) continue

          try {
            const evento: EventoGenius = JSON.parse(limpa)
            console.log('[ESP32 Genius]:', evento)
            onEventoRef.current(evento)
          } catch {
            // Descarta fragmentos de leituras não-JSON
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        return
      }
      setErro(err instanceof Error ? err.message : 'Falha na conexão com o ESP32')
      setConectado(false)
    }
  }, [])

  const enviarComando = useCallback(async (comando: string) => {
    if (!writerRef.current) return
    try {
      const encoder = new TextEncoder()
      await writerRef.current.write(encoder.encode(comando + '\n'))
      console.log('[Comando Enviado]:', comando)
    } catch (err) {
      console.error('Erro ao enviar comando serial:', err)
    }
  }, [])

  const desconectar = useCallback(async () => {
    try {
      if (writerRef.current) {
        await writerRef.current.close()
        writerRef.current = null
      }
      if (portaRef.current) {
        await portaRef.current.close()
        portaRef.current = null
      }
    } finally {
      setConectado(false)
    }
  }, [])

  return { conectado, erro, conectar, desconectar, enviarComando }
}