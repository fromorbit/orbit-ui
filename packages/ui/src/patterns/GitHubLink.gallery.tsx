import type { Story } from '../gallery/story'
import { GitHubLink } from './GitHubLink'

/**
 * Pull requests and issues in running text: one of the project itself, one of another repository
 * of the same owner, and one further away.
 */
export default {
  group: 'patterns',
  title: 'GitHubLink',
  states: {
    'In a sentence': () => (
      <p className="w-96 text-[13px] leading-normal">
        Merged in{' '}
        <GitHubLink
          label="Pull request of issue 394"
          text="#394"
          kind="either"
          number={394}
          title="voorbeeld/webwinkel#394"
          onOpen={() => {}}
        />
        , follows{' '}
        <GitHubLink
          label="Pull request 12"
          text="kassa#12"
          kind="pull"
          number={12}
          title="voorbeeld/kassa#12"
          onOpen={() => {}}
        />{' '}
        and fixes{' '}
        <GitHubLink
          label="Issue 7"
          text="ander/bibliotheek#7"
          kind="issue"
          number={7}
          title="ander/bibliotheek#7"
          onOpen={() => {}}
        />
        .
      </p>
    ),
  },
} satisfies Story
