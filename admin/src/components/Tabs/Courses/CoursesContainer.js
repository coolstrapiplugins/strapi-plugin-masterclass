import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { Table, Thead, Tbody, Tr, Td, Th } from '@strapi/design-system/Table';
import { Checkbox } from "@strapi/design-system/Checkbox"
import {
  ModalLayout,
  ModalHeader,
  ModalFooter,
  ModalBody
} from '@strapi/design-system/ModalLayout';
import { Loader } from '@strapi/design-system/Loader';
import { Stack } from '@strapi/design-system/Stack';
import { Status } from '@strapi/design-system/Status';
import { Select, Option } from '@strapi/design-system/Select';
import { Divider } from '@strapi/design-system/Divider';
import { Button } from '@strapi/design-system/Button';
import { Typography, TextButton } from '@strapi/design-system/Typography';
import { Box } from "@strapi/design-system/Box"
import { TextInput } from "@strapi/design-system/TextInput"
import { Textarea } from "@strapi/design-system/Textarea"
import { NumberInput } from "@strapi/design-system/NumberInput"

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import EditCourseModal from "./EditCourseModal"

import axios from "../../../utils/axiosInstance"
import formatDuration from "../../../utils/duration"

const ROW_COUNT = 6;
const COL_COUNT = 10;

const CoursesContainer = ({data}) => {
  const [courses, setCourses] = useState(null)
  useEffect(() => {
    if (data && data.courses && data.courses.length) {
      const coursesJSX = data.courses.map((course) => {
        return <CourseRow data={course} key={course.id} />
      })
      setCourses(coursesJSX)
    }
  }, [data])

  return (
    <Box>
      {
        (!data.courses || !data.courses.length) ?
          <Stack spacing={4}>
            <Typography variant="beta">There are no courses yet</Typography>
            <Status variant="secondary">
              <Typography>Start creating a course from the Content Manager. Or press the button above</Typography>
            </Status>
          </Stack>
        : courses && (
          <Stack spacing={2}>
            <Typography variant="beta">
              {data.courses.length} {data.courses.length>1 ? "courses":"course"} found
            </Typography>
            <Table colCount={COL_COUNT} rowCount={ROW_COUNT}>
              <Thead>
                <Tr>
                  <Th>
                    <Typography fontWeight="bold">ID</Typography>
                  </Th>
                  <Th>
                    <Typography fontWeight="bold">Title</Typography>
                  </Th>
                  <Th>
                    <Typography fontWeight="bold">Lectures</Typography>
                  </Th>
                  <Th>
                    <Typography fontWeight="bold">Students</Typography>
                  </Th>
                  <Th>
                    <Typography fontWeight="bold">Duration</Typography>
                  </Th>
                  <Th>
                    <Typography fontWeight="bold">Category</Typography>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {courses}
              </Tbody>
            </Table>
          </Stack>
        )
      }
    </Box>
  )
}

export default CoursesContainer

const TableRow = styled(Tr)`
  &:hover {
    cursor: pointer;
    background: #d3d3d3;
  }
`
const CourseRow = ({ data }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [courseData, setCourseData] = useState(data)
  let titleSummary = courseData.title
  if (titleSummary && titleSummary.length > 25) {
    titleSummary = courseData.title.slice(0, 25)
    titleSummary += "..."
  }

  let categoryTitleSummary = "null"
  if (courseData.category) {
    categoryTitleSummary = courseData.category.title
    if (categoryTitleSummary.length > 15) {
      categoryTitleSummary = categoryTitleSummary.slice(0, 15)
      categoryTitleSummary += "..."
    }
  }

  const closeModal = e => {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    setModalOpen(prev => !prev)
  }
  return (
    <TableRow onClick={() => setModalOpen(true)}>
      <Td>
        {courseData.id}
        {
          modalOpen &&
          <EditCourseModal
            httpMethod="put"
            data={courseData}
            close={closeModal}
            update={setCourseData}
            submitUrl={`/masterclass/courses/${courseData.id}`}
            modalHeaderText={`Editing course ${courseData.title}`}
          />
        }
      </Td>
      <Td>{titleSummary || `(${courseData.id}) untitled course`}</Td>
      <Td>{courseData.modules.reduce((total, m) => total + m.lectures.length, 0)}</Td>
      <Td>{courseData.students.length}</Td>
      <Td>{formatDuration(courseData.duration || 0)}</Td>
      <Td>{categoryTitleSummary}</Td>
    </TableRow>
  )
}
