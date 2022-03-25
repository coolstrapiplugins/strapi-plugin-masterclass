/*
 *
 * View and create courses
 *
 */

import React, { memo, useState, useEffect } from 'react';
// import PropTypes from 'prop-types';
import { Box } from "@strapi/design-system/Box"
import { TextInput } from "@strapi/design-system/TextInput"
import { Textarea } from "@strapi/design-system/Textarea"
import { NumberInput } from "@strapi/design-system/NumberInput"
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
              <Typography variant="beta">Loading courses...</Typography>
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
          <CreateCourseModal addCourse={handleAddCourse} close={() => setModalOpen(false)} />
        )
      }
    </>
  );
};

export default memo(Courses);

const CreateCourseModal = ({addCourse, close}) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [slug, setSlug] = useState("")
  const [price, setPrice] = useState(29.99)
  const [long_description, setLongDescription] = useState("")
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)

  const handleTitle = e => {
    const newValue = e.target.value
    setTitle(newValue)
    setSlug(newValue.replaceAll(" ", "-").toLowerCase())
  }

  const handleSubmit = async () => {
    const url = "/masterclass/courses"
    try {
      setStatus(null)
      setSending(true)
      const { data } = await axios.post(url, {title, description, slug, price, long_description})
      addCourse(data.course)
      close()
    } catch(err) {
      setSending(false)
      console.log(err)
      setStatus({msg: "Could not create course. Please check console", variant: "danger"})
    }
  }
  return (
    <ModalLayout onClose={close} labelledBy="create-modal-title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="create-modal-title">
          Create course
        </Typography>
      </ModalHeader>
      <ModalBody>
        <Stack spacing={2}>
          <TextInput
            placeholder="Course title"
            label="Title"
            name="title"
            error={(title && title.length < 5) ? 'Title is too short' : undefined}
            onChange={handleTitle}
            value={title}
          />
          <TextInput
            placeholder="Course slug"
            label="Slug"
            name="slug"
            disabled
            value={slug}
          />
          <NumberInput
            label="Price"
            name="price"
            onValueChange={setPrice}
            value={price}
          />
          <Textarea
            placeholder="Describe your course in few lines"
            hint="Describe your course in few lines"
            label="Description"
            name="description"
            error={(description && description.length < 5) ? 'Content is too short' : undefined}
            onChange={e => setDescription(e.target.value)}
          >{description}</Textarea>
          <Textarea
            placeholder="Elaborate more on what this course offers"
            hint="Elaborate more on what this course offers"
            label="Long description"
            name="long_description"
            error={(long_description && long_description.length < 5) ? 'Content is too short' : undefined}
            onChange={e => setLongDescription(e.target.value)}
          >{long_description}</Textarea>
          <Box>
            <Button loading={sending} onClick={handleSubmit}>Create</Button>
          </Box>
          {
            status &&
            <Status variant={status.variant}>
              <Typography>{status.msg}</Typography>
            </Status>
          }
        </Stack>
      </ModalBody>
      <ModalFooter
        startActions={<></>}
        endActions={<Button variant="secondary" onClick={close}>Back</Button>}
      />
    </ModalLayout>
  )
}

