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
  const [status, setStatus] = useState(null)
  const [loadingLectures, setLoadingLectures] = useState(false)
  const [openCreateModal, setOpenCreateModal] = useState(false)

  const addLecture = (newLecture) => {
    const lectures = data ? [...data.lectures] : []
    setData({lectures: [newLecture, ...lectures]})
    setOpenCreateModal(false)
  }
  const handleLoadLectures = async () => {
    const url = "/masterclass/get-video-list"
    try {
      setLoadingLectures(true)
      const { data } = await axios.post(url)
      let txt = "lectures"
      let newLecturesNum = 0
      if (data.lectures && data.lectures.length > 0) {
        newLecturesNum = data.lectures.length
        if (newLecturesNum === 1) {
          txt = "lecture"
        }
      }
      setStatus({
        msg: `${newLecturesNum} ${txt} were loaded from Mux`,
        variant: "success"
      })
      if (newLecturesNum > 0) {
        setData(prevData => {
          const newData = data
          if (prevData && prevData.lectures) {
            newData.lectures = newData.lectures.concat(prevData.lectures)
          }
          return newData
        })
      }
    } catch(err) {
      console.log(err)
      setStatus({msg: "Could not load lectures", variant: "danger"})
    } finally {
      setLoadingLectures(false)
    }
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
        setStatus({msg: "Could not load lectures", variant: "danger"})
      }
    }
    fetchLectures()
  }, [])

  return (
    <Stack spacing={4}>
      <Box background="neutral0" padding={4}>
        <Stack horizontal spacing={4}>
          <Box>
            <Button onClick={() => setOpenCreateModal(true)}>New Lecture</Button>
          </Box>
          <Box>
            <Button
              variant="success-light"
              onClick={handleLoadLectures}
              loading={loadingLectures}
            >Load lectures from cloud</Button>
          </Box>
        </Stack>
        <Box paddingTop={4}>
          {
            !data ?
              <Typography variant="beta">Loading lectures...</Typography>
            : <LecturesContainer data={data} />
          }
        </Box>
      </Box>
      {
        status &&
        <Status variant={status.variant}>
          <Typography>
            {status.msg}
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
