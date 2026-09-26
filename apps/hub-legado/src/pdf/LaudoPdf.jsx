// Molde de design do laudo em PDF. Mesma estrutura de dados de `LaudoDocumento`
// (components/LaudoDocumento.jsx) — o molde é fixo, só os valores mudam por sessão.
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ehPadrao, formatarDataLaudo, interpretar, linhasResumo, nomeJogo } from '../services/laudo'
import { CORES } from './cores'
import { registrarFontes } from './fontes'

registrarFontes()

const NIVEIS = {
  adequado: { fundo: CORES.goodBg, texto: CORES.good },
  atencao: { fundo: CORES.warnBg, texto: CORES.warn },
  reduzido: { fundo: CORES.warnBg, texto: CORES.warn },
  'sem-dados': { fundo: CORES.bg, texto: CORES.inkSoft },
}

const estilos = StyleSheet.create({
  pagina: {
    padding: 32,
    fontFamily: 'Inter',
    fontSize: 10,
    color: CORES.ink,
  },
  marca: {
    fontFamily: 'Poppins',
    fontWeight: 600,
    fontSize: 12,
    color: CORES.navy,
  },
  rotuloSecao: {
    marginTop: 12,
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: CORES.inkSoft,
  },
  titulo: {
    marginTop: 2,
    fontFamily: 'Poppins',
    fontWeight: 600,
    fontSize: 18,
    color: CORES.navy,
  },
  subtitulo: {
    marginTop: 2,
    fontSize: 9,
    color: CORES.inkSoft,
  },
  avisoBox: {
    marginTop: 14,
    padding: 10,
    borderRadius: 8,
    backgroundColor: CORES.warnBg,
  },
  avisoTexto: {
    fontSize: 8.5,
    color: CORES.ink,
    lineHeight: 1.4,
  },
  secaoJogo: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E3E8EB',
  },
  primeiraSecao: {
    marginTop: 18,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  linhaTituloJogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tituloJogo: {
    fontFamily: 'Poppins',
    fontWeight: 600,
    fontSize: 13,
    color: CORES.navy,
  },
  selo: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 7.5,
    fontWeight: 600,
    backgroundColor: CORES.warnBg,
    color: CORES.warn,
  },
  avisoPadrao: {
    marginTop: 4,
    fontSize: 8.5,
    color: CORES.inkSoft,
  },
  tabela: {
    marginTop: 10,
  },
  linhaTabela: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0F1',
  },
  rotuloLinha: {
    fontSize: 9,
    color: CORES.inkSoft,
  },
  valorLinha: {
    fontFamily: 'Poppins',
    fontWeight: 600,
    fontSize: 9.5,
    color: CORES.navy,
  },
  leituraBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: CORES.bg,
  },
  leituraSelo: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 7.5,
    fontWeight: 600,
  },
  leituraTexto: {
    marginTop: 6,
    fontSize: 9,
    color: CORES.ink,
    lineHeight: 1.4,
  },
  leituraObservacao: {
    marginTop: 4,
    fontSize: 9,
    color: CORES.ink,
    lineHeight: 1.4,
  },
  rodape: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 7.5,
    color: CORES.inkSoft,
    textAlign: 'center',
  },
})

function SecaoJogoPdf({ jogo, resumo, primeira }) {
  const leitura = interpretar(resumo)
  const padrao = ehPadrao(resumo)
  const cores = NIVEIS[leitura.nivel]

  return (
    <View style={primeira ? estilos.primeiraSecao : estilos.secaoJogo} wrap={false}>
      <View style={estilos.linhaTituloJogo}>
        <Text style={estilos.tituloJogo}>{nomeJogo(jogo)}</Text>
        {padrao && <Text style={estilos.selo}>Valores de referência</Text>}
      </View>
      {padrao && (
        <Text style={estilos.avisoPadrao}>
          Este jogo não foi realizado nesta sessão. Os números abaixo são valores de referência da demonstração.
        </Text>
      )}

      <View style={estilos.tabela}>
        {linhasResumo(resumo).map(([rotulo, valor]) => (
          <View key={rotulo} style={estilos.linhaTabela}>
            <Text style={estilos.rotuloLinha}>{rotulo}</Text>
            <Text style={estilos.valorLinha}>{valor}</Text>
          </View>
        ))}
      </View>

      <View style={estilos.leituraBox}>
        <Text style={[estilos.leituraSelo, { backgroundColor: cores.fundo, color: cores.texto }]}>
          {leitura.titulo}
        </Text>
        <Text style={estilos.leituraTexto}>{leitura.texto}</Text>
        {leitura.observacoes.map((obs) => (
          <Text key={obs} style={estilos.leituraObservacao}>
            • {obs}
          </Text>
        ))}
      </View>
    </View>
  )
}

// Laudo SIMULADO em PDF: mesmo conteúdo de LaudoDocumento (components/LaudoDocumento.jsx),
// um por jogo, pronto para download no celular que escaneou o QR code.
export default function LaudoPdf({ grupos, dataIso }) {
  const data = formatarDataLaudo(dataIso)

  return (
    <Document title="Laudo simulado — iris hub" author="iris hub">
      <Page size="A4" style={estilos.pagina}>
        <Text style={estilos.marca}>iris hub</Text>
        <Text style={estilos.rotuloSecao}>Laudo simulado</Text>
        <Text style={estilos.titulo}>Resultado da experiência</Text>
        <Text style={estilos.subtitulo}>Paciente: demonstração{data ? ` · ${data}` : ''}</Text>

        <View style={estilos.avisoBox}>
          <Text style={estilos.avisoTexto}>
            Documento simulado para apresentação acadêmica. Não é um laudo real nem tem valor diagnóstico.
          </Text>
        </View>

        {grupos.map((grupo, i) => (
          <SecaoJogoPdf key={grupo.jogo} {...grupo} primeira={i === 0} />
        ))}

        <Text style={estilos.rodape} fixed>
          Gerado automaticamente pelo iris hub a partir dos dados do QR code — não requer conexão com servidor.
        </Text>
      </Page>
    </Document>
  )
}
