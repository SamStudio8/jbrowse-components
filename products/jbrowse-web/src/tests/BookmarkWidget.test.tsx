import { waitFor, fireEvent } from '@testing-library/react'

import { createView, setup, hts, doBeforeEach } from './util'

setup()

beforeEach(() => {
  doBeforeEach()
})

const delay = { timeout: 15000 }

test('click and drag rubberBand, bookmarks region', async () => {
  const { session, view, findByTestId, findByText } = createView()
  const rubberband = await findByTestId('rubberBand_controls', {}, delay)

  expect(view.bpPerPx).toEqual(0.05)
  fireEvent.mouseDown(rubberband, { clientX: 100, clientY: 0 })
  fireEvent.mouseMove(rubberband, { clientX: 250, clientY: 0 })
  fireEvent.mouseUp(rubberband, { clientX: 250, clientY: 0 })
  const bookmarkMenuItem = await findByText('Bookmark region')
  fireEvent.click(bookmarkMenuItem)

  // @ts-ignore
  const { widgets } = session
  const bookmarkWidget = widgets.get('GridBookmark')
  expect(bookmarkWidget.bookmarkedRegions[0].assemblyName).toEqual('volvox')
}, 20000)

test('bookmarks current region', async () => {
  const { session, findByTestId, findByText } = createView()

  fireEvent.click(await findByTestId('view_menu_icon'))
  fireEvent.click(await findByText('Bookmark current region'))

  // @ts-ignore
  const { widgets } = session
  const { bookmarkedRegions } = widgets.get('GridBookmark')
  expect(bookmarkedRegions[0].start).toEqual(100)
  expect(bookmarkedRegions[0].end).toEqual(140)
}, 20000)

test('navigates to bookmarked region from widget', async () => {
  const { view, session, findByTestId, findByText } = createView()

  // need this to complete before we can try to navigate
  fireEvent.click(await findByTestId(hts('volvox_alignments'), {}, delay))
  await findByTestId(
    'trackRenderingContainer-integration_test-volvox_alignments',
    {},
    delay,
  )

  const viewMenu = await findByTestId('view_menu_icon')
  fireEvent.click(viewMenu)
  fireEvent.click(await findByText('Open bookmark widget'))

  // @ts-ignore
  const { widgets } = session
  const bookmarkWidget = widgets.get('GridBookmark')
  bookmarkWidget.addBookmark({
    start: 200,
    end: 240,
    refName: 'ctgA',
    assemblyName: 'volvox',
  })

  fireEvent.click(await findByText('ctgA:201..240', {}, delay))
  await waitFor(() =>
    expect(
      view.getSelectedRegions(view.leftOffset, view.rightOffset)[0].key,
    ).toEqual('{volvox}ctgA:201..240-0'),
  )
}, 20000)
