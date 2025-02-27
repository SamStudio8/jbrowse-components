import React, { useEffect, useRef, useState } from 'react'
import {
  SvgIconProps,
  IconButton,
  IconButtonProps as IconButtonPropsType,
  Paper,
  Tooltip,
  useTheme,
} from '@mui/material'
import { makeStyles } from 'tss-react/mui'
import { alpha } from '@mui/material/styles'
import { observer } from 'mobx-react'
import { isAlive } from 'mobx-state-tree'
import useMeasure from 'react-use-measure'

// icons
import CloseIcon from '@mui/icons-material/Close'
import MenuIcon from '@mui/icons-material/Menu'

// locals
import { IBaseViewModel } from '../pluggableElementTypes/models'
import EditableTypography from './EditableTypography'
import Menu from './Menu'

const useStyles = makeStyles()(theme => ({
  viewContainer: {
    overflow: 'hidden',
    background: theme.palette.secondary.main,
    margin: theme.spacing(0.5),
  },
  icon: {
    color: theme.palette.secondary.contrastText,
  },
  grow: {
    flexGrow: 1,
  },
  iconRoot: {
    '&:hover': {
      backgroundColor: alpha(
        theme.palette.secondary.contrastText,
        theme.palette.action.hoverOpacity,
      ),
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
  },

  input: {
    paddingBottom: 0,
    paddingTop: 2,
  },
  inputBase: {
    color: theme.palette.secondary.contrastText,
  },
  inputRoot: {
    '&:hover': {
      backgroundColor: theme.palette.secondary.light,
    },
  },
  inputFocused: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.secondary.light,
  },
}))

const ViewMenu = observer(
  ({
    model,
    IconButtonProps,
    IconProps,
  }: {
    model: IBaseViewModel
    IconButtonProps: IconButtonPropsType
    IconProps: SvgIconProps
  }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement>()
    const { menuItems } = model

    // <=1.3.3 didn't use a function
    const items = typeof menuItems === 'function' ? menuItems() : menuItems

    return items?.length ? (
      <>
        <IconButton
          {...IconButtonProps}
          style={{ padding: 3 }}
          onClick={event => setAnchorEl(event.currentTarget)}
          data-testid="view_menu_icon"
          size="small"
        >
          <MenuIcon {...IconProps} fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onMenuItemClick={(_event, callback) => {
            callback()
            setAnchorEl(undefined)
          }}
          onClose={() => setAnchorEl(undefined)}
          menuItems={model.menuItems()}
        />
      </>
    ) : null
  },
)
const ViewContainer = observer(
  ({
    view,
    onClose,
    style,
    children,
  }: {
    view: IBaseViewModel
    onClose: () => void
    style?: React.CSSProperties
    children: React.ReactNode
  }) => {
    const { classes } = useStyles()
    const theme = useTheme()
    const padWidth = theme.spacing(1)

    const [ref, { width }] = useMeasure()

    useEffect(() => {
      if (width && isAlive(view)) {
        view.setWidth(width - parseInt(padWidth, 10) * 2)
      }
    }, [padWidth, view, width])

    const scrollRef = useRef<HTMLDivElement>(null)
    // scroll the view into view when first mounted
    // note that this effect will run only once, because of
    // the empty array second param
    useEffect(() => {
      scrollRef.current?.scrollIntoView?.({ block: 'center' })
    }, [])

    return (
      <Paper
        ref={ref}
        elevation={12}
        className={classes.viewContainer}
        style={{ ...style, padding: `0px ${padWidth} ${padWidth}` }}
      >
        <div ref={scrollRef} style={{ display: 'flex' }}>
          <ViewMenu
            model={view}
            IconButtonProps={{
              classes: { root: classes.iconRoot },
              edge: 'start',
            }}
            IconProps={{ className: classes.icon }}
          />
          <div className={classes.grow} />
          <Tooltip title="Rename view" arrow>
            <EditableTypography
              value={
                view.displayName ||
                // @ts-ignore
                view.assemblyNames?.join(',') ||
                'Untitled view'
              }
              setValue={val => view.setDisplayName(val)}
              variant="body2"
              classes={{
                input: classes.input,
                inputBase: classes.inputBase,
                inputRoot: classes.inputRoot,
                inputFocused: classes.inputFocused,
              }}
            />
          </Tooltip>
          <div className={classes.grow} />
          <IconButton
            data-testid="close_view"
            classes={{ root: classes.iconRoot }}
            edge="end"
            size="small"
            onClick={onClose}
          >
            <CloseIcon className={classes.icon} fontSize="small" />
          </IconButton>
        </div>
        <Paper>{children}</Paper>
      </Paper>
    )
  },
)

export default ViewContainer
