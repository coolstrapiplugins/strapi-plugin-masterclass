'use strict';

module.exports = {
  /*
  * index returns the tree of every category along with their description, featured courses
  * and amount of courses.
  * It is meant for populating information on some page that lists all the categories,
  * like the homepage.
  */
  async index(ctx) {
    const categories = await strapi.entityService.findMany("plugin::masterclass.mc-category", {
      filter: {
        parent_category: null
      },
      populate: {
        subcategories: {
          fields: ["slug", "title", "id"]
        },
        featured_courses: {
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
              fields: ["slug", "title"]
            }
          }
        }
      }
    })
    const rootCategories = categories.filter(c => !c.parent_category)
    const result = await Promise.all(rootCategories.map(async category => {
      let courses = await strapi.db.query("plugin::masterclass.mc-course").count({
        where: {
          category: { id: category.id }
        }
      })
      if (category.subcategories.length > 0) {
        await eachChild(category.subcategories, "subcategories", async (c) => {
          const category = await strapi.entityService.findOne("plugin::masterclass.mc-category", c.id, {
            populate: {
              subcategories: {
                fields: ["slug", "title", "id"]
              }
            }
          })
          const sc_courses = await strapi.db.query("plugin::masterclass.mc-course").count({
            where: {
              category: { id: c.id }
            }
          })
          courses += sc_courses
          return category
        })
      }
      category.courses = courses
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
      filter: {
        parent_category: null
      },
      populate: {
        subcategories: {
          fields: ["slug", "title", "id"]
        },
        courses: {
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
          select: ["slug", "title", "id"]
        },
        courses: {
          select: ["slug", "title", "id"]
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
              select: ["slug", "title", "id"]
            },
            courses: {
              select: ["slug", "title", "id"]
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
    const { slug } = ctx.params
    const category = await strapi.db.query("plugin::masterclass.mc-category").findOne({
      where: {
        slug
      },
      populate: {
        courses: {
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
              select: []
            },
            category: {
              select: ["slug", "title"]
            }
          }
        }
      }
    })
    return category
  }
}

const eachChild = async (children, childKey, cb) => {
  await Promise.all(children.map(async (child, i) => {
    const result = await cb(child)
    if (result[childKey] && result[childKey].length) {
      await eachChild(result[childKey], cb)
    }
    children[i] = result
  }))
}
