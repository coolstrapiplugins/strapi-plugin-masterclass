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

const LecturesContainer = ({data}) => {
  const [lectures, setLectures] = useState(null)
  useEffect(() => {
    if (data && data.lectures && data.lectures.length) {
      const lecturesJSX = data.lectures.map((lecture) => {
        return <LectureRow data={lecture} key={lecture.id} />
      })
      setLectures(lecturesJSX)
    }
  }, [data])

  return (
    <Box>
      {
        (!data.lectures || !data.lectures.length) ?
          <Typography variant="beta">There are no lectures yet</Typography>
        : lectures && (
          <Stack size={2}>
            <Typography variant="beta">
            {data.lectures.length} {data.lectures.length>1? "lectures":"lecture"} found
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
                    <Typography fontWeight="bold">Course</Typography>
                  </Th>
                  <Th>
                    <Typography fontWeight="bold">Duration (s)</Typography>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {lectures}
              </Tbody>
            </Table>
          </Stack>
        )
      }
    </Box>
  )
}

export default LecturesContainer

const LectureRow = ({ data }) => {
  const [modalOpen, setModalOpen] = useState(false)
  let titleSummary = data.title
  if (data.title && data.title.length > 50) {
    titleSummary = data.title.slice(0, 50)
    titleSummary += "..."
  }
  let courseTitleSummary = "N/A"
  if (data.course) {
    courseTitleSummary = data.course.title
    if (courseTitleSummary > 25) {
      courseTitleSummary = courseTitleSummary.slice(0, 25)
      courseTitleSummary += "..."
    }
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
          <LectureModal
            data={data}
            close={closeModal}
          />
        }
      </Td>
      <Td>{titleSummary}</Td>
      <Td>{courseTitleSummary}</Td>
      <Td>{data.video.duration}</Td>
    </TableRow>
  )
}

const LectureModal = ({data, close}) => {
  return (
    <ModalLayout labelledBy="title" onClose={close}>
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          {data.title}
        </Typography>
      </ModalHeader>
      <ModalBody>
        <Stack size={2}>
          <Typography>
            <Typography fontWeight="bold">
              Lecture ID: {" "}
            </Typography>
            {data.id}
          </Typography>
          <Typography>
            <Typography fontWeight="bold">
              Title: {" "}
            </Typography>
            {data.title}
          </Typography>
          <Typography>
            <Typography fontWeight="bold">
              Course: {" "}
            </Typography>
            {data.course ? data.course.title : "This lecture is not linked to any course"}
          </Typography>
          <Typography>
            <Typography fontWeight="bold">
              Filename: {" "}
            </Typography>
            {data.video.filename}
          </Typography>
          <Typography>
            <Typography fontWeight="bold">
              Video ID: {" "}
            </Typography>
            {data.video.video_id}
          </Typography>
          <Typography>
            <Typography fontWeight="bold">
              Video duration: {" "}
            </Typography>
            {data.video.duration} seconds
          </Typography>
          <Typography>
            <Typography fontWeight="bold">
              Video URL: {" "}
            </Typography>
            {data.video.url}
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
