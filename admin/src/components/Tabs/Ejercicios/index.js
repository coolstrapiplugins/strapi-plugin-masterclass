/*
 *
 * Ver y crear ejercicios
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
} from '@strapi/design-system/ModalLayout'

import axios from '../../../utils/axiosInstance'
import EjerciciosContainer from "./EjerciciosContainer"
import CreateEjercicioModal from "./CreateEjercicioModal"

const Courses = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("")
  const [openCreateModal, setOpenCreateModal] = useState(false)

  const addEjercicio = (newEjercicio) => {
    const ejercicios = data ? [...data.ejercicios] : []
    setData({ejercicios: [newEjercicio, ...ejercicios]})
    setOpenCreateModal(false)
  }

  useEffect(() => {
    const fetchEjercicios = async () => {
      const url = "/masterclass/ejercicios"
      try {
        const { data } = await axios.get(url)
        setData(data)
      } catch(err) {
        console.log(err)
        setData({ ejercicios: [] })
        setError("Could not load ejercicios")
      }
    }
    fetchEjercicios()
  }, [])

  return (
    <Stack spacing={4}>
      <Box background="neutral0" padding={4}>
        <Stack spacing={4}>
          <Box>
            <Button onClick={() => setOpenCreateModal(true)}>Nuevo ejercicio</Button>
          </Box>
          {
            !data ?
              <Typography variant="beta">Cargando ejercicios...</Typography>
            : <EjerciciosContainer data={data} />
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
      {
        openCreateModal &&
        <CreateEjercicioModal
          close={() => setOpenCreateModal(false)}
          addEjercicio={addEjercicio}
        />
      }
    </Stack>
  );
};

export default memo(Courses);
