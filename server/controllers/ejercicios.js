'use strict';

module.exports = {
  async findOne(ctx) {
    const ejercicioQuery = {
      select: [
        "id",
        "title",
        "description",
        "price",
        "slug"
      ],
      populate: {
        thumbnail: {
          select: ["name", "url"]
        },
        category: {
          select: ["slug", "title", "id"]
        }
      }
    }
    const { slug } = ctx.params
    const ejercicio = await strapi.db.query("plugin::masterclass.mc-ejercicio").findOne({
      where: {
        slug
      },
      ...ejercicioQuery
    })

    if (ejercicio && ejercicio.category) {
      ejercicio.category.slug =
      await strapi.service("plugin::masterclass.courses").buildAbsoluteSlug(ejercicio)
    }

    return ejercicio
  },
  async getDownloadUrl(ctx) {
    const { user } = ctx.state
    if (!user) {
      return ctx.badRequest("There must be an user")
    }
    const { slug } = ctx.params
    const student = await strapi.db.query("plugin::masterclass.mc-student").findOne({
      where: {
        user: user.id
      },
      populate: {
        ejercicios: {
          select: ["slug"],
          populate: {
            solucion: {
              select: ["filename"]
            }
          }
        }
      }
    })
    const ejercicio = student ? student.ejercicios.find(e => e.slug === slug) : undefined
    if (!student || !ejercicio) {
      return ctx.badRequest("User has no access to this resource")
    }
    const awsClient = await strapi.service('plugin::masterclass.upload').getAWSClient()
    const config = await strapi.service('plugin::masterclass.upload').getConfig()
    if (!awsClient) {
      console.log("AWS config is not valid", config)
      return ctx.badRequest("Upload provider is not configured properly")
    }
    const signedUrl = await awsClient.getSignedUrl('getObject', {
      Bucket: config.aws_bucket,
      Key: ejercicio.solucion.filename,
      Expires: 60 * 5 // 5 minutes
    })
    ctx.body = {
      signedUrl
    }
  }
}
