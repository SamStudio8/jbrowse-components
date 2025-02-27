import { fireEvent, within } from '@testing-library/react'

// locals
import {
  setup,
  expectCanvasMatch,
  createView,
  hts,
  pc,
  doBeforeEach,
} from './util'

setup()

beforeEach(() => {
  doBeforeEach()
})

const delay = { timeout: 20000 }

test('opens an alignments track', async () => {
  const { view, findByTestId, findByText, findAllByTestId } = createView()
  await findByText('Help')
  view.setNewView(5, 100)
  fireEvent.click(
    await findByTestId(hts('volvox_alignments_pileup_coverage'), {}, delay),
  )

  const { findByTestId: f1 } = within(
    await findByTestId('Blockset-pileup', {}, delay),
  )
  expectCanvasMatch(await f1(pc('{volvox}ctgA:1..4000-0'), {}, delay))

  const { findByTestId: f2 } = within(
    await findByTestId('Blockset-snpcoverage', {}, delay),
  )
  expectCanvasMatch(await f2(pc('{volvox}ctgA:1..4000-0'), {}, delay))

  const track = await findAllByTestId('pileup_overlay_canvas')
  fireEvent.mouseMove(track[0], { clientX: 200, clientY: 20 })
  fireEvent.click(track[0], { clientX: 200, clientY: 40 })
  fireEvent.mouseDown(track[0], { clientX: 200, clientY: 20 })
  fireEvent.mouseMove(track[0], { clientX: 300, clientY: 20 })
  fireEvent.mouseUp(track[0], { clientX: 300, clientY: 20 })
  fireEvent.mouseMove(track[0], { clientX: -100, clientY: -100 })

  // this is to confirm a alignment detail widget opened
  await findByTestId('alignment-side-drawer', {}, delay)
}, 20000)

test('test that bam with small max height displays message', async () => {
  const { findByTestId, findAllByText } = createView()
  fireEvent.click(
    await findByTestId(hts('volvox_bam_small_max_height'), {}, delay),
  )

  await findAllByText('Max height reached', {}, delay)
}, 30000)

test('test snpcoverage doesnt count snpcoverage', async () => {
  const { view, findByTestId, findByText } = createView()
  await findByText('Help')
  view.setNewView(0.03932, 67884.16536402702)
  fireEvent.click(
    await findByTestId(hts('volvox-long-reads-sv-cram'), {}, delay),
  )
  const { findByTestId: f1 } = within(
    await findByTestId('Blockset-snpcoverage', {}, delay),
  )

  expectCanvasMatch(await f1(pc('{volvox}ctgA:2657..2688-0'), {}, delay))
  expectCanvasMatch(await f1(pc('{volvox}ctgA:2689..2720-0'), {}, delay))
}, 30000)
