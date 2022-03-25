import React, { useState, useEffect } from "react"
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
import { Button } from '@strapi/design-system/Button';
import { Typography } from '@strapi/design-system/Typography';
import { Box } from "@strapi/design-system/Box"
import { TextInput } from "@strapi/design-system/TextInput"
import { Textarea } from "@strapi/design-system/Textarea"
import { NumberInput } from "@strapi/design-system/NumberInput"

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import axios from "../../../utils/axiosInstance"

const CourseModal = (props) => {
  const {data, close, update, httpMethod, submitUrl, modalHeaderText, closeAfterSubmit} = props


  // data could be null
  const [title, setTitle] = useState(data ? data.title : "")
  const [description, setDescription] = useState(data ? data.description : "")
  const [slug, setSlug] = useState(data ? data.slug : "")
  const [price, setPrice] = useState(data ? data.price || 29.99 : 29.99) // data.price could be null
  const [long_description, setLongDescription] = useState(data ? data.long_description : "")

  const [selectedLectures, setSelectedLectures] = useState(data ? data.lectures : [])
  const [availableLectures, setAvailableLectures] = useState(data ? data.lectures : null)
  const [loadingLectures, setLoadingLectures] = useState(false)
  const [loadLecturesError, setLoadLecturesError] = useState("")

  const [selectedCategory, setSelectedCategory] = useState(data ? data.category : null)
  const [availableCategories, setAvailableCategories] =
    useState(data ? data.category ? [data.category] : null : null) // data.category could be null
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadCategoriesError, setLoadCategoriesError] = useState("")

  const [selectedFeatIn, setSelectedFeatIn] = useState(data ? data.featured_in : [])

  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    const fetchLectures = async () => {
      const url = `/masterclass/list-lectures`
      setLoadingLectures(true)
      setLoadLecturesError("")
      try {
        const { data: res } = await axios.get(url)
        let filteredLecturesList = res.lectures
        if (data && data.lectures && data.lectures.length > 0) {
          filteredLecturesList = res.lectures.filter(({id}) => {
            const lectureInCourse = data.lectures.some(c => c.id === id)
            return !lectureInCourse
          })
          filteredLecturesList = [
            ...data.lectures,
            ...filteredLecturesList
          ]
        }
        setAvailableLectures(filteredLecturesList)
      } catch(err) {
        console.log(err)
        setLoadLecturesError("Could not fetch available lectures")
      } finally {
        setLoadingLectures(false)
      }
    }
    const fetchCategories = async () => {
      const url = `/masterclass/list-categories`
      setLoadingCategories(true)
      setLoadCategoriesError("")
      try {
        const { data: res } = await axios.get(url)
        let filteredCategoriesList = res.categories
        if (data && data.category) {
          filteredCategoriesList = [
            data.category,
            ...res.categories.filter(c => c.id !== data.category.id)
          ]
        }
        setAvailableCategories(filteredCategoriesList)
      } catch(err) {
        console.log(err)
        setLoadCategoriesError("Could not fetch available categories")
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchLectures()
    fetchCategories()
  }, [data])

  const handleChangeTitle = e => {
    const newValue = e.target.value
    setTitle(newValue)
    setSlug(newValue.replaceAll(" ", "-").toLowerCase())
  }

  const handleClearLectures = () => {
    setSelectedLectures([])
  }

  const handleChangeLectures = (lecturesIDs) => {
    if (!availableLectures || !availableLectures.length > 0) {
      return
    }
    if (!lecturesIDs || !lecturesIDs.length) {
      setSelectedLectures([])
      return
    }
    const lectures = availableLectures.filter(c => lecturesIDs.includes(c.id))
    if (!lectures || !(lectures.length > 0)) {
      console.log("Lectures " + lecturesIDs + " were not found in availableLectures")
      return
    }
    setSelectedLectures(lectures)
  }

  const handleChangeFeatIn = (categoriesIDs) => {
    if (!availableCategories || !availableCategories.length > 0) {
      return
    }
    if (!categoriesIDs || !categoriesIDs.length) {
      setSelectedCategories([])
      return
    }
    const categories = availableCategories.filter(c => categoriesIDs.includes(c.id))
    if (!categories || !(categories.length > 0)) {
      console.log("Categories " + categoriesIDs + " were not found in availableCategories")
      return
    }
    setSelectedFeatIn(categories)
  }

  const handleClearFeatIn = () => {
    setSelectedFeatIn([])
  }

  const handleChangeCategory = (categoryID) => {
    if (!availableCategories || !availableCategories.length > 0) {
      return
    }
    const category = availableCategories.find(c => c.id === categoryID)
    if (!category) {
      console.log("Category " + categoryID + " not found in availableCategories")
      return
    }
    setSelectedCategory(category)
  }

  const handleClearCategory = () => {
    setSelectedCategory(null)
  }

  const handleSubmit = async () => {
    // const url = `/masterclass/courses/${data.id}`
    const payload = {
      slug,
      price,
      title,
      description,
      long_description,
      category: selectedCategory ? selectedCategory.id : null,
      featured_in: selectedFeatIn.map(c => c.id),
      lectures: selectedLectures.map(l => l.id)
    }
    try {
      setStatus(null)
      setSending(true)
      const { data: res } = await axios[httpMethod](submitUrl, payload)
      update(res.course)
      if (closeAfterSubmit) {
        close()
        return
      }
      setSending(false)
      setStatus({msg: "Course updated correctly", variant: "success"})
    } catch(err) {
      setSending(false)
      console.log(err)
      setStatus({msg: "Could not create/update course. Please check console", variant: "danger"})
    }
  }

  /*
    Drag & drop lectures to adjust the orders.
    See https://www.freecodecamp.org/news/how-to-add-drag-and-drop-in-react-with-react-beautiful-dnd/
  */
  const handleDragEnd = (result) => {
    if (!result.destination) {
      return
    }
    const items = Array.from(selectedLectures)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSelectedLectures(items)
  }

  return (
    <ModalLayout labelledBy="title" onClose={close}>
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          {modalHeaderText}
        </Typography>
      </ModalHeader>
      <ModalBody>
        <Box paddingBottom={11}>
        <Stack spacing={4}>

          <Stack spacing={2}>

            <Typography variant="beta">
              Course details:
            </Typography>

            <TextInput
              label="Course title"
              name="title"
              onChange={handleChangeTitle}
              value={title}
              required
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

            <Select
              id="category-selection"
              label="Select Category"
              placeholder="Choose Category"
              clearLabel="Unlink this category"
              onClear={handleClearCategory}
              error={loadCategoriesError}
              value={selectedCategory?.id}
              onChange={handleChangeCategory}
            >
              {
                loadingCategories ?
                  <Loader small>Loading categories</Loader>
                :
                  (availableCategories && availableCategories.length > 0) ? (
                    availableCategories.map(c => {
                      return (
                        <Option value={c.id} key={c.slug}>
                          {c.title || `(${c.id}) untitled category`}
                        </Option>
                      )
                    })
                  )
                  : (<Status variant="alternative">
                      <Typography>There are no categories</Typography>
                    </Status>)
              }
            </Select>

            <Select
              id="feat-in-selection"
              label="Featured in"
              hint="Select the categories where this course will be featured in"
              placeholder="Choose one or more categories"
              clearLabel="Unlink from all the categories"
              onClear={handleClearFeatIn}
              error={loadCategoriesError}
              value={selectedFeatIn ? selectedFeatIn.map(c => c.id) : []}
              onChange={handleChangeFeatIn}

              customizeContent={values => `${values.length} currently selected`}
              multi
              withTags
            >
              {
                loadingCategories ?
                  <Loader small>Loading categories</Loader>
                :
                  (availableCategories && availableCategories.length > 0) ? (
                    availableCategories.map(c => {
                      return (
                        <Option value={c.id} key={c.slug}>
                          {c.title || `(${c.id}) untitled category`}
                        </Option>
                      )
                    })
                  )
                  : (<Status variant="alternative">
                      <Typography>There are no categories</Typography>
                    </Status>)
              }
            </Select>

          </Stack>

          <Stack spacing={2}>

            <Typography variant="beta">
              Lectures details:
            </Typography>

            <Select
              id="lectures-selection"
              label="Select Lectures"
              placeholder="Choose the lectures this course will have"
              clearLabel="Unselect all the lectures"
              onClear={handleClearLectures}
              error={loadLecturesError}
              value={selectedLectures ? selectedLectures.map(l => l.id) : []}
              onChange={handleChangeLectures}

              customizeContent={values => `${values.length} currently selected`}
              multi
            >
              {
                (availableLectures && availableLectures.length > 0) && (
                  availableLectures.map(l => {
                    return (
                      <Option value={l.id} key={`${l.title}-${l.id}`}>
                        {l.title || `(${l.id}) untitled lecture`}
                      </Option>
                    )
                  })
                )
              }
            </Select>
            {/*
              Drag & drop lectures to adjust the orders.
              See https://www.freecodecamp.org/news/how-to-add-drag-and-drop-in-react-with-react-beautiful-dnd/
            */}
            {
              (selectedLectures && selectedLectures.length > 0) && (
                <>
                  <Typography>
                    Adjust the order of selected lectures
                  </Typography>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="lectures">
                    {(provided) => (
                      <Box {...provided.droppableProps} ref={provided.innerRef}>
                        {
                          selectedLectures.map((l, idx) => (
                            <Draggable
                              key={`${l.id}-${l.title}`}
                              draggableId={`${l.id}-${l.title}`}
                              index={idx}
                            >
                              {(provided) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}

                                  paddingBottom={1}
                                >
                                  <Box
                                  padding={4}
                                  background="secondary100"
                                  >
                                    {idx + 1}. {l.title || `(${l.id}) untitled lecture`}
                                  </Box>
                                </Box>
                              )}
                            </Draggable>
                          ))
                        }
                        {provided.placeholder}
                      </Box>
                    )}
                    </Droppable>
                  </DragDropContext>
                </>
              )
            }

          </Stack>
        </Stack>
        </Box>
      </ModalBody>
      <ModalFooter
        startActions={<>
          {
            status && (
              <Status variant={status.variant}>
                <Typography>{status.msg}</Typography>
              </Status>
            )
          }
        </>}
        endActions={<Button loading={sending} onClick={handleSubmit}>Submit</Button>}
      />
    </ModalLayout>
  )
}

export default CourseModal
