'use strict';
const axios = require("axios");
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
    async getPrice(params, populate) {
        const url =
        "https://query1.finance.yahoo.com/v10/finance/quoteSummary/" +
        params +
        "?modules=price";

      const yahooF = await axios
        .get(url)
        .then((res) => res.data)
        .catch((error) => error.message);

      let price = 0;
      if (typeof yahooF !== "string") {
        let y_price =
          yahooF.quoteSummary.result[0].price["regularMarketPrice"]["raw"];
        if (typeof y_price !== "undefined") {
          price = y_price;
        }
      }

      return price
    }
};