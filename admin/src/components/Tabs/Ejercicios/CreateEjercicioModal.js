/*
 *
 * Crear Ejercicios
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
import { TextInput } from '@strapi/design-system/TextInput';

import axios from '../../../utils/axiosInstance';

const CreateEjercicioModal = (props) => {
  const { close, addEjercicio } = props
  const [title, setTitle] = useState("")
  const [error, setError] = useState("")
  const [archivo, setArchivo] = useState(null)
  const [sending, setSending] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!archivo || !title) {
      return
    }
    setError("")
    setSending(true)
    const url = "/masterclass/ejercicios"
    const formData = new FormData();
    formData.append("archivo", archivo, archivo.name);
    formData.append("data", JSON.stringify({title}));
    try {
      const { data } = await axios.post(url, formData)
      addEjercicio(data.newEjercicio)
    } catch(err) {
      console.log(err)
      setError("No se pudo subir el ejercicio")
      setSending(false)
    }
  }
  return (
    <ModalLayout labelledBy="title" onClose={close}>
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          Crear ejercicio
        </Typography>
      </ModalHeader>
      <ModalBody>
        <Stack size={4}>
          <form onSubmit={handleSubmit}>
            <Stack size={2}>
              <TextInput
                label="Titulo"
                name="title"
                onChange={e => setTitle(e.target.value)}
                value={title}
                required
              />
              <input type="file" onChange={e => setArchivo(e.target.files[0])} />
              <Box>
                <Button
                  type="submit"
                  loading={sending || undefined}
                >Crear</Button>
              </Box>
            </Stack>
          </form>
          {
            error &&
            <Status variant="danger">
              <Typography>
                {error}
              </Typography>
            </Status>
          }
        </Stack>
      </ModalBody>
      <ModalFooter
        startActions={<></>}
        endActions={<Button onClick={close}>Close</Button>}
      />
    </ModalLayout>
  )
}

export default CreateEjercicioModal
