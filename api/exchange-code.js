const handler = require('../backend/exchange-code');

module.exports = async (req, res) => {
  return handler(req, res);
};
