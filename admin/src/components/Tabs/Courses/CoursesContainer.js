import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { Table, Thead, Tbody, Tr, Td, Th } from '@strapi/design-system/Table';
import {
  ModalLayout,
  ModalHeader,
  ModalFooter,
  ModalBody
} from '@strapi/design-system/ModalLayout';
import { Stack } from '@strapi/design-system/Stack';
import { Divider } from '@strapi/design-system/Divider';
import { Textarea } from '@strapi/design-system/Textarea';
import { Button } from '@strapi/design-system/Button';
import { Typography, TextButton } from '@strapi/design-system/Typography';
import { Box } from "@strapi/design-system/Box"

import axios from "../../../utils/axiosInstance"

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
          <Typography variant="beta">There are no courses yet</Typography>
        : courses && (
          <Stack size={2}>
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

const CourseRow = ({ data }) => {
  const [modalOpen, setModalOpen] = useState(false)
  let titleSummary = data.title
  if (data.title && data.title.length > 50) {
    titleSummary = data.title.slice(0, 50)
    titleSummary += "..."
  }
  const TableRow = styled(Tr)`
    &:hover {
      cursor: pointer;
      background: #d3d3d3;
    }
  `
  const closeModal = e => {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    setModalOpen(prev => !prev)
  }
  return (
    <TableRow onClick={() => setModalOpen(true)}>
      <Td>
        {data.id}
        {
          modalOpen &&
          <CourseModal
            data={data}
            close={closeModal}
          />
        }
      </Td>
      <Td>{titleSummary}</Td>
      <Td>{data.lectures.length}</Td>
      <Td>{data.students.length}</Td>
    </TableRow>
  )
}

const CourseModal = ({data, close}) => {
  return (
    <ModalLayout labelledBy="title" onClose={close}>
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          {data.title}
        </Typography>
      </ModalHeader>
      <ModalBody>
        <Stack size={2}>
          <Typography variant="beta">
            {data.lectures.length} lectures
          </Typography>
          <Typography variant="beta">
            {data.students.length} students
          </Typography>
        </Stack>
      </ModalBody>
      <ModalFooter
        startActions={<></>}
        endActions={<Button onClick={close}>Finish</Button>}
      />
    </ModalLayout>
  )
}
