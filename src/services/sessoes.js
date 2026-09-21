// Armazenamento das sessões da experiência atual (localStorage do navegador).
// Compatível com useSyncExternalStore: `obterSessoes` devolve a mesma referência
// enquanto o conteúdo não muda.

const CHAVE = 'iris-hub:sessoes'

const ouvintes = new Set()
let ultimoTexto
let ultimoValor = []

export function obterSessoes() {
  let texto = null
  try {
    texto = localStorage.getItem(CHAVE)
  } catch {
    // armazenamento indisponível: trata como vazio
  }
  if (texto !== ultimoTexto) {
    ultimoTexto = texto
    try {
      ultimoValor = texto ? JSON.parse(texto) : []
    } catch {
      ultimoValor = []
    }
  }
  return ultimoValor
}

export function assinar(aoMudar) {
  ouvintes.add(aoMudar)
  window.addEventListener('storage', aoMudar) // outra aba alterou os dados
  return () => {
    ouvintes.delete(aoMudar)
    window.removeEventListener('storage', aoMudar)
  }
}

function gravar(lista) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista))
  } catch {
    // sem armazenamento, nada persiste
  }
  ouvintes.forEach((aoMudar) => aoMudar())
}

let contador = 0
export function adicionarSessoes(novas) {
  const comId = novas.map((s) => ({ ...s, id: `${Date.now()}-${contador++}` }))
  gravar([...obterSessoes(), ...comId])
}

export function removerSessao(id) {
  gravar(obterSessoes().filter((s) => s.id !== id))
}

/** Apaga todas as sessões (reset para a próxima pessoa). */
export function limparSessoes() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // ignora
  }
  ouvintes.forEach((aoMudar) => aoMudar())
}
