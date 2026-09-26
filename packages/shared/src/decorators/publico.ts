import { SetMetadata } from '@nestjs/common'

export const ROTA_PUBLICA = 'iris:rota-publica'

/** Marca uma rota (ou controller) como pública: dispensa a x-api-key no gateway. */
export const Publico = () => SetMetadata(ROTA_PUBLICA, true)
