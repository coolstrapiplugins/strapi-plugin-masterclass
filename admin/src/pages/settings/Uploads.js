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
      OSS_access_key_id: null,
      OSS_access_key_secret: null,
      VOD_region: null,
      VOD_template_group_id: null
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

    let OSS_access_key_id = config.current.OSS_access_key_id !== null
    let OSS_access_key_secret = config.current.OSS_access_key_secret !== null
    let VOD_region = config.current.VOD_region !== null
    let VOD_template_group_id = config.current.VOD_template_group_id !== null

    if (OSS_access_key_id) {
      OSS_access_key_id =
        config.current.OSS_access_key_id !== config.initial.OSS_access_key_id
    }
    if (OSS_access_key_secret) {
      OSS_access_key_secret =
        config.current.OSS_access_key_secret !== config.initial.OSS_access_key_secret
    }
    if (VOD_region) {
      VOD_region =
        config.current.VOD_region !== config.initial.VOD_region
    }
    if (VOD_template_group_id) {
      VOD_template_group_id =
        config.current.VOD_template_group_id !== config.initial.VOD_template_group_id
    }
    return (
      OSS_access_key_id || OSS_access_key_secret || VOD_region || VOD_template_group_id
    )
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("submitting", {config})
    if (
      !( // at least one of the fields should not be null
        config.current.OSS_access_key_id !== null ||
        config.current.OSS_access_key_secret !== null ||
        config.current.VOD_region !== null ||
        config.current.VOD_template_group_id !== null
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
            These parameters are required for uploading videos to Alibaba Cloud Apsara VOD.
          </Typography>
          <Stack size={0}>
            <Typography variant="epsilon">
              Current configuration:
            </Typography>
            <Typography>
              OSS Access key ID: {" "}
              <Typography fontWeight="bold">
                {
                  !config.initial ? "loading..." :
                  config.initial.OSS_access_key_id || "unset"
                }
              </Typography>
            </Typography>
            <Typography>
              OSS Access key Secret: {" "}
              <Typography fontWeight="bold">
                {
                  !config.initial ? "loading..." :
                  config.initial.OSS_access_key_secret || "unset"
                }
              </Typography>
            </Typography>
            <Typography>
              VOD region:  {" "}
              <Typography fontWeight="bold">
                {
                  !config.initial ? "loading..." :
                  config.initial.VOD_region || "unset"
                }
              </Typography>
            </Typography>
            <Typography>
              VOD template group ID:  {" "}
              <Typography fontWeight="bold">
                {
                  !config.initial ? "loading..." :
                  config.initial.VOD_template_group_id || "unset"
                }
              </Typography>
            </Typography>
          </Stack>
        </Stack>
        <Box paddingTop={4} paddingBottom={2}>
          <form onSubmit={handleSubmit}>
            <Stack size={2}>
              <TextInput
                label="OSS Access key ID"
                name="OSS_access_key_id"
                onChange={e => handleChange("OSS_access_key_id", e.target.value)}
                value={
                  config.current.OSS_access_key_id !== null ?
                    config.current.OSS_access_key_id
                  : config.initial ? config.initial.OSS_access_key_id : ""
                }
                required={true}
              />
              <TextInput
                label="OSS Access key ((((secret))))"
                name="OSS_access_key_secret"
                onChange={e => handleChange("OSS_access_key_secret", e.target.value)}
                value={
                  config.current.OSS_access_key_secret !== null ?
                    config.current.OSS_access_key_secret
                  : config.initial ? config.initial.OSS_access_key_secret : ""
                }
                required={true}
              />
              <TextInput
                label="VOD region"
                name="VOD_region"
                onChange={e => handleChange("VOD_region", e.target.value)}
                value={
                  config.current.VOD_region !== null ?
                    config.current.VOD_region
                  : config.initial ? config.initial.VOD_region : ""
                }
                required={true}
              />
              <TextInput
                label="VOD template group ID"
                name="VOD_template_group_id"
                onChange={e => handleChange("VOD_template_group_id", e.target.value)}
                value={
                  config.current.VOD_template_group_id !== null ?
                    config.current.VOD_template_group_id
                  : config.initial ? config.initial.VOD_template_group_id : ""
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
