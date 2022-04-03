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
import { Box } from "@strapi/design-system/Box";
import { TextInput } from "@strapi/design-system/TextInput"
import { Textarea } from "@strapi/design-system/Textarea";
import { Flex } from '@strapi/design-system/Flex';
import { NumberInput } from "@strapi/design-system/NumberInput";
import { Accordion, AccordionToggle, AccordionContent, AccordionGroup } from '@strapi/design-system/Accordion';

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

  const [availableLectures, setAvailableLectures] = useState(() => {
    if (!data) {
      return null
    }
    return data.modules.reduce((lectures, module) => lectures.concat(module.lectures), [])
  })
  const [loadingLectures, setLoadingLectures] = useState(false)
  const [loadLecturesError, setLoadLecturesError] = useState("")

  const [selectedCategory, setSelectedCategory] = useState(data ? data.category : null)
  const [availableCategories, setAvailableCategories] =
    useState(data ? data.category ? [data.category] : null : null) // data.category could be null
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadCategoriesError, setLoadCategoriesError] = useState("")

  const [selectedModules, setSelectedModules] = useState(data ? data.modules : [])

  const [moduleTitleInput, setModuleTitleInput] = useState("")

  const [selectedFeatIn, setSelectedFeatIn] = useState(data ? data.featured_in : [])

  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)

  const [modulesExpanded, setModulesExpanded] = useState(false)

  useEffect(() => {
    const fetchLectures = async () => {
      const url = `/masterclass/list-lectures`
      setLoadingLectures(true)
      setLoadLecturesError("")
      try {
        const { data: res } = await axios.get(url)
        let filteredLecturesList = res.lectures
        if (availableLectures && availableLectures.length > 0) {
          filteredLecturesList = res.lectures.filter(({id}) => {
            const lectureInCourse = availableLectures.some(c => c.id === id)
            return !lectureInCourse
          })
          filteredLecturesList = [
            ...availableLectures,
            ...filteredLecturesList
          ]
        }
        // setAvailableLectures(filteredLecturesList)
        setAvailableLectures(res.lectures)
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
    const modules = JSON.parse(JSON.stringify(selectedModules))
    modules.forEach(m => {
      // Submit only the lectures ids
      m.lectures = m.lectures.map(l => l.id)
    })
    const payload = {
      slug,
      price,
      title,
      description,
      long_description,
      category: selectedCategory ? selectedCategory.id : null,
      featured_in: selectedFeatIn.map(c => c.id),
      modules
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
  *  Drag & drop lectures to adjust their order inside modules.
  */
  const handleLectureDragEnd = (midx, result) => {
    if (!result.destination) {
      return
    }
  }
  /**
  * Drag & drop modules to adjust their order.
  * See https://www.freecodecamp.org/news/how-to-add-drag-and-drop-in-react-with-react-beautiful-dnd/
  */
  const handleModuleDragEnd = (result) => {
    if (!result.destination) {
      return
    }
    if (result.type === "MODULES") {
      // reordering module
      const items = Array.from(selectedModules)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)

      setSelectedModules(items)
    } else {
      const midx = parseInt(result.type,10)
      // reordering lectures
      const modules = Array.from(selectedModules)
      const module = modules[midx]
      if (!module) {
        console.log("module",midx,"not found")
        return
      }

      if (!(module.lectures && module.lectures.length > 0)) {
        return
      }

      const items = Array.from(module.lectures)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)
      modules[midx].lectures = items

      setSelectedModules(modules)
    }
  }

  const handleClearModuleLectures = (midx) => {
    const modules = Array.from(selectedModules)

    if (!modules[midx]) {
      console.log("module",midx,"not found")
      return
    }

    modules[midx].lectures = []

    setSelectedModules(modules)
  }

  const handleChangeModuleLectures = (midx, lecturesIDs) => {
    if (!availableLectures || !availableLectures.length > 0) {
      return
    }
    let newModuleLectures
    if (!lecturesIDs || !lecturesIDs.length) {
      newModuleLectures = []
    } else {
      newModuleLectures = availableLectures.filter(c => lecturesIDs.includes(c.id))
      if (!newModuleLectures || !(newModuleLectures.length > 0)) {
        console.log("Lectures ",lecturesIDs," were not found in availableLectures")
        return
      }
    }
    const modules = Array.from(selectedModules)
    modules[midx].lectures = newModuleLectures

    setSelectedModules(modules)
  }

  const addModule = () => {
    if (!moduleTitleInput) {
      return
    }
    const newModule = {
      title: moduleTitleInput,
      lectures: []
    }
    setSelectedModules(selectedModules.concat(newModule))
    setModuleTitleInput("")
  }

  const deleteModule = midx => {
    if (!selectedModules || !selectedModules.length > 0) {
      return
    }
    const module = selectedModules[midx]
    const firstPart = selectedModules.slice(0,midx)
    const secondPart = selectedModules.slice(midx+1)
    setSelectedModules(firstPart.concat(secondPart))
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
              Modules details:
            </Typography>
            {
              selectedModules.map((m, midx) => {
                return (
                  <Flex
                    key={`module-${midx}`}
                    alignItems="flex-end"
                  >
                    <Select
                      id={`module-${midx}-lectures-selection`}
                      label={`${midx+1}. ${m.title || "("+m.id+")  untitled module"}`}
                      placeholder="Choose the lectures this module will have"
                      clearLabel="Unselect all the lectures"
                      onClear={() => handleClearModuleLectures(midx)}
                      error={loadLecturesError}
                      value={selectedModules[midx].lectures.map(l => l.id)}
                      onChange={ids => handleChangeModuleLectures(midx, ids)}

                      customizeContent={values => `${values.length} lectures selected`}
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
                    <Box paddingLeft={3}>
                      <Button
                        variant="danger"
                        onClick={() => deleteModule(midx)}
                      >Delete module</Button>
                    </Box>
                  </Flex>
                )
              })
            }

            {
              (selectedModules && selectedModules.length > 0) && (
                <DragDropContext onDragEnd={handleModuleDragEnd}>
                  <Droppable droppableId="modules" type="MODULES">
                  {(provided) => (
                    <>
                    <Box {...provided.droppableProps} ref={provided.innerRef}>
                      {
                        selectedModules.map((m, midx) => (
                          <Draggable
                            key={`adjust-module-${midx}-${m.title}`}
                            draggableId={`adjust-module-${midx}-${m.title}`}
                            index={midx}
                          >
                            {(provided) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                              <Accordion
                                paddingBottom={1}
                                expanded={modulesExpanded}
                                onToggle={() => setModulesExpanded(!modulesExpanded)}
                                id={`adjust-module-${midx}-${m.title}`}
                              >
                                <AccordionToggle
                                  title={
                                    `${midx+1}. ${m.title || "("+m.idx+") untitled module"}`
                                  }
                                  description={
                                    (m.lectures && m.lectures.length > 0) ?
                                    `${m.lectures.length} lecture${m.lectures.length>1?"s":""} - Adjust the lectures order for this module`
                                    : "0 lectures in this module"
                                  }
                                />
                                <AccordionContent>
                                  {/*
                                    Drag & drop lectures to adjust the orders.
                                    See https://www.freecodecamp.org/news/how-to-add-drag-and-drop-in-react-with-react-beautiful-dnd/
                                  */}
                                  {
                                    (m.lectures && m.lectures.length > 0) && (
                                      <Droppable
                                        droppableId={`module-${midx}-lectures`}
                                        type={midx}
                                      >
                                      {(provided) => (
                                        <Box {...provided.droppableProps} ref={provided.innerRef}>
                                          {
                                            m.lectures.map((l, idx) => (
                                              <Draggable
                                                key={`${l.id}-${l.title}-module-${midx}`}
                                                draggableId={`${l.id}-${l.title}-module-${midx}`}
                                                index={idx}
                                              >
                                                {(provided) => (
                                                  <Box
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}

                                                    paddingTop={1}
                                                  >
                                                    <Box
                                                      padding={4}
                                                      background="neutral200"
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
                                    )
                                  }
                                </AccordionContent>
                              </Accordion>
                              </Box>
                            )}
                          </Draggable>
                        ))
                      }
                      {provided.placeholder}
                    </Box>
                    </>
                  )}
                  </Droppable>
                </DragDropContext>
              )
            }


            <Box paddingTop={4}>
              <Flex alignItems="flex-end">
                <TextInput
                  label="Module title"
                  name="module-title"
                  onChange={e => setModuleTitleInput(e.target.value)}
                  value={moduleTitleInput}
                  required
                />
                <Box paddingLeft={3}>
                  <Button
                    onClick={addModule}
                  >Create module</Button>
                </Box>
              </Flex>
            </Box>

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
