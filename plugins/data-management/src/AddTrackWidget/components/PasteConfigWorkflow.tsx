import React, { useState } from 'react'
import { Button, TextField } from '@mui/material'
import { ErrorMessage } from '@jbrowse/core/ui'
import { makeStyles } from 'tss-react/mui'
import { getSession } from '@jbrowse/core/util'
import { observer } from 'mobx-react'

// locals
import { AddTrackModel } from '../model'

const useStyles = makeStyles()(theme => ({
  textbox: {
    width: '100%',
  },
  paper: {
    margin: theme.spacing(),
    padding: theme.spacing(),
  },
  submit: {
    marginTop: 25,
    marginBottom: 100,
    display: 'block',
  },
}))

function AddTrackWorkflow({ model }: { model: AddTrackModel }) {
  const { classes } = useStyles()
  const [val, setVal] = useState('')
  const [error, setError] = useState<unknown>()

  return (
    <div>
      {error ? <ErrorMessage error={error} /> : null}
      <TextField
        multiline
        rows={10}
        value={val}
        onChange={event => setVal(event.target.value)}
        placeholder={'Paste track config in JSON format'}
        variant="outlined"
        className={classes.textbox}
      />
      <Button
        variant="contained"
        className={classes.submit}
        onClick={() => {
          try {
            const session = getSession(model)
            const conf = JSON.parse(val)

            session.addTrackConf(conf)
            model.view?.showTrack(conf.trackId)
            model.clearData()
            session.hideWidget(model)
          } catch (e) {
            setError(e)
          }
        }}
      >
        Submit
      </Button>
    </div>
  )
}
export default observer(AddTrackWorkflow)
