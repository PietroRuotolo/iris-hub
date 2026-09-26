import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Check, Clock, Download, FileText, Trash2, Upload } from 'lucide-react'
import useSessoes from '../hooks/useSessoes'
import BotaoConfirmar from '../components/BotaoConfirmar'
import { SOFTWARES } from '../data/softwares'
import { lerSessao, nomeJogo } from '../services/laudo'
import { adicionarSessoes, limparSessoes, removerSessao } from '../services/sessoes'

async function lerArquivos(arquivos) {
  const validas = []
  const problemas = []
  for (const arquivo of arquivos) {
    try {
      validas.push(lerSessao(JSON.parse(await arquivo.text())))
    } catch (erro) {
      const motivo = erro instanceof SyntaxError ? 'o arquivo não é um JSON válido' : erro.message
      problemas.push(`${arquivo.name}: ${motivo}`)
    }
  }
  return { validas, problemas }
}

export default function Sessoes() {
  const sessoes = useSessoes()
  const seletor = useRef(null)
  const [problemas, setProblemas] = useState([])

  async function aoEscolherArquivos(evento) {
    const arquivos = Array.from(evento.target.files)
    evento.target.value = '' // permite escolher o mesmo arquivo de novo
    const { validas, problemas: novos } = await lerArquivos(arquivos)
    if (validas.length > 0) adicionarSessoes(validas)
    setProblemas(novos)
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">Sessões</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        A pessoa passa por cada jogo da experiência; carregue aqui o arquivo JSON que cada um exporta ao final.
        Quando todos estiverem carregados, gere o laudo combinando os resultados.
      </p>

      <ul className="mt-4 space-y-2">
        {SOFTWARES.map((software) => {
          const carregado = sessoes.some((s) => s.jogo === software.id)
          return (
            <li
              key={software.id}
              className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] p-4 shadow-sm"
            >
              {carregado ? (
                <Check size={18} className="shrink-0 text-[var(--color-good)]" />
              ) : (
                <Clock size={18} className="shrink-0 text-[var(--color-warn)]" />
              )}
              <span className="text-sm text-[var(--color-ink)]">
                {software.nome} — {carregado ? 'sessão carregada' : 'aguardando sessão'}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
        <input
          ref={seletor}
          type="file"
          accept=".json,application/json"
          multiple
          onChange={aoEscolherArquivos}
          className="hidden"
        />
        <button
          onClick={() => seletor.current.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-4 text-base font-semibold text-[var(--color-surface)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 active:scale-[0.99]"
        >
          <Upload size={20} /> Carregar sessão (JSON)
        </button>
        <a
          href="/sessao-exemplo.json"
          download
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]"
        >
          <Download size={16} /> Baixar arquivo de exemplo
        </a>

        {problemas.length > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-[var(--color-warn-bg)] p-4" role="alert">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
            <ul className="space-y-1 text-sm text-[var(--color-ink)]">
              {problemas.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <h2 className="mt-6 font-display text-lg font-semibold text-[var(--color-navy)]">
        Sessões carregadas ({sessoes.length})
      </h2>

      {sessoes.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-soft)] shadow-sm">
          Nenhuma sessão ainda.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {sessoes.map((s, i) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-surface)] p-4 shadow-sm">
              <div>
                <p className="font-display font-semibold text-[var(--color-navy)]">
                  {nomeJogo(s.jogo)} <span className="font-normal text-[var(--color-ink-soft)]">· sessão {i + 1}</span>
                </p>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  {s.acertos} acertos · {s.erros} erros
                  {s.tempoRespostaMedioMs !== null && ` · ${Math.round(s.tempoRespostaMedioMs)} ms`}
                </p>
              </div>
              <button
                onClick={() => removerSessao(s.id)}
                aria-label={`Remover sessão ${i + 1}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-bg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
              >
                <Trash2 size={18} className="text-[var(--color-ink-soft)]" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/laudo"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-good)] px-4 py-3 text-sm font-semibold text-[var(--color-surface)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
        >
          <FileText size={18} /> Gerar laudo
        </Link>
        {sessoes.length > 0 && (
          <BotaoConfirmar
            rotulo="Zerar resultados"
            rotuloConfirmar="Toque de novo para apagar tudo"
            aoConfirmar={limparSessoes}
            Icone={Trash2}
            className="flex-1"
          />
        )}
      </div>
      {sessoes.length === 0 && (
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          Sem sessões carregadas, o laudo sai com valores de referência para todos os jogos.
        </p>
      )}
    </>
  )
}
