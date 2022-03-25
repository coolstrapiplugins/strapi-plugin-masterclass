'use strict';

module.exports = {
  async listCategories(ctx) {
    const categories = await strapi.entityService.findMany("plugin::masterclass.mc-category", {
      filters: {},
      fields: ["title", "slug"]
    })
    ctx.body = {
      categories
    }
  }
}