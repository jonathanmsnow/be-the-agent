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
    console.log(`listFiles: path=${path}, files=${files}`)
    return files.length > 0
      ? files.join('\n')
      : `Error: ${path} not found`
  },
})