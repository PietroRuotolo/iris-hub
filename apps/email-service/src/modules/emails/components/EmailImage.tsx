/* eslint-disable @next/next/no-img-element -- Email clients need a plain <img> URL in message HTML. */
type Props = { src: string; alt: string }

export function EmailImage({ src, alt }: Props) {
  return <img src={src} alt={alt} width="100%" style={{ display: 'block', width: '100%', height: 'auto', border: 0 }} />
}
