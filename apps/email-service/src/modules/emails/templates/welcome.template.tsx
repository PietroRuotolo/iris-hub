import type { ReactElement } from 'react'
import { EmailImage } from '../components/EmailImage.js'
import { EmailLayout } from '../components/EmailLayout.js'

export type TemplateEmail = 'welcome'
export type TemplateRenderizado = { assunto: string; preview: string; elemento: ReactElement }

const IMAGEM_TEMPLATE = 'https://res.cloudinary.com/pch4vjkr/image/upload/Imagem_do_ChatGPT_26_de_set._de_2026_21_01_32.png'

export function renderizarTemplate(template: TemplateEmail): TemplateRenderizado {
  switch (template) {
    case 'welcome': {
      const preview = 'Íris Hub | Tecnologia preventiva que cuida de pessoas'
      return {
        assunto: preview,
        preview,
        elemento: (
          <EmailLayout preview={preview}>
            <EmailImage src={IMAGEM_TEMPLATE} alt="Íris Hub | Tecnologia preventiva que cuida de pessoas" />
          </EmailLayout>
        ),
      }
    }
  }
}
