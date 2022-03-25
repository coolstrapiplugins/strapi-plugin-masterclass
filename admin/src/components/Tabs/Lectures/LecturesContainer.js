import React, { useState, useEffect, useRef } from "react"
import styled from "styled-components"
import { Table, Thead, Tbody, Tr, Td, Th } from '@strapi/design-system/Table';
import {
  ModalLayout,
  ModalHeader,
  ModalFooter,
  ModalBody
} from '@strapi/design-system/ModalLayout';
import { Stack } from '@strapi/design-system/Stack';
import { Status } from '@strapi/design-system/Status';
import { Divider } from '@strapi/design-system/Divider';
import { Textarea } from '@strapi/design-system/Textarea';
import { Button } from '@strapi/design-system/Button';
import { Typography, TextButton } from '@strapi/design-system/Typography';
import { Box } from "@strapi/design-system/Box"
import { TextInput } from '@strapi/design-system/TextInput';
import { Select, Option } from '@strapi/design-system/Select';

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
          <Stack spacing={2}>
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

const TableRow = styled(Tr)`
  &:hover {
    cursor: pointer;
    background: #d3d3d3;
  }
`
const LectureRow = ({ data }) => {
  const [lectureData, setLectureData] = useState(data)
  const [modalOpen, setModalOpen] = useState(false)
  let titleSummary = lectureData.title
  if (lectureData.title && lectureData.title.length > 50) {
    titleSummary = lectureData.title.slice(0, 50)
    titleSummary += "..."
  }
  let courseTitleSummary = "null"
  if (lectureData.courses) {
    courseTitleSummary = lectureData.courses[0].title
    if (courseTitleSummary > 25) {
      courseTitleSummary = courseTitleSummary.slice(0, 25)
      courseTitleSummary += "..."
    }
    if (lectureData.courses.length > 1) {
      courseTitleSummary += ` and ${lectureData.courses.length-1} more`
    }
  }
  const closeModal = e => {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    setModalOpen(prev => !prev)
  }
  const handleUpdate = (newData) => {
    setLectureData(newData)
  }
  return (
    <TableRow onClick={() => setModalOpen(true)}>
      <Td>
        {data.id}
        {
          modalOpen &&
          <LectureModal
            data={lectureData}
            update={handleUpdate}
            close={closeModal}
          />
        }
      </Td>
      <Td>{titleSummary}</Td>
      <Td>{courseTitleSummary}</Td>
      <Td>{lectureData.video.duration}</Td>
    </TableRow>
  )
}

const LectureModal = ({data, close, update}) => {
  const [title, setTitle] = useState(data.title || `(${data.id}) untitled lecture`)

  const [file, setFile] = useState(null)
  const [filename, setFilename] = useState(data.video ? data.video.filename : "")
  const [duration, setDuration] = useState(data.video ? data.video.duration : "0")
  const [playbackID, setPlaybackID] = useState(data.video ? data.video.video_id : "")
  const [selectedVideo, setSelectedVideo] = useState(data.video)
  const [selectedCourses, setSelectedCourses] = useState(data.courses)

  const [availableVideos, setAvailableVideos] = useState(data.video ? [data.video] : null)
  const [availableCourses, setAvailableCourses] = useState(data.courses || null)
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadVideosError, setLoadVideosError] = useState("")
  const [loadCoursesError, setLoadCoursesError] = useState("")

  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)
  const inputFileRef = useRef()

  useEffect(() => {
    const fetchVideos = async () => {
      const url = `/masterclass/list-videos`
      setLoadingVideos(true)
      setLoadVideosError("")
      try {
        const { data: res } = await axios.get(url)
        // const filteredVideoList = res.videos.filter(v => v.id !== data.video.id)
        let filteredVideoList = res.videos
        if (data.video) {
          filteredVideoList = [
            data.video,
            ...res.videos.filter(v => v.id !== data.video.id)
          ]
        }
        setAvailableVideos(filteredVideoList)
      } catch(err) {
        console.log(err)
        setLoadVideosError("Could not fetch available videos")
      } finally {
        setLoadingVideos(false)
      }
    }

    const fetchCourses = async () => {
      const url = `/masterclass/list-courses`
      setLoadingCourses(true)
      setLoadCoursesError("")
      try {
        const { data: res } = await axios.get(url)
        const filteredCoursesList = res.courses.filter(({id}) => {
          const lectureInCourse = data.courses.some(c => c.id === id)
          return !lectureInCourse
        })
        setAvailableCourses([...data.courses, ...filteredCoursesList])
      } catch(err) {
        console.log(err)
        setLoadCoursesError("Could not fetch available courses")
      } finally {
        setLoadingCourses(false)
      }
    }
    fetchCourses()
    fetchVideos()
  }, [data])

  const handleChangeVideo = (videoID) => {
    if (!availableVideos || !availableVideos.length > 0) {
      return
    }
    const video = availableVideos.find(v => v.id === videoID)
    if (!video) {
      console.log("Video " + videoID + " not found in availableVideos")
      return
    }
    setFilename(video.filename || `(${video.id}) untitled video`)
    setDuration(video.duration)
    setPlaybackID(video.video_id)
    setSelectedVideo(video)
    setFile(null)
    inputFileRef.current.value = ""
  }

  const handleChangeCourses = (coursesIDs) => {
    if (!availableCourses || !availableCourses.length > 0) {
      return
    }
    if (!coursesIDs || !coursesIDs.length) {
      setSelectedCourses([])
      return
    }
    const courses = availableCourses.filter(c => coursesIDs.includes(c.id))
    if (!courses || !(courses.length > 0)) {
      console.log("Courses " + coursesIDs + " were not found in availableCourses")
      return
    }
    setSelectedCourses(courses)
  }

  const handleChangeVideoFile = (e) => {
    const newAttachment = e.target.files[0]
    setFilename(newAttachment.name)
    setDuration("")
    setPlaybackID("")
    setFile(newAttachment)
  }

  const handleClearVideo = () => {
    setFilename("")
    setDuration("")
    setPlaybackID("")
    setSelectedVideo(null)
    setFile(null)
    inputFileRef.current.value = ""
  }

  const handleClearCourses = () => {
    setSelectedCourses([])
  }

  const handleSave = async () => {
    const url = `/masterclass/lectures/${data.id}`
    const formData = new FormData()
    if (file) {
      formData.append("video", file, file.name)
    }
    formData.append("data", JSON.stringify(
      {
        title,
        filename,
        playbackID: selectedVideo ? selectedVideo.video_id : ""
      }
    ))
    try {
      setSending(true)
      const { data } = await axios.put(url, formData)
      update(data.lecture)
      setStatus({msg: "Lecture updated correctly", variant: "success"})
    } catch(err) {
      console.log(err)
      setStatus({msg: "Could not update lecture", variant: "danger"})
    } finally {
      setSending(false)
    }
  }

  return (
    <ModalLayout labelledBy="title" onClose={close}>
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          {data.title}
        </Typography>
      </ModalHeader>
      <ModalBody>

        <Stack spacing={4}>

          <Stack spacing={2}>

            <Typography variant="beta">
              Lecture details:
            </Typography>

            <Typography>
              <Typography fontWeight="bold">
                Lecture ID: {" "}
              </Typography>
              {data.id}
            </Typography>

            <TextInput
              label="Lecture title"
              name="title"
              onChange={e => setTitle(e.target.value)}
              value={title}
              required={true}
            />

            <Typography>
              <Typography fontWeight="bold">
                Courses: {" "}
              </Typography>
              {
                (data.courses.lenght > 0) ?
                  data.courses.map((c, index) => {
                    let txt = c.title || `(${c.id}) untitled course`
                    if (index < data.courses.length -1) {
                      txt += ", "
                    }
                    return txt
                  })
                : "This lecture is not linked to any course"
              }
            </Typography>


            <Select
              id="courses-selection"
              label="Select Courses"
              placeholder="Choose oen or more courses"
              clearLabel="Unlink from all the courses"
              onClear={handleClearCourses}
              error={loadCoursesError}
              value={selectedCourses ? selectedCourses.map(c => c.id) : []}
              onChange={handleChangeCourses}

              customizeContent={values => `${values.length} currently selected`}
              multi
              withTags
            >
              {
                (availableCourses && availableCourses.length > 0) && (
                  availableCourses.map(c => {
                    return (
                      <Option value={c.id} key={c.slug}>
                        {c.title || `(${c.id}) untitled course`}
                      </Option>
                    )
                  })
                )
              }
            </Select>
          </Stack>


          <Stack spacing={2}>
            <Typography variant="beta">
              Video details:
            </Typography>

            <Select
              id="video-selection"
              label="Select video"
              placeholder="Choose video"
              clearLabel="Unlink this video"
              onClear={handleClearVideo}
              error={loadVideosError}
              value={selectedVideo?.id}
              onChange={handleChangeVideo}
            >
              {
                (availableVideos && availableVideos.length > 0) && (
                  availableVideos.map(v => {
                    return (
                      <Option value={v.id} key={v.video_id}>
                        {v.filename || `(${v.id}) untitled video`}
                      </Option>
                    )
                  })
                )
              }
            </Select>

            <TextInput
              label="Filename"
              name="filename"
              onChange={e => setFilename(e.target.value)}
              value={filename}
              required={true}
            />

            <TextInput
              label="Video playback ID"
              name="playback_id"
              value={playbackID}
              disabled
            />

            <TextInput
              label="Duration in seconds"
              name="duration"
              value={duration}
              disabled
            />

            <Stack spacing={0}>
              <Typography>
                {selectedVideo ? "Replace file" : "Attach video"}
              </Typography>
              <input
                type="file"
                ref={inputFileRef}
                onChange={handleChangeVideoFile}
                accept="video/avi, video/mpeg, video/webm, video/mp4, video/ogg"
              />
            </Stack>

          </Stack>
          <Box>
            <Button onClick={handleSave} loading={sending}>Save</Button>
          </Box>
        </Stack>
      </ModalBody>
      <ModalFooter
        startActions={
          <>
            {
              status && (
                <Status variant={status.variant}>
                  <Typography>
                    {status.msg}
                  </Typography>
                </Status>
              )
            }
          </>
        }
        endActions={<Button variant="secondary" onClick={close}>Close</Button>}
      />
    </ModalLayout>
  )
}
