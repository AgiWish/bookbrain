import type { RawBookmark } from '../parser/types'

export interface DuplicatePair {
  kept: RawBookmark
  removed: RawBookmark
}

export interface DeduplicationReport {
  totalInput: number
  uniqueCount: number
  duplicateCount: number
  duplicatePairs: DuplicatePair[]
}
