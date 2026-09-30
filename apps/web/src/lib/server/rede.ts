import type { NetworkInterfaceInfo } from 'node:os'

// Os endereços IPv4 da rede local (Wi-Fi, cabo), sem o 127.0.0.1 e sem adaptadores virtuais
// (WSL, Docker, VirtualBox, VPN), que o celular não alcança. Os da faixa 192.168 vêm primeiro:
// são quase sempre o Wi-Fi de casa.
const VIRTUAIS = /vethernet|wsl|docker|virtualbox|vmware|vbox|hyper-v|loopback|tailscale|zerotier|vpn/i

export function enderecosDaRede(
  interfaces: NodeJS.Dict<NetworkInterfaceInfo[]>,
  porta: string,
): string[] {
  const ips = Object.entries(interfaces)
    .filter(([nome]) => !VIRTUAIS.test(nome))
    .flatMap(([, lista]) => lista ?? [])
    .filter((i) => i.family === 'IPv4' && !i.internal && !i.address.startsWith('169.254.'))
    .map((i) => i.address)
  const ordenados = [...ips.filter((ip) => ip.startsWith('192.168.')), ...ips.filter((ip) => !ip.startsWith('192.168.'))]
  return [...new Set(ordenados)].map((ip) => `http://${ip}:${porta}`)
}