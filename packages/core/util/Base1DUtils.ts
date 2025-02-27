import { getSnapshot } from 'mobx-state-tree'
import { ViewSnap } from './index'

export interface BpOffset {
  refName?: string
  index: number
  offset: number
  start?: number
  end?: number
}

function lengthBetween(self: ViewSnap, start: BpOffset, end: BpOffset) {
  let bpSoFar = 0
  const { displayedRegions } = self
  if (start.index === end.index) {
    bpSoFar += end.offset - start.offset
  } else {
    const s = displayedRegions[start.index]
    bpSoFar += s.end - s.start - start.offset
    if (end.index - start.index >= 2) {
      for (let i = start.index + 1; i < end.index; i++) {
        const region = displayedRegions[i]
        const len = region.end - region.start
        bpSoFar += len
      }
    }
    bpSoFar += end.offset
  }
  return bpSoFar
}

export function moveTo(
  self: ViewSnap & {
    zoomTo: (arg: number) => number
    scrollTo: (arg: number) => void
  },
  start?: BpOffset,
  end?: BpOffset,
) {
  if (!start || !end) {
    return
  }
  const {
    width,
    interRegionPaddingWidth,
    displayedRegions,
    bpPerPx,
    minimumBlockWidth,
  } = self

  const len = lengthBetween(self, start, end)
  let numBlocksWideEnough = 0
  for (let i = start.index; i < end.index; i++) {
    const r = displayedRegions[i]
    if ((r.end - r.start) / bpPerPx > minimumBlockWidth) {
      numBlocksWideEnough++
    }
  }

  const targetBpPerPx =
    len / (width - interRegionPaddingWidth * numBlocksWideEnough)
  const newBpPerPx = self.zoomTo(targetBpPerPx)

  // If our target bpPerPx was smaller than the allowed minBpPerPx, adjust
  // the scroll so the requested range is in the middle of the screen
  let extraBp = 0
  if (targetBpPerPx < newBpPerPx) {
    extraBp = ((newBpPerPx - targetBpPerPx) * self.width) / 2
  }

  let bpToStart = -extraBp

  for (let i = 0; i < self.displayedRegions.length; i += 1) {
    const region = self.displayedRegions[i]
    if (start.index === i) {
      bpToStart += start.offset
      break
    } else {
      bpToStart += region.end - region.start
    }
  }

  self.scrollTo(Math.round(bpToStart / self.bpPerPx))
}

// manual return type since getSnapshot hard to infer here
export function pxToBp(
  self: ViewSnap,
  px: number,
): {
  coord: number
  index: number
  refName: string
  oob: boolean
  assemblyName: string
  offset: number
  start: number
  end: number
  reversed: boolean
} {
  let bpSoFar = 0
  const {
    bpPerPx,
    offsetPx,
    displayedRegions,
    interRegionPaddingWidth,
    staticBlocks,
  } = self
  const blocks = staticBlocks.contentBlocks
  const bp = (offsetPx + px) * bpPerPx
  if (bp < 0) {
    const region = displayedRegions[0]
    const snap = getSnapshot(region)
    // @ts-ignore
    return {
      // xref https://github.com/mobxjs/mobx-state-tree/issues/1524 for Omit
      ...(snap as Omit<typeof snap, symbol>),
      oob: true,
      coord: region.reversed
        ? Math.floor(region.end - bp) + 1
        : Math.floor(region.start + bp) + 1,
      offset: bp,
      index: 0,
    }
  }

  const interRegionPaddingBp = interRegionPaddingWidth * bpPerPx
  let currBlock = 0
  for (let i = 0; i < displayedRegions.length; i++) {
    const region = displayedRegions[i]
    const len = region.end - region.start
    const offset = bp - bpSoFar
    if (len + bpSoFar > bp && bpSoFar <= bp) {
      const snap = getSnapshot(region)
      // @ts-ignore
      return {
        // xref https://github.com/mobxjs/mobx-state-tree/issues/1524 for Omit
        ...(snap as Omit<typeof snap, symbol>),
        oob: false,
        offset,
        coord: region.reversed
          ? Math.floor(region.end - offset) + 1
          : Math.floor(region.start + offset) + 1,
        index: i,
      }
    }

    // add the interRegionPaddingWidth if the boundary is in the screen e.g. in
    // a static block
    if (blocks[currBlock]?.regionNumber === i) {
      bpSoFar += len + interRegionPaddingBp
      currBlock++
    } else {
      bpSoFar += len
    }
  }

  if (bp >= bpSoFar) {
    const region = displayedRegions[displayedRegions.length - 1]
    const len = region.end - region.start
    const offset = bp - bpSoFar + len

    const snap = getSnapshot(region)
    // @ts-ignore
    return {
      // xref https://github.com/mobxjs/mobx-state-tree/issues/1524 for Omit
      ...(snap as Omit<typeof snap, symbol>),
      oob: true,
      offset,
      coord: region.reversed
        ? Math.floor(region.end - offset) + 1
        : Math.floor(region.start + offset) + 1,
      index: displayedRegions.length - 1,
    }
  }
  return {
    coord: 0,
    index: 0,
    refName: '',
    oob: true,
    assemblyName: '',
    offset: 0,
    start: 0,
    end: 0,
    reversed: false,
  }
}

export function bpToPx({
  refName,
  coord,
  regionNumber,
  self,
}: {
  refName: string
  coord: number
  regionNumber?: number
  self: ViewSnap
}) {
  let bpSoFar = 0

  const { interRegionPaddingWidth, bpPerPx, displayedRegions, staticBlocks } =
    self
  const blocks = staticBlocks.contentBlocks
  const interRegionPaddingBp = interRegionPaddingWidth * bpPerPx
  let currBlock = 0

  let i = 0
  for (; i < displayedRegions.length; i++) {
    const region = displayedRegions[i]
    const len = region.end - region.start
    if (
      refName === region.refName &&
      coord >= region.start &&
      coord <= region.end
    ) {
      if (regionNumber ? regionNumber === i : true) {
        bpSoFar += region.reversed ? region.end - coord : coord - region.start
        break
      }
    }

    // add the interRegionPaddingWidth if the boundary is in the screen e.g. in
    // a static block
    if (blocks[currBlock]?.regionNumber === i) {
      bpSoFar += len + interRegionPaddingBp
      currBlock++
    } else {
      bpSoFar += len
    }
  }
  const found = displayedRegions[i]
  if (found) {
    return {
      index: i,
      offsetPx: Math.round(bpSoFar / bpPerPx),
    }
  }

  return undefined
}
