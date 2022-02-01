/*
 *
 * Settings Page
 *
 */

import React, { memo, useState, useEffect } from 'react';
import styled from "styled-components"
// import PropTypes from 'prop-types';
import { Box } from "@strapi/design-system/Box"
import { Typography } from '@strapi/design-system/Typography';
import { Status } from '@strapi/design-system/Status';
import { TextInput } from '@strapi/design-system/TextInput';
import { Button } from '@strapi/design-system/Button';
import { Tooltip } from '@strapi/design-system/Tooltip';
import { Stack } from '@strapi/design-system/Stack';
import axios from "../../utils/axiosInstance"

const SettingsPage = () => {
  const [pk, setPk] = useState({})
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)
  const url = `masterclass/stripe-pk`
  useEffect(() => {
    const fetchPk = async () => {
      try {
        const { data } = await axios.get(url)
        setPk({
          ...pk,
          initial: data.pk
        })
      } catch(err) {
        console.log(err)
        if (!status) {
          setStatus(
            <Status variant="danger">
              <Typography>
                The Stripe private key could not be loaded. Please check console
              </Typography>
            </Status>
          )
        }
      }
    }
    fetchPk()
  }, [])
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pk.current) {
      return
    }

    setSending(true)
    try {
      if (pk.initial !== pk.current) {
        await axios.post(url, JSON.stringify({ pk: pk.current }))
      }
      setPk({
        initial: pk.current
      })
      setStatus(
        <Status variant="success">
          <Typography>
            The private key has been set successfully
          </Typography>
        </Status>
      )
    } catch(err) {
      console.log(err)
      setStatus(
        <Status variant="danger">
          <Typography>
            The private key could not be set. Please check console
          </Typography>
        </Status>
      )
    } finally {
      setSending(false)
    }
  }
  const PkTypography = styled(Typography)`
    word-break: break-all;
  `
  return (
    <Box background="neutral100" padding={8}>
      <Box paddingBottom={3} paddingTop={3}>
        <Typography variant="alpha" fontWeight="bold">Masterclass settings</Typography>
      </Box>
      <Box background="neutral0" padding={6}>
        <Stack size={2}>
          <Typography variant="beta">
            Set Stripe private key
          </Typography>
          <Typography variant="epsilon">
            Current private key: {" "}
            <PkTypography fontWeight="bold">
              {
                pk.initial === undefined ? "loading..." : pk.initial || "unset"
              }
            </PkTypography>
          </Typography>
        </Stack>
        <Box paddingTop={2} paddingBottom={2}>
          <form onSubmit={handleSubmit}>
            <Stack size={2}>
              <TextInput
                label="Private key"
                name="pk"
                onChange={e => setPk({...pk, current: e.target.value})}
                value={pk.current || ""}
                required={true}
              />
              <Box>
                <Button
                  type="submit"
                  loading={sending ? true : undefined}
                >Submit</Button>
              </Box>
            </Stack>
          </form>
        </Box>
        {
          status &&
          <Box>
            {status}
          </Box>
        }
      </Box>
    </Box>
  )
};

export default memo(SettingsPage);
