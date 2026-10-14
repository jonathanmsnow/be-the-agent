import { z } from 'zod'
import { defineTool } from '../engine/types'

export const listFiles = defineTool({
  name: 'list_files',
  description: 'List the files in a directory.',
  schema: z.object({
    path: z.string().describe('Path to the directory, e.g. src/'),
  }),
  run(level, { path }) {            // path is typed as string
    const files = Object.keys(level.files).filter(p => p.startsWith(path))
    return files.length > 0
      ? { output: files.join('\n'), cost: 10 }
      : { output: `Error: ${path} not found`, cost: 20 }
  },
})