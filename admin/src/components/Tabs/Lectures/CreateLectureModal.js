/*
 *
 * Create lectures
 *
 */

import React, { memo, useState, useEffect } from 'react';
// import PropTypes from 'prop-types';
import { Box } from "@strapi/design-system/Box"
import { Stack } from "@strapi/design-system/Stack"
import { Typography } from '@strapi/design-system/Typography'
import { Button } from '@strapi/design-system/Button'
import { Status } from '@strapi/design-system/Status';
import {
  ModalLayout,
  ModalHeader,
  ModalFooter,
  ModalBody
} from '@strapi/design-system/ModalLayout';
import { TextInput } from '@strapi/design-system/TextInput';

import axios from '../../../utils/axiosInstance';

const CreateLectureModal = (props) => {
  const { close, addLecture } = props
  const [title, setTitle] = useState("")
  const [error, setError] = useState("")
  const [video, setVideo] = useState(null)
  const [sending, setSending] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!video || !title) {
      return
    }
    setError("")
    setSending(true)
    const url = "/masterclass/lectures"
    const formData = new FormData();
    formData.append("video", video, video.name);
    formData.append("data", JSON.stringify({title}));
    try {
      const { newLecture } = await axios.post(url, formData)
      addLecture(newLecture)
    } catch(err) {
      console.log(err)
      setError("Could not submit video")
      setSending(false)
    }
  }
  return (
    <ModalLayout labelledBy="title" onClose={close}>
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          Create lecture
        </Typography>
      </ModalHeader>
      <ModalBody>
        <Stack size={4}>
          <form onSubmit={handleSubmit}>
            <Stack size={2}>
              <TextInput
                label="Lecture title"
                name="title"
                onChange={e => setTitle(e.target.value)}
                value={title}
                required={true}
              />
              <input type="file" onChange={e => setVideo(e.target.files[0])} />
              <Box>
                <Button
                  type="submit"
                  loading={sending ? true : undefined}
                >Submit</Button>
              </Box>
            </Stack>
          </form>
          {
            error &&
            <Status variant="danger">
              <Typography>
                {error}
              </Typography>
            </Status>
          }
        </Stack>
      </ModalBody>
      <ModalFooter
        startActions={<></>}
        endActions={<Button onClick={close}>Finish</Button>}
      />
    </ModalLayout>
  )
}

export default CreateLectureModal
