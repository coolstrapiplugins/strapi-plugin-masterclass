'use strict';

const fs = require('fs');
const request = require('request-promise-native');

module.exports = {
  async find(ctx) {
    const ejercicios = await strapi.entityService
    .findMany("plugin::masterclass.mc-ejercicio",
      {
        filters: {},
        populate: {
          category: {
            select: ["title"]
          },
          solucion: {
            select: ["filename"]
          }
        }
      }
    )
    ctx.body = { ejercicios }
  },
  async create(ctx) {
    const { files, body } = ctx.request
    if (!files || !files.archivo) {
      return ctx.badRequest("There is no solution file")
    }
    const data = JSON.parse(body.data)
    if (!data || !data.title) {
      return ctx.badRequest("Title must be specified")
    }

    // Get AWS client
    const awsClient = await strapi.service('plugin::masterclass.upload').getAWSClient()
    const config = await strapi.service('plugin::masterclass.upload').getConfig()
    if (!awsClient) {
      return ctx.badRequest("Config is not valid", config)
    }

    const { archivo } = files
    const { title } = data
    const filename = archivo.name

    const fileContent = fs.readFileSync(archivo.path);

    // Setting up S3 upload parameters
    const params = {
      Bucket: config.aws_bucket,
      Key: filename,
      Body: fileContent,
      ContentType: archivo.type
    }

    // Save solucion to database
    const newSolucionData = {
      filename,
      state: {
        uploading: true,
        ready: false,
        error: null
      }
    }
    const newSolucion = await strapi.entityService.create("plugin::masterclass.mc-solucion",
      { data: newSolucionData }
    )
    // Then create ejercicio and link the solucion
    const newEjercicioData = {
      title,
      solucion: newSolucion.id
    }
    const newEjercicio = await strapi.entityService.create("plugin::masterclass.mc-ejercicio",
      { data: newEjercicioData }
    )

    ctx.body = {
      newEjercicio: {
        title,
        id: newEjercicio.id,
        solucion: newSolucion
      }
    }

    // Uploading files to the bucket
    awsClient.upload(params, (err, data) => {
      const newState = {
        uploading: false
      }
      let location = ""
      if (err) {
        console.log("Could not upload file for solucion " + newSolucion.id)
        newState.ready = false
        newState.error = err
      } else {
        newState.ready = true
        location = data.Location
      }
      strapi.entityService.update("plugin::masterclass.mc-solucion", newSolucion.id,
        { data: {state: newState, location} }
      )
    });
  }
}
