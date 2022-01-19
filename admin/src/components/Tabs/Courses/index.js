/*
 *
 * View and create courses
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
import CoursesContainer from "./CoursesContainer"

const Courses = () => {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState("")

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

  return (
    <Stack size={4}>
      <Box background="neutral0" padding={4}>
        <Stack size={4}>
          <Box>
            <Button>New course</Button>
          </Box>
          {
            !courses ?
              <Typography variant="beta">Loading courses...</Typography>
            : <CoursesContainer data={courses} />
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
    </Stack>
  );
};

export default memo(Courses);
