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
  }
}
