import { z } from 'zod'
import { defineTool } from '../engine/types'

export const readFile = defineTool({
  name: 'read_file',
  description: 'Return the contents of a file.',
  schema: z.object({
    path: z.string().describe('Path to the file, e.g. src/config.json'),
  }),
  run(level, { path }) {            // path is typed as string
    const f = level.files[path]
    return f
      ? { output: f.content, cost: f.tokens }
      : { output: `Error: ${path} not found`, cost: 20 }
  },
})