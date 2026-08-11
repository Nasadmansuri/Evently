const usersModel = require('./users.model');

async function getMe(req, res) {
  const profile = await usersModel.getProfile(req.user.id);
  res.json(profile);
}

module.exports = { getMe };