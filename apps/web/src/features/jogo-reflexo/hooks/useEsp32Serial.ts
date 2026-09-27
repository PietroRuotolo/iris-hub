'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { EventoEsp32 } from '../reflexo'

// Declarações locais para a Web Serial API
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
}

interface NavigatorSerial {
  serial: {
    requestPort(): Promise<SerialPort>
  }
}

export function useEsp32Serial(onEvento: (evento: EventoEsp32) => void) {
  const [conectado, setConectado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null)

  const desconectar = useCallback(async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel()
        readerRef.current = null
      }
      if (portRef.current) {
        await portRef.current.close()
        portRef.current = null
      }
    } catch {
      // Ignora falhas de limpeza durante a desconexão
    } finally {
      setConectado(false)
    }
  }, [])

  const conectar = useCallback(async () => {
    setErro(null)

    if (!('serial' in navigator)) {
      setErro('O seu navegador não suporta a Web Serial API (utilize Chrome ou Edge).')
      return
    }

    try {
      const serialNav = navigator as unknown as NavigatorSerial
      const port = await serialNav.serial.requestPort()
      await port.open({ baudRate: 115200 })
      portRef.current = port
      setConectado(true)

      const textDecoder = new TextDecoderStream()
      // Conversão necessária para compatibilizar os tipos do stream da porta
      const readableStream = port.readable as unknown as ReadableStream<BufferSource>
      readableStream?.pipeTo(textDecoder.writable)
      const reader = textDecoder.readable.getReader()
      readerRef.current = reader

      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += value
        const linhas = buffer.split('\n')
        buffer = linhas.pop() ?? ''

        for (let linha of linhas) {
          linha = linha.trim()
          if (!linha) continue

          try {
            const evento: EventoEsp32 = JSON.parse(linha)
            onEvento(evento)
          } catch {
            console.warn('[Serial] Fragmento parcial descartado:', linha)
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha desconhecida'
      setErro(`Erro ao ligar à porta série: ${msg}`)
      await desconectar()
    }
  }, [onEvento, desconectar])

  useEffect(() => {
    return () => {
      desconectar()
    }
  }, [desconectar])

  return { conectado, conectar, desconectar, erro }
}