'use strict';

const courseQuery = {
  fields: [
    "id",
    "duration",
    "title",
    "description",
    "long_description",
    "price",
    "slug"
  ],
  populate: {
    thumbnail: {
      fields: ["name", "url"]
    },
    lectures: {
      fields: []
    },
    category: {
      fields: ["slug", "title", "id"]
    }
  }
}

const ejercicioQuery = {
  fields: [
    "id",
    "title",
    "description",
    "price",
    "slug"
  ],
  populate: {
    thumbnail: {
      fields: ["name", "url"]
    },
    category: {
      fields: ["slug", "title", "id"]
    }
  }
}

module.exports = {
  /*
  * index returns the tree of every category along with their description, featured courses
  * and amount of courses.
  * It is meant for populating information on some page that lists all the categories,
  * like the homepage.
  */
  async index(ctx) {
    const categories = await strapi.entityService.findMany("plugin::masterclass.mc-category", {
      filter: {},
      populate: {
        subcategories: {
          fields: ["slug", "title", "id"],
          populate: {
            courses: {
              fields: []
            }
          }
        },
        parent_category: {
          fields: ["id"]
        },
        thumbnail: {
          fields: ["name", "url"]
        },
        courses: { ...courseQuery, limit: 5 },
        featured_courses: courseQuery,
        ejercicios: { ...ejercicioQuery, limit: 5 },
        featured_ejercicios: ejercicioQuery
      }
    })
    const rootCategories = categories.filter(c => !c.parent_category)
    const result = await Promise.all(rootCategories.map(async category => {
      let courses_count = await strapi.db.query("plugin::masterclass.mc-course").count({
        where: {
          category: { id: category.id }
        }
      })
      let ejercicios_count = await strapi.db.query("plugin::masterclass.mc-ejercicio").count({
        where: {
          category: { id: category.id }
        }
      })
      category.courses = category.courses.filter(c => {
        return !category.featured_courses.some(f_c => f_c.id === c.id)
      })
      category.ejercicios = category.ejercicios.filter(e => {
        return !category.featured_ejercicios.some(f_e => f_e.id === e.id)
      })
      if (category.subcategories.length > 0) {
        await eachChild(category.subcategories, "subcategories", async (c) => {
          const category = await strapi.entityService.findOne("plugin::masterclass.mc-category", c.id, {
            populate: {
              subcategories: {
                fields: ["slug", "title", "id"]
              },
              courses: {
                fields: []
              },
              ejercicios: {
                fields: []
              }
            }
          })
          const sc_courses = await strapi.db.query("plugin::masterclass.mc-course").count({
            where: {
              category: { id: c.id }
            }
          })
          const sc_ejercicios = await strapi.db.query("plugin::masterclass.mc-ejercicio").count({
            where: {
              category: { id: c.id }
            }
          })
          courses_count += sc_courses
          ejercicios_count += sc_ejercicios
          return category
        })
      }
      category.courses_count = courses_count
      category.ejercicios_count = ejercicios_count
      category.featured_courses = await Promise.all(category.featured_courses.map(async c => {
        c.category.slug = await strapi.service("plugin::masterclass.courses").buildAbsoluteSlug(c)
        return c
      }))
      category.featured_ejercicios = await Promise.all(category.featured_ejercicios.map(async e => {
        e.category.slug = await strapi.service("plugin::masterclass.courses").buildAbsoluteSlug(e)
        return e
      }))
      return category
    }))
    return {
      categories: result
    }
  },
  /*
  * navigation returns the hierarchical tree of every category with only their id, title and slug.
  */
  async navigation(ctx) {
    const categories = await strapi.entityService.findMany("plugin::masterclass.mc-category", {
      fields: ["slug", "title", "id"],
      populate: {
        subcategories: {
          fields: ["slug", "title", "id"]
        },
        parent_category: {
          fields: ["id"]
        },
        courses: {
          fields: ["slug", "title", "id"]
        },
        ejercicios: {
          fields: ["slug", "title", "id"]
        }
      }
    })
    const rootCategories = categories.filter(c => !c.parent_category)
    const result = await Promise.all(rootCategories.map(async category => {
      if (category.subcategories.length > 0) {
        await eachChild(category.subcategories, "subcategories", async (c) => {
          const category = await strapi.entityService.findOne("plugin::masterclass.mc-category", c.id, {
            populate: {
              subcategories: {
                fields: ["slug", "title", "id"]
              },
              courses: {
                fields: ["slug", "title", "id"]
              },
              ejercicios: {
                fields: ["slug", "title", "id"]
              }
            }
          })
          return category
        })
      }
      return category
    }))
    return {
      categories: result
    }
  },
  /*
  * categoryTree returns the hierarchical tree of the category with the given slug,
  * with only their id, title and slug.
  */
  async categoryTree(ctx) {
    const { slug } = ctx.params
    const category = await strapi.db.query("plugin::masterclass.mc-category").findOne({
      where: { slug },
      select: ["slug", "title", "id"],
      populate: {
        subcategories: {
          fields: ["slug", "title", "id"]
        },
        courses: {
          fields: ["slug", "title", "id"]
        },
        ejercicios: {
          fields: ["slug", "title", "id"]
        }
      }
    })
    if (!category) {
      return ctx.notFound("Category with the given slug not found", {slug})
    }
    if (category.subcategories.length > 0) {
      await eachChild(category.subcategories, "subcategories", async (c) => {
        const category = await strapi.entityService.findOne("plugin::masterclass.mc-category", c.id, {
          populate: {
            subcategories: {
              fields: ["slug", "title", "id"]
            },
            courses: {
              fields: ["slug", "title", "id"]
            },
            ejercicios: {
              fields: ["slug", "title", "id"]
            }
          }
        })
        return category
      })
    }
    return {
      category
    }
  },
  async summary(ctx) {
    const courseQuery = {
      select: [
        "id",
        "duration",
        "title",
        "description",
        "long_description",
        "price",
        "slug"
      ],
      populate: {
        thumbnail: {
          select: ["name", "url"]
        },
        lectures: {
          select: ["id"]
        },
        category: {
          select: ["slug", "title", "id"]
        }
      }
    }
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
    const category = await strapi.db.query("plugin::masterclass.mc-category").findOne({
      where: {
        slug
      },
      populate: {
        subcategories: {
          select: ["slug", "title", "id"],
          populate: {
            courses: {
              select: []
            }
          }
        },
        thumbnail: {
          select: ["name", "url"]
        },
        featured_courses: courseQuery,
        courses: courseQuery,
        ejercicios: ejercicioQuery,
        featured_ejercicios: ejercicioQuery
      }
    })
    category.courses = category.courses.filter(c => {
      return !category.featured_courses.some(f_c => f_c.id === c.id)
    })
    category.ejercicios = category.ejercicios.filter(e => {
      return !category.featured_ejercicios.some(f_e => f_e.id === e.id)
    })
    category.courses = await Promise.all(category.courses.map(async c => {
      c.category.slug = await strapi.service('plugin::masterclass.courses').buildAbsoluteSlug(c)
      return c
    }))
    category.featured_courses = await Promise.all(category.featured_courses.map(async c => {
      c.category.slug = await strapi.service('plugin::masterclass.courses').buildAbsoluteSlug(c)
      return c
    }))
    category.ejercicios = await Promise.all(category.ejercicios.map(async e => {
      e.category.slug = await strapi.service('plugin::masterclass.courses').buildAbsoluteSlug(e)
      return e
    }))
    category.featured_ejercicios = await Promise.all(category.featured_ejercicios.map(async e => {
      e.category.slug = await strapi.service('plugin::masterclass.courses').buildAbsoluteSlug(e)
      return e
    }))

    let courses_count = await strapi.db.query("plugin::masterclass.mc-course").count({
      where: {
        category: { id: category.id }
      }
    })
    let ejercicios_count = await strapi.db.query("plugin::masterclass.mc-ejercicio").count({
      where: {
        category: { id: category.id }
      }
    })
    if (category.subcategories.length > 0) {
      await eachChild(category.subcategories, "subcategories", async (c) => {
        const subcategory = await strapi.entityService.findOne("plugin::masterclass.mc-category", c.id, {
          populate: {
            subcategories: {
              fields: ["slug", "title", "id"]
            },
            courses: {
              fields: []
            },
            ejercicios: {
              fields: []
            }
          }
        })
        const sc_courses = await strapi.db.query("plugin::masterclass.mc-course").count({
          where: {
            category: { id: c.id }
          }
        })
        const sc_ejercicios = await strapi.db.query("plugin::masterclass.mc-ejercicio").count({
          where: {
            category: { id: c.id }
          }
        })
        courses_count += sc_courses
        ejercicios_count += sc_ejercicios
        return subcategory
      })
    }

    category.courses_count = courses_count
    category.ejercicios_count = ejercicios_count

    return {
      category
    }
  }
}

const eachChild = async (children, childKey, cb) => {
  await Promise.all(children.map(async (child, i) => {
    const result = await cb(child)
    if (result[childKey] && result[childKey].length) {
      await eachChild(result[childKey], childKey, cb)
    }
    children[i] = result
  }))
}
