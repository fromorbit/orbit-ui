import type { Story } from '../gallery/story'
import { ProjectMark } from './ProjectMark'

/** Made-up projects. */
const projects = ['webshop', 'boekhoud-api', 'interne-tools', 'docs-site']

export default {
  group: 'primitives',
  title: 'ProjectMark',
  states: {
    // As on the first line of a chat: the block, then the name in 11px muted.
    'Beside its name': () => (
      <div className="flex flex-col gap-2 text-[11px] leading-4 text-muted">
        {projects.map((project) => (
          <span key={project} className="flex items-center gap-1.5">
            <ProjectMark name={project} />
            {project}
          </span>
        ))}
      </div>
    ),
    // No colour per project: two names with the same letter draw the same block.
    'The same letter, the same block': () => (
      <div className="flex items-center gap-2">
        <ProjectMark name="webshop" />
        <ProjectMark name="wiki" />
        <ProjectMark name="🚀raket" />
      </div>
    ),
  },
} satisfies Story
