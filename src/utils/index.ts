import { ComputedOptions } from 'vue'
// @ts-ignore
import prettify from './prettify.js'

export interface Computed {
  [key: string]: ComputedOptions<string>;
}

export function updateMutationName (key: string) {
  return `update${key[0].toUpperCase()}${key.slice(1)}`
}

export function mapGetterSetter (namespace: string, fields: string[]) {
  const result: Computed = {}
  fields.forEach(field => {
    result[field] = {
      get () {
        // @ts-ignore
        return this.$store.state[namespace][field]
      },
      set (value) {
        // @ts-ignore
        this.$store.commit(`${namespace}/${updateMutationName(field)}`, value)
      }
    }
  })
  return result
}

export async function sleep (time: number) {
  await new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

export function codePrettify (sourceCode: string, extension: string | null | undefined): Array<number | string> {
  const job = {
    basePos: 0,
    sourceCode,
    decorations: []
  }
  prettify.langHandlerForExtension(extension, sourceCode)(job)
  return job.decorations
}
