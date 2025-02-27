import '@testing-library/jest-dom/extend-expect'
import { fireEvent, waitFor } from '@testing-library/react'
import { TextEncoder, TextDecoder } from 'web-encoding'

import { createView, setup, doBeforeEach } from './util'

window.TextEncoder = TextEncoder
window.TextDecoder = TextDecoder

setup()

beforeEach(() => {
  doBeforeEach()
})

const delay = { timeout: 10000 }

test('opens a vcf.gz file in the spreadsheet view', async () => {
  const { session, findByTestId, getByTestId, findByText } = createView()

  fireEvent.click(await findByText('File'))
  fireEvent.click(await findByText('Add'))
  fireEvent.click(await findByText('Spreadsheet view'))

  await findByTestId('spreadsheet_view_open', {}, delay)
  fireEvent.change(await findByTestId('urlInput'), {
    target: { value: 'volvox.filtered.vcf.gz' },
  })
  await waitFor(() =>
    expect(
      getByTestId('open_spreadsheet').closest('button'),
    ).not.toBeDisabled(),
  )
  fireEvent.click(await findByTestId('open_spreadsheet'))
  expect(session.views.length).toBe(2)
}, 15000)

test('opens a bed.gz file in the spreadsheet view', async () => {
  const { session, findByTestId, getByTestId, findByText } = createView()
  fireEvent.click(await findByText('File'))
  fireEvent.click(await findByText('Add'))
  fireEvent.click(await findByText('Spreadsheet view'))

  await findByTestId('spreadsheet_view_open', {}, delay)
  fireEvent.change(await findByTestId('urlInput'), {
    target: { value: 'volvox-bed12.bed.gz' },
  })
  await waitFor(() =>
    expect(
      getByTestId('open_spreadsheet').closest('button'),
    ).not.toBeDisabled(),
  )
  fireEvent.click(await findByTestId('open_spreadsheet'))
  expect(session.views.length).toBe(2)
}, 15000)
