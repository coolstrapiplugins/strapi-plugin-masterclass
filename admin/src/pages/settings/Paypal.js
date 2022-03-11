/*
 *
 * Settings Page
 *
 */

import React, { memo, useState, useEffect } from 'react';
// import PropTypes from 'prop-types';
import { Box } from "@strapi/design-system/Box"
import { Typography } from '@strapi/design-system/Typography';
import { Status } from '@strapi/design-system/Status';
import { TextInput } from '@strapi/design-system/TextInput';
import { Button } from '@strapi/design-system/Button';
import { Tooltip } from '@strapi/design-system/Tooltip';
import { Stack } from '@strapi/design-system/Stack';
import { Textarea } from '@strapi/design-system/Textarea';
import axios from "../../utils/axiosInstance"

const SettingsPage = () => {
  const [config, setConfig] = useState({
    initial: null,
    current: {
      mux_access_key_id: null,
      mux_access_key_secret: null,
      mux_signing_key_id: null,
      mux_signing_private_key: null
    }
  })
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)
  const url = `masterclass/paypal`
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await axios.get(url)
        setConfig({
          ...config,
          initial: data.config
        })
      } catch(err) {
        console.log(err)
        if (!status) {
          setStatus(
            <Status variant="danger">
              <Typography>
                The config could not be loaded. Please check console
              </Typography>
            </Status>
          )
        }
      }
    }
    fetchConfig()
  }, [])
  const handleChange = (param, value) => {
    const newConfig = {
      ...config,
      current: {
        ...config.current,
        [param]: value
      }
    }
    setConfig(newConfig)
  }
  const isNewConfig = () => {
    if (!config.initial) {
      return true
    }

    let paypal_client_id = config.current.paypal_client_id !== null
    let paypal_client_secret = config.current.paypal_client_secret !== null

    if (paypal_client_id) {
      paypal_client_id =
        config.current.paypal_client_id !== config.initial.paypal_client_id
    }
    if (paypal_client_secret) {
      paypal_client_secret =
        config.current.paypal_client_secret !== config.initial.paypal_client_secret
    }
    return (
      paypal_client_id || paypal_client_secret
    )
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("submitting", {config})
    if (
      !( // at least one of the fields should not be null
        config.current.paypal_client_id !== null ||
        config.current.paypal_client_secret !== null
      )
    ) {
      return
    }

    setSending(true)
    try {
      if (isNewConfig()) {
        await axios.post(url, JSON.stringify({ config: config.current }))
      }
      const newInitial = {...config.current}
      for (const key in newInitial) {
        if (newInitial[key] === null) {
          delete newInitial[key]
        }
      }
      const newConfig = {
        ...config,
        initial: {...config.initial, ...newInitial}
      }
      setConfig(newConfig)
      setStatus(
        <Status variant="success">
          <Typography>
            The config has been updated correctly
          </Typography>
        </Status>
      )
    } catch(err) {
      console.log(err)
      setStatus(
        <Status variant="danger">
          <Typography>
            The config could not be set. Please check console
          </Typography>
        </Status>
      )
    } finally {
      setSending(false)
    }
  }
  return (
    <Box background="neutral100" padding={8}>
      <Box paddingBottom={3} paddingTop={3}>
        <Typography variant="alpha" fontWeight="bold">Paypal settings</Typography>
      </Box>
      <Box background="neutral0" padding={6}>
        <Stack size={4}>
          <Typography variant="beta">
            Set the following fields if you're accepting payments with PayPal
          </Typography>
          <Stack size={0}>
            <Typography variant="epsilon">
              Current configuration:
            </Typography>
            <Typography>
              PayPal client ID: {" "}
              <Typography fontWeight="bold">
                {
                  !config.initial ? "loading..." :
                  config.initial.paypal_client_id ?
                  consig.initial.paypal_client_id.substr(0,45)+"..." : "unset"
                }
              </Typography>
            </Typography>
            <Typography>
              PayPal client secret: {" "}
              <Typography fontWeight="bold">
                {
                  !config.initial ? "loading..." :
                  config.initial.paypal_client_secret ?
                  config.initial.paypal_client_secret.substr(0,45)+"..." : "unset"
                }
              </Typography>
            </Typography>
          </Stack>
        </Stack>
        <Box paddingTop={4} paddingBottom={2}>
          <form onSubmit={handleSubmit}>
            <Stack size={2}>
              <TextInput
                label="PayPal client ID"
                name="paypal_client_id"
                onChange={e => handleChange("paypal_client_id", e.target.value)}
                value={
                  config.current.paypal_client_id !== null ?
                    config.current.paypal_client_id
                  : config.initial ? config.initial.paypal_client_id : ""
                }
                required={true}
              />
              <TextInput
                label="PayPal client secret"
                name="paypal_client_secret"
                onChange={e => handleChange("paypal_client_secret", e.target.value)}
                value={
                  config.current.paypal_client_secret !== null ?
                    config.current.paypal_client_secret
                  : config.initial ? config.initial.paypal_client_secret : ""
                }
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
