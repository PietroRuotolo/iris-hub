import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { renderizarTemplate } from './welcome.template.js'

describe('renderizarTemplate', () => {
  it('renderiza a imagem do template como corpo HTML do e-mail', () => {
    const email = renderizarTemplate('welcome')
    const html = renderToStaticMarkup(email.elemento)

    expect(email.assunto).toBe('Íris Hub | Tecnologia preventiva que cuida de pessoas')
    expect(html).toContain('src="https://res.cloudinary.com/pch4vjkr/image/upload/Imagem_do_ChatGPT_26_de_set._de_2026_21_01_32.png"')
    expect(html).toContain('alt="Íris Hub | Tecnologia preventiva que cuida de pessoas"')
    expect(html).not.toContain('Sua conta no Iris Hubs está pronta')
  })
})
