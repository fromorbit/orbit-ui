import { useState } from 'react'
import type { Story } from '../gallery/story'
import { Pagination } from './Pagination'

const LABELS = {
  label: "Pagina's",
  previous: 'Vorige pagina',
  next: 'Volgende pagina',
  page: (page: number) => `Pagina ${page}`,
  range: (from: number, to: number, total: number) => `${from}–${to} van ${total}`,
  perPage: 'Per pagina',
}

function Pages({ initial, total }: { initial: number; total: number }) {
  const [page, setPage] = useState(initial)
  const [size, setSize] = useState(25)
  return (
    <div className="w-[40rem]">
      <Pagination
        page={page}
        total={total}
        pageSize={size}
        pageSizes={[10, 25, 50]}
        onPageSizeChange={(next) => {
          setSize(next)
          setPage(1)
        }}
        onPageChange={setPage}
        labels={LABELS}
      />
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'Pagination',
  states: {
    'First page': () => <Pages initial={1} total={128} />,
    'In the middle of many': () => <Pages initial={12} total={600} />,
    'One page': () => <Pages initial={1} total={8} />,
  },
} satisfies Story
