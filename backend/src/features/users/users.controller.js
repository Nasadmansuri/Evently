const usersModel = require('./users.model');

async function getMe(req, res) {
  const profile = await usersModel.getProfile(req.user.id);
  res.json(profile);
}

async function getPendingFaculty(req, res) {
  try {
    const pending = await usersModel.getPendingFaculty();
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load pending faculty', error: err.message });
  }
}

async function updateApproval(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    const updated = await usersModel.setApprovalStatus(id, status);
    if (!updated) {
      return res.status(404).json({ message: 'Faculty account not found' });
    }
    res.json({ message: `Faculty ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update approval status', error: err.message });
  }
}

module.exports = { getMe, getPendingFaculty, updateApproval };