import { describe, expect, it } from 'vitest'
import type { NetworkInterfaceInfo } from 'node:os'
import { enderecosDaRede } from './rede'

const v4 = (address: string, internal = false) => ({ address, family: 'IPv4', internal }) as NetworkInterfaceInfo

describe('enderecosDaRede', () => {
  it('devolve o Wi-Fi primeiro e ignora loopback, adaptadores virtuais e IPv6', () => {
    const interfaces = {
      'Loopback Pseudo-Interface 1': [v4('127.0.0.1', true)],
      'vEthernet (WSL)': [v4('172.24.160.1')],
      Ethernet: [v4('10.0.0.5')],
      'Wi-Fi': [v4('192.168.0.15'), { address: 'fe80::1', family: 'IPv6', internal: false } as NetworkInterfaceInfo],
    }
    expect(enderecosDaRede(interfaces, '3000')).toEqual(['http://192.168.0.15:3000', 'http://10.0.0.5:3000'])
  })

  it('sem rede, lista vazia', () => {
    expect(enderecosDaRede({ lo: [v4('127.0.0.1', true)] }, '3000')).toEqual([])
  })
})  