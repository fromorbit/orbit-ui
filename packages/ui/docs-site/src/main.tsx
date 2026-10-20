import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { stories } from '../../src/gallery'
import { DocsPage } from './DocsPage'
import './styles.css'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <DocsPage stories={stories} />
    </StrictMode>,
  )
}
