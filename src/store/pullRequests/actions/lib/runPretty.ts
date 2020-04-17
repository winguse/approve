import { HightLight } from '../../index.d'

export default function runPretty (spans: Array<number | string>, spanIdx: number, line: string, pos: number) {
  const hightLights: HightLight[] = []
  const lineEnding: HightLight = {
    value: '',
    type: 'no-ending'
  }
  if (line.endsWith('\r\n')) {
    lineEnding.type = 'rn-ending'
    lineEnding.value = '\r\n'
    line = line.slice(0, line.length - 2)
  } else if (line.endsWith('\n')) {
    lineEnding.type = 'n-ending'
    lineEnding.value = '\n'
    line = line.slice(0, line.length - 1)
  }
  while (line.length > 0) {
    while (spans[spanIdx + 2] <= pos) { // spans will always ends with safeEndingSpan
      spanIdx += 2
    }
    // @ts-ignore
    const currentSpanEndPos: number = spans[spanIdx + 2]
    // @ts-ignore
    const currentSpanType: string = spans[spanIdx + 1]
    const cutLength = Math.min(line.length, currentSpanEndPos - pos)
    hightLights.push({
      type: currentSpanType,
      value: line.slice(0, cutLength)
    })
    line = line.slice(cutLength)
    pos += cutLength
  }
  hightLights.push(lineEnding)
  return { spanIdx, hightLights }
}
