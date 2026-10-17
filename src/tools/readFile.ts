import { z } from 'zod'
import { defineTool } from '../engine/types'

export const readFile = defineTool({
  name: 'read_file',
  description: 'Return the contents of a file.',
  schema: z.object({
    path: z.string().describe('Absolute path to the file, e.g. src/hello.txt'),
  }),
  run(level, { path }) {            // path is typed as string
    const f = level.files[path]
    return f
      ? f.content
      : `Error: ${path} not found`
  },
})