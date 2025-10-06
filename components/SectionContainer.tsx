import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function SectionContainer({ children }: Props) {
  return (
    <section className="mx-auto max-w-2xl rounded-lg bg-white/50 px-8 shadow-lg backdrop-blur-sm sm:px-10 xl:max-w-4xl xl:px-4 dark:bg-gray-950/50">
      {children}
    </section>
  )
}
