"use strict";

const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  /**
   * Get a record.
   *
   * @return {Object}
   */
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const data = await strapi.services.portfolio.find({ author: user.id });

    if (!data) {
      return ctx.notFound();
    }

    const newData = data.map(async (portfolio) => {
      // This should be stored instead of being fetched every time
      // Yahoo API fetch should be a CRON
      const price = await strapi.services.yahoo.getPrice(portfolio.name);
      const oldPrice = portfolio.buy_price;
      const percentage = ((price - oldPrice) / oldPrice) * 100;
      const total = price * portfolio.amount;

      portfolio.price_now = price;
      portfolio.percentage = (Math.round(percentage * 100) / 100).toFixed(2);
      portfolio.total = (Math.round(total * 100) / 100).toFixed(2);

      return portfolio;
    });

    return Promise.all(newData).then((completed) => completed);
  },

  /**
   * Create a record.
   *
   * @return {Object}
   */
  async create(ctx) {
    let entity;
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      data.author = ctx.state.user.id;
      entity = await strapi.services.portfolio.create(data, { files });
    } else {
      ctx.request.body.author = ctx.state.user.id;
      entity = await strapi.services.portfolio.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.portfolio });
  },

  /**
   * Update a record.
   *
   * @return {Object}
   */
  async update(ctx) {
    const { id } = ctx.params;

    let entity;

    const [portfolio] = await strapi.services.portfolio.find({
      id: ctx.params.id,
      "author.id": ctx.state.user.id,
    });

    if (!portfolio) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.portfolio.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.portfolio.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.portfolio });
  },

  /**
   * Get a record.
   *
   * @return {Object}
   */
  async delete(ctx) {
    const { id } = ctx.params;

    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    return await strapi.services.portfolio.delete({ id: id });
  },
};
