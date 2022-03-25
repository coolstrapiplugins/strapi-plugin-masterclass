/*
 *
 * View and create courses
 *
 */

import React, { memo, useState, useEffect } from 'react'
// import PropTypes from 'prop-types';
import { Box } from "@strapi/design-system/Box"
import { Loader } from '@strapi/design-system/Loader';
import { TextInput } from "@strapi/design-system/TextInput"
import { Textarea } from "@strapi/design-system/Textarea"
import { NumberInput } from "@strapi/design-system/NumberInput"
import { Stack } from "@strapi/design-system/Stack"
import { Typography } from '@strapi/design-system/Typography'
import { Button } from '@strapi/design-system/Button'
import { Status } from '@strapi/design-system/Status'
import {
  ModalLayout,
  ModalHeader,
  ModalFooter,
  ModalBody
} from '@strapi/design-system/ModalLayout'

import pluginId from '../../../pluginId'
import axios from '../../../utils/axiosInstance'
import CoursesContainer from "./CoursesContainer"
import EditCourseModal from "./EditCourseModal"

const Courses = () => {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const fetchCourses = async () => {
      const url = "/masterclass/courses"
      try {
        const { data } = await axios.get(url)
        setCourses(data)
      } catch(err) {
        console.log(err)
        setCourses([])
        setError("Could not load courses")
      }
    }
    fetchCourses()
  }, [])

  const handleAddCourse = (newCourse) => {
    setCourses((prevData) => {
      const newCourses = [newCourse]
      if (prevData) {
        newCourses.push(...prevData.courses)
      }
      return {courses: newCourses}
    })
  }

  return (
    <>
      <Stack spacing={4}>
        <Box background="neutral0" padding={4}>
          <Box paddingBottom={4}>
            <Button onClick={() => setModalOpen(true)}>Create course</Button>
          </Box>
          {
            !courses ?
              <Loader>Loading courses...</Loader>
            : <CoursesContainer data={courses} />
          }
        </Box>
        {
          error &&
          <Status variant="danger">
            <Typography>
              {error}
            </Typography>
          </Status>
        }
      </Stack>
      {
        modalOpen && (
          <EditCourseModal
            data={null}
            closeAfterSubmit
            httpMethod="post"
            update={handleAddCourse}
            modalHeaderText="Create course"
            submitUrl="/masterclass/courses"
            close={() => setModalOpen(false)}
          />
        )
      }
    </>
  );
};

export default memo(Courses);
