import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function SectionContainer({ children }: Props) {
  return (
    <section className="mx-auto max-w-2xl px-8 sm:px-10 xl:max-w-4xl xl:px-4 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm rounded-lg shadow-lg">{children}</section>
  )
}
