import React from 'react'
import { Typography, TypographyProps } from '@mui/material'
import { makeStyles } from 'tss-react/mui'
import { keyframes } from 'tss-react'

const useStyles = makeStyles()({
  dots: {
    '&::after': {
      display: 'inline-block',
      content: '""',
      width: '1em',
      textAlign: 'left',
      animation: `${keyframes`
      0% {
        content: '';
      }
      25% {
          content: '.';
      }
      50% {
        content: '..';
      }
      75% {
        content: '...';
      }
      `} 1.4s infinite ease-in-out`,
    },
  },
})

interface Props extends TypographyProps {
  message?: string
}

export default function LoadingEllipses({
  message = 'Loading',
  variant = 'body2',
  ...rest
}: Props) {
  const { classes } = useStyles()
  return (
    <Typography className={classes.dots} {...rest} variant={variant}>
      {`${message || 'Loading'}`}
    </Typography>
  )
}
