import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Camera, ClipboardCopy, RotateCcw } from 'lucide-react'
import useFaceLandmarker from '../gaze/useFaceLandmarker'
import useSequenciaDeAlvos, { MIN_AMOSTRAS } from '../gaze/useSequenciaDeAlvos'
import { PONTOS_CALIBRACAO, PONTOS_VALIDACAO, embaralhar } from '../gaze/pontos'
import { ajustarMapeamento, dispersaoPx, erroPixel, pxParaCm, pxParaGraus } from '../gaze/mapping'
import { formatarRelatorioMarkdown, obterHistorico, salvarExecucao } from '../gaze/relatorio'
import AlvoFixacao from '../components/AlvoFixacao'

const LIMITE_PADRAO_PX = 80 // critério de decisão ilustrativo; ajuste conforme o tamanho de alvo do jogo

function TelaIntro({ config, aoMudarConfig, aoIniciar }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <Link to="/jogo-ritmo" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
        Fase 0 — Validação de precisão
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink)]">
        Protótipo descartável: mede o erro do rastreamento ocular pela webcam antes de qualquer decisão sobre o
        jogo. Um alvo aparece em posições conhecidas da tela; o sistema registra onde estima que você está olhando
        e compara com a posição real.
      </p>

      <div className="mt-6 space-y-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
        <div>
          <label className="text-xs font-medium text-[var(--color-ink-soft)]" htmlFor="rotulo">
            Rótulo da condição (ex.: sem-oculos_luz-natural)
          </label>
          <input
            id="rotulo"
            value={config.rotulo}
            onChange={(e) => aoMudarConfig({ ...config, rotulo: e.target.value })}
            className="mt-1 w-full rounded-xl bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-[var(--color-ink)]" htmlFor="oculos">
            Está usando óculos?
          </label>
          <input
            id="oculos"
            type="checkbox"
            checked={config.oculos}
            onChange={(e) => aoMudarConfig({ ...config, oculos: e.target.checked })}
            className="h-5 w-5 accent-[var(--color-navy)]"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-ink-soft)]" htmlFor="iluminacao">
            Iluminação (descrição livre)
          </label>
          <input
            id="iluminacao"
            value={config.iluminacao}
            onChange={(e) => aoMudarConfig({ ...config, iluminacao: e.target.value })}
            className="mt-1 w-full rounded-xl bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[var(--color-ink-soft)]" htmlFor="largura">
              Largura da tela (cm, opcional)
            </label>
            <input
              id="largura"
              inputMode="decimal"
              value={config.larguraTelaCm}
              onChange={(e) => aoMudarConfig({ ...config, larguraTelaCm: e.target.value })}
              className="mt-1 w-full rounded-xl bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--color-ink-soft)]" htmlFor="distancia">
              Distância dos olhos (cm, opcional)
            </label>
            <input
              id="distancia"
              inputMode="decimal"
              value={config.distanciaCm}
              onChange={(e) => aoMudarConfig({ ...config, distanciaCm: e.target.value })}
              className="mt-1 w-full rounded-xl bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--color-warn-bg)] p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
        <p className="text-sm text-[var(--color-ink)]">
          Pede acesso à câmera. Sente-se de frente para a tela, com o rosto centralizado, e mantenha a cabeça
          parada durante todo o teste.
        </p>
      </div>

      <button
        onClick={aoIniciar}
        disabled={!config.rotulo.trim()}
        className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-4 text-base font-semibold text-[var(--color-surface)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 disabled:opacity-50"
      >
        <Camera size={20} /> Ativar câmera e começar
      </button>
    </div>
  )
}

function PainelCamera({ videoRef, status, erro, temRosto }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-10 w-64 -translate-x-1/2 overflow-hidden rounded-xl bg-[var(--color-navy)] shadow-lg">
      <video ref={videoRef} muted playsInline className="w-full -scale-x-100" />
      <p
        className={`px-3 py-1.5 text-center text-xs font-medium ${
          status !== 'pronto'
            ? 'bg-[var(--color-ink-soft)] text-[var(--color-surface)]'
            : temRosto
              ? 'bg-[var(--color-good)] text-[var(--color-surface)]'
              : 'bg-[var(--color-warn)] text-[var(--color-surface)]'
        }`}
      >
        {status === 'carregando' && 'Carregando modelo…'}
        {status === 'erro' && (erro || 'Erro na câmera')}
        {status === 'pronto' && (temRosto ? 'Rosto detectado' : 'Rosto não detectado')}
      </p>
    </div>
  )
}

// Uma etapa (calibração ou validação): conduz a sequência de alvos. Montada só enquanto
// a etapa está ativa — remontar com uma nova `key` reinicia a sequência do zero.
function EtapaDeAlvos({ titulo, pontos, obterFeatures, aoFinalizar }) {
  const seq = useSequenciaDeAlvos(pontos, obterFeatures, aoFinalizar)
  if (!seq.ponto) return null

  return (
    <>
      <p className="pt-6 text-center font-display text-sm font-semibold text-[var(--color-ink-soft)]">
        {titulo} — alvo {seq.indice + 1}/{seq.total}
      </p>
      <AlvoFixacao
        x={seq.ponto.x * window.innerWidth}
        y={seq.ponto.y * window.innerHeight}
        progresso={seq.progresso}
        coletando={seq.coletando}
      />
    </>
  )
}

function TelaResultado({ execucao, aoRefazer }) {
  const [copiado, setCopiado] = useState(false)
  const historico = obterHistorico()
  const alvosValidos = execucao.alvos.filter((a) => a.erroPx !== undefined)
  const erroMedio = alvosValidos.length > 0 ? alvosValidos.reduce((s, a) => s + a.erroPx, 0) / alvosValidos.length : null
  const dentroDoLimite = erroMedio !== null && erroMedio <= LIMITE_PADRAO_PX

  async function copiarRelatorio() {
    const texto = formatarRelatorioMarkdown(historico)
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/jogo-ritmo" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        <ArrowLeft size={16} /> Voltar ao jogo de ritmo
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold text-[var(--color-navy)]">Resultado da validação</h1>

      <div className="mt-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
        <p className="text-sm text-[var(--color-ink-soft)]">
          {execucao.rotulo} · óculos: {execucao.oculos ? 'sim' : 'não'} · {execucao.iluminacao}
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Alvos válidos: {alvosValidos.length}/{execucao.alvos.length} · erro na calibração:{' '}
          {execucao.mapeamento.erroCalibracaoPx.toFixed(0)}px
        </p>

        <div className={`mt-4 rounded-xl p-4 ${dentroDoLimite ? 'bg-[var(--color-good-bg)]' : 'bg-[var(--color-warn-bg)]'}`}>
          <p className={`font-display text-3xl font-semibold ${dentroDoLimite ? 'text-[var(--color-good)]' : 'text-[var(--color-warn)]'}`}>
            {erroMedio !== null ? `${erroMedio.toFixed(0)} px` : 'sem dados'}
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink)]">
            Erro médio de validação. Critério de decisão usado nesta tela: {LIMITE_PADRAO_PX}px (ajuste conforme o
            tamanho de alvo que o jogo pretende usar).{' '}
            {dentroDoLimite ? 'Dentro do limite.' : 'Acima do limite — reveja calibração, luz ou o tamanho dos alvos.'}
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-[var(--color-ink-soft)]">
                <th className="pb-2">Região</th>
                <th className="pb-2 text-right">Erro (px)</th>
                <th className="pb-2 text-right">Dispersão (px)</th>
              </tr>
            </thead>
            <tbody>
              {execucao.alvos.map((a, i) => (
                <tr key={i} className="border-t border-navy/10">
                  <td className="py-2 text-[var(--color-ink)]">{a.regiao}</td>
                  <td className="py-2 text-right text-[var(--color-ink)]">
                    {a.erroPx !== undefined ? a.erroPx.toFixed(0) : '—'}
                  </td>
                  <td className="py-2 text-right text-[var(--color-ink)]">
                    {a.dispersaoPx !== undefined ? a.dispersaoPx.toFixed(0) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={aoRefazer}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-sm font-semibold text-[var(--color-surface)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
        >
          <RotateCcw size={18} /> Testar outra condição
        </button>
        <button
          onClick={copiarRelatorio}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
        >
          <ClipboardCopy size={18} /> {copiado ? 'Copiado!' : `Copiar relatório (${historico.length} execuções)`}
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
        O relatório reúne todas as execuções salvas neste navegador (histórico da Fase 0), agrupadas por rótulo e
        região — cole no documento de entrega da Fase 0.
      </p>
    </div>
  )
}

export default function ValidacaoRastreamento() {
  const [etapa, setEtapa] = useState('intro') // intro | calibrando | falhou | validando | resultado
  const [config, setConfig] = useState({ rotulo: '', oculos: false, iluminacao: '', larguraTelaCm: '', distanciaCm: '' })
  const [modelo, setModelo] = useState(null)
  const [erroCalibracao, setErroCalibracao] = useState(null)
  const [execucaoFinal, setExecucaoFinal] = useState(null)
  const [tentativaCalibracao, setTentativaCalibracao] = useState(0)

  const camera = useFaceLandmarker({ ativo: etapa !== 'intro' })
  const obterFeatures = () => camera.features

  // Embaralha de novo a cada tentativa de calibração (a dependência só existe para isso).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pontosCalibracao = useMemo(() => embaralhar(PONTOS_CALIBRACAO), [tentativaCalibracao])
  const pontosValidacao = useMemo(() => embaralhar(PONTOS_VALIDACAO), [])

  function aoFinalizarCalibracao(resultados) {
    const comPoucos = resultados.filter((r) => r.amostras.length < MIN_AMOSTRAS)
    if (comPoucos.length > 0) {
      setEtapa('falhou')
      return
    }
    const features = resultados.flatMap((r) => r.amostras)
    const alvosPx = resultados.flatMap((r) =>
      r.amostras.map(() => [r.ponto.x * window.innerWidth, r.ponto.y * window.innerHeight]),
    )
    const m = ajustarMapeamento(features, alvosPx)
    const previstos = m.prever(features)
    const residuos = previstos.map((p, i) => erroPixel(p, alvosPx[i]))
    setModelo(m)
    setErroCalibracao(residuos.reduce((a, b) => a + b, 0) / residuos.length)
    setEtapa('validando')
  }

  function aoFinalizarValidacao(resultados) {
    const larguraCm = parseFloat(config.larguraTelaCm)
    const distanciaCm = parseFloat(config.distanciaCm)

    const alvos = resultados.map(({ ponto, amostras }) => {
      const alvoPx = [ponto.x * window.innerWidth, ponto.y * window.innerHeight]
      const registro = { regiao: ponto.regiao, alvoPx, framesValidos: amostras.length }
      if (amostras.length >= MIN_AMOSTRAS) {
        const previstos = modelo.prever(amostras)
        const mx = previstos.reduce((s, p) => s + p[0], 0) / previstos.length
        const my = previstos.reduce((s, p) => s + p[1], 0) / previstos.length
        const erro = erroPixel([mx, my], alvoPx)
        registro.estimadoPx = [mx, my]
        registro.erroPx = erro
        registro.dispersaoPx = dispersaoPx(previstos)
        if (Number.isFinite(larguraCm)) {
          registro.erroCm = pxParaCm(erro, window.innerWidth, larguraCm)
          if (Number.isFinite(distanciaCm)) registro.erroGraus = pxParaGraus(erro, window.innerWidth, larguraCm, distanciaCm)
        }
      }
      return registro
    })

    const execucao = {
      versao: 1,
      dataHora: new Date().toISOString(),
      rotulo: config.rotulo.trim(),
      oculos: config.oculos,
      iluminacao: config.iluminacao.trim() || 'não informado',
      tela: {
        larguraPx: window.innerWidth,
        alturaPx: window.innerHeight,
        larguraCm: Number.isFinite(larguraCm) ? larguraCm : null,
        distanciaCm: Number.isFinite(distanciaCm) ? distanciaCm : null,
      },
      mapeamento: { features: 'h,v (grau 2)', erroCalibracaoPx: erroCalibracao },
      alvos,
    }
    salvarExecucao(execucao)
    setExecucaoFinal(execucao)
    setEtapa('resultado')
  }

  if (etapa === 'intro') {
    return <TelaIntro config={config} aoMudarConfig={setConfig} aoIniciar={() => setEtapa('calibrando')} />
  }

  if (etapa === 'resultado') {
    return (
      <TelaResultado
        execucao={execucaoFinal}
        aoRefazer={() => {
          setModelo(null)
          setEtapa('intro')
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-[var(--color-bg)]">
      {etapa === 'falhou' && (
        <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <AlertTriangle size={32} className="text-[var(--color-warn)]" />
          <p className="text-base text-[var(--color-ink)]">
            Rosto não detectado de forma estável em um ou mais pontos. Ajuste a iluminação ou a posição e tente
            de novo.
          </p>
          <button
            onClick={() => {
              setTentativaCalibracao((n) => n + 1)
              setEtapa('calibrando')
            }}
            className="rounded-xl bg-[var(--color-navy)] px-4 py-3 text-sm font-semibold text-[var(--color-surface)]"
          >
            Repetir calibração
          </button>
        </div>
      )}

      {etapa === 'calibrando' && (
        <EtapaDeAlvos
          key={`calib-${tentativaCalibracao}`}
          titulo="Calibração"
          pontos={pontosCalibracao}
          obterFeatures={obterFeatures}
          aoFinalizar={aoFinalizarCalibracao}
        />
      )}

      {etapa === 'validando' && (
        <EtapaDeAlvos
          key="validacao"
          titulo="Validação"
          pontos={pontosValidacao}
          obterFeatures={obterFeatures}
          aoFinalizar={aoFinalizarValidacao}
        />
      )}

      <PainelCamera videoRef={camera.videoRef} status={camera.status} erro={camera.erro} temRosto={!!camera.features} />
    </div>
  )
}
