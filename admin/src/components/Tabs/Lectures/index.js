/*
 *
 * View and create lectures
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

import pluginId from '../../../pluginId';
import axios from '../../../utils/axiosInstance';
import LecturesContainer from "./LecturesContainer"
import CreateLectureModal from "./CreateLectureModal"

const Courses = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("")
  const [openCreateModal, setOpenCreateModal] = useState(false)

  const addLecture = (newLecture) => {
    const lectures = data ? [...data.lectures] : []
    setData({lectures: [newLecture, ...lectures]})
    setOpenCreateModal(false)
  }
  const handleLoadLectures = () => {
    const url = "/masterclass/get-video-list"
    axios.post(url)
  }

  useEffect(() => {
    const fetchLectures = async () => {
      const url = "/masterclass/lectures"
      try {
        const { data } = await axios.get(url)
        setData(data)
      } catch(err) {
        console.log(err)
        setData({ lectures: [] })
        setError("Could not load lectures")
      }
    }
    fetchLectures()
  }, [])

  return (
    <Stack size={4}>
      <Box background="neutral0" padding={4}>
        <Stack size={4}>
          <Box>
            <Button onClick={() => setOpenCreateModal(true)}>New Lecture</Button>
          </Box>
          <Box>
            <Button onClick={handleLoadLectures}>Load lectures from cloud</Button>
          </Box>
          {
            !data ?
              <Typography variant="beta">Loading lectures...</Typography>
            : <LecturesContainer data={data} />
          }
        </Stack>
      </Box>
      {
        error &&
        <Status variant="danger">
          <Typography>
            {error}
          </Typography>
        </Status>
      }
      {
        openCreateModal &&
        <CreateLectureModal
          close={() => setOpenCreateModal(false)}
          addLecture={addLecture}
        />
      }
    </Stack>
  );
};

export default memo(Courses);
