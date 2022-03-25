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

const EjerciciosContainer = ({data}) => {
  const [ejercicios, setEjercicios] = useState(null)
  useEffect(() => {
    if (data && data.ejercicios && data.ejercicios.length) {
      const ejerciciosJSX = data.ejercicios.map((ejercicio) => {
        return <EjercicioRow data={ejercicio} key={ejercicio.id} />
      })
      setEjercicios(ejerciciosJSX)
    }
  }, [data])

  return (
    <Box>
      {
        (!data.ejercicios || !data.ejercicios.length) ?
          <Typography variant="beta">Todavía no hay ejercicios</Typography>
        : ejercicios && (
          <Stack spacing={2}>
            <Typography variant="beta">
              {data.ejercicios.length} {data.ejercicios.length>1? "ejercicios":"ejercicio"}
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
                    <Typography fontWeight="bold">Filename</Typography>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {ejercicios}
              </Tbody>
            </Table>
          </Stack>
        )
      }
    </Box>
  )
}

export default EjerciciosContainer

const TableRow = styled(Tr)`
  &:hover {
    cursor: pointer;
    background: #d3d3d3;
  }
`
const EjercicioRow = ({ data }) => {
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
          <EjercicioModal
            data={data}
            close={closeModal}
          />
        }
      </Td>
      <Td>{titleSummary}</Td>
      <Td>{data.solucion.filename}</Td>
    </TableRow>
  )
}

const EjercicioModal = ({data, close}) => {
  return (
    <ModalLayout labelledBy="title" onClose={close}>
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          {data.title}
        </Typography>
      </ModalHeader>
      <ModalBody>
        <Stack spacing={2}>
          <Typography>
            <Typography fontWeight="bold">
              ID Ejercicio: {" "}
            </Typography>
            {data.id}
          </Typography>
          <Typography>
            <Typography fontWeight="bold">
              Titulo: {" "}
            </Typography>
            {data.title}
          </Typography>
          <Typography>
            <Typography fontWeight="bold">
              Filename: {" "}
            </Typography>
            {data.solucion.filename}
          </Typography>
          <Typography>
            <Typography fontWeight="bold">
              ID Solucion: {" "}
            </Typography>
            {data.solucion.id}
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
