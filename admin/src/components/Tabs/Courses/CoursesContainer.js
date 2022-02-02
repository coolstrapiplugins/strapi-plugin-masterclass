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

const TableRow = styled(Tr)`
  &:hover {
    cursor: pointer;
    background: #d3d3d3;
  }
`
const CourseRow = ({ data }) => {
  const [modalOpen, setModalOpen] = useState(false)
  let titleSummary = data.title
  if (data.title && data.title.length > 50) {
    titleSummary = data.title.slice(0, 50)
    titleSummary += "..."
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
  const [lecturesModalOpen, setLecturesModalOpen] = useState(false)
  return (
    <ModalLayout labelledBy="title" onClose={close}>
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          {data.title}
        </Typography>
      </ModalHeader>
      <ModalBody>
        <Stack size={2}>
          <Box>
            <Button onClick={() => setLecturesModalOpen(true)}>Add lectures</Button>
          </Box>
          <Typography variant="beta">
            {data.lectures.length} lectures
          </Typography>
          {
            (data.lectures.length > 0) &&
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
                    <Typography fontWeight="bold">Duration (s)</Typography>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {
                  data.lectures.map(l => {
                    let titleSummary = l.title
                    if (l.title && l.title.length > 50) {
                      titleSummary = l.title.slice(0, 50)
                      titleSummary += "..."
                    }
                    return (
                      <Tr key={l.id + l.title}>
                        <Td>{l.id}</Td>
                        <Td>{titleSummary}</Td>
                        <Td>{l.video.duration}</Td>
                      </Tr>
                    )
                  })
                }
              </Tbody>
            </Table>
          }
          <Typography variant="beta">
            {data.students.length} students
          </Typography>
        </Stack>
        {
          lecturesModalOpen && (
            <AddLecturesModal
              close={() => setLecturesModalOpen(false)}
              courseLectures={data.lectures}
              courseID={data.id}
            />
          )
        }
      </ModalBody>
      <ModalFooter
        startActions={<></>}
        endActions={<Button onClick={close}>Finish</Button>}
      />
    </ModalLayout>
  )
}

const AddLecturesModal = ({courseID, courseLectures, close}) => {
  const [lecturesChecked, setLecturesChecked] = useState([])
  const [lectures, setLectures] = useState(null)
  const [sending, setSending] = useState(false)
  useEffect(() => {
    const fetchLectures = async () => {
      const url = "/masterclass/lectures"
      try {
        const { data } = await axios.get(url)
        const filteredLectures = data.lectures.filter(l => {
          return !courseLectures.some(({id}) => id === l.id)
        })
        setLectures(filteredLectures)
      } catch(err) {
        console.log(err)
        setLectures([])
      }
    }
    fetchLectures()
  }, [])
  const handleSubmit = async (e) => {
    setSending(true)
    e.preventDefault()
    const url = `/masterclass/course/${courseID}/link-lectures`
    try {
        await axios.put(url, {lectures: lecturesChecked})
        close()
      } catch(err) {
        console.log(err)
        setSending(false)
      }
  }
  const toggleCheckAll = () => {
    const checkedAll = lectures ? (lectures.length === lecturesChecked.length) : false
    if (checkedAll) {
      setLecturesChecked([])
    } else {
      setLecturesChecked(lectures.map(l => l.id))
    }
  }
  return (
    <ModalLayout labelledBy="title" onClose={close}>
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          Add lecture to course {courseID}
        </Typography>
      </ModalHeader>
      <ModalBody>
        {
          lectures ?
            lectures.length ?
              <form onSubmit={handleSubmit}>
                <Table colCount={COL_COUNT} rowCount={ROW_COUNT}>
                  <Thead>
                    <Tr>
                      <Th>
                        <Checkbox
                          checked={lectures ? (lectures.length === lecturesChecked.length):false}
                          onChange={toggleCheckAll}
                        >ID</Checkbox>
                      </Th>
                      <Th>
                        <Typography fontWeight="bold">Title</Typography>
                      </Th>
                      <Th>
                        <Typography fontWeight="bold">Duration (s)</Typography>
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {
                      lectures.map(l => {                      
                        let titleSummary = l.title
                        if (l.title && l.title.length > 50) {
                          titleSummary = l.title.slice(0, 50)
                          titleSummary += "..."
                        }
                        const handleChange = (e) => {
                          if (lecturesChecked.includes(l.id)) {
                            // remove
                            setLecturesChecked(lecturesChecked.filter(id => id !== l.id))
                          } else {
                            // add
                            setLecturesChecked(lecturesChecked.concat(l.id))
                          }
                        }
                        return (
                          <Tr key={l.id + l.title}>
                            <Td>
                              <Checkbox
                                checked={lecturesChecked.includes(l.id)}
                                onChange={handleChange}
                              >
                                {l.id.toString()}
                              </Checkbox>
                            </Td>
                            <Td>{titleSummary}</Td>
                            <Td>{l.video.duration}</Td>
                          </Tr>
                        )
                      })
                    }
                  </Tbody>
                </Table>
                <Button
                  type="submit"
                  loading={sending ? true : undefined}
                >Submit</Button>
              </form>
            : (
              <Typography fontWeight="bold">
                There are no lectures to add to this course
              </Typography>
            )
          : (
            <Typography fontWeight="bold">
              Loading lectures. Please wait...
            </Typography>
          )
        }
      </ModalBody>
      <ModalFooter
        startActions={<></>}
        endActions={<Button onClick={close}>Finish</Button>}
      />
    </ModalLayout>
  )
}
