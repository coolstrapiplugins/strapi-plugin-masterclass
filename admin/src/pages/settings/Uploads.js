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
import axios from "../../utils/axiosInstance"

const SettingsPage = () => {
  const [config, setConfig] = useState({
    initial: null,
    current: {
      mux_access_key_id: null,
      mux_access_key_secret: null
    }
  })
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)
  const url = `masterclass/config`
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

    let mux_access_key_id = config.current.mux_access_key_id !== null
    let mux_access_key_secret = config.current.mux_access_key_secret !== null

    if (mux_access_key_id) {
      mux_access_key_id =
        config.current.mux_access_key_id !== config.initial.mux_access_key_id
    }
    if (mux_access_key_secret) {
      mux_access_key_secret =
        config.current.mux_access_key_secret !== config.initial.mux_access_key_secret
    }
    return (
      mux_access_key_id || mux_access_key_secret
    )
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("submitting", {config})
    if (
      !( // at least one of the fields should not be null
        config.current.mux_access_key_id !== null ||
        config.current.mux_access_key_secret !== null
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
        <Typography variant="alpha" fontWeight="bold">Ratings settings</Typography>
      </Box>
      <Box background="neutral0" padding={6}>
        <Stack size={4}>
          <Typography variant="beta">
            These parameters are required for uploading videos to <a href="https://mux.com">Mux</a>.
          </Typography>
          <Stack size={0}>
            <Typography variant="epsilon">
              Current configuration:
            </Typography>
            <Typography>
              Mux Access key ID: {" "}
              <Typography fontWeight="bold">
                {
                  !config.initial ? "loading..." :
                  config.initial.mux_access_key_id || "unset"
                }
              </Typography>
            </Typography>
            <Typography>
              Mux Access key Secret: {" "}
              <Typography fontWeight="bold">
                {
                  !config.initial ? "loading..." :
                  config.initial.mux_access_key_secret || "unset"
                }
              </Typography>
            </Typography>
          </Stack>
        </Stack>
        <Box paddingTop={4} paddingBottom={2}>
          <form onSubmit={handleSubmit}>
            <Stack size={2}>
              <TextInput
                label="Mux Access key ID"
                name="mux_access_key_id"
                onChange={e => handleChange("mux_access_key_id", e.target.value)}
                value={
                  config.current.mux_access_key_id !== null ?
                    config.current.mux_access_key_id
                  : config.initial ? config.initial.mux_access_key_id : ""
                }
                required={true}
              />
              <TextInput
                label="Mux Access key ((((secret))))"
                name="mux_access_key_secret"
                onChange={e => handleChange("mux_access_key_secret", e.target.value)}
                value={
                  config.current.mux_access_key_secret !== null ?
                    config.current.mux_access_key_secret
                  : config.initial ? config.initial.mux_access_key_secret : ""
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
