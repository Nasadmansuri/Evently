const usersModel = require('./users.model');

async function getMe(req, res) {
  try {
    const profile = await usersModel.getProfile(req.user.id);
    if (!profile) return res.status(404).json({ message: 'User not found' });
    const stats = await usersModel.getUserStats(req.user.id, profile.role);
    res.json({ ...profile, stats });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
}

async function updateMe(req, res) {
  try {
    const { phone } = req.body;
    if (phone && !/^9\d{9}$/.test(phone.trim())) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number (starting with 9)' });
    }
    const updated = await usersModel.updateProfile(req.user.id, req.body);
    const stats = await usersModel.getUserStats(req.user.id, updated.role);
    res.json({ user: { ...updated, stats }, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
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

async function getAllUsers(req, res) {
  try {
    const { role, search } = req.query;
    const users = await usersModel.getAllUsers({ role, search });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load users', error: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const deleted = await usersModel.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({
        message: 'This user has associated events, registrations, or feedback and cannot be deleted. Remove those first.',
      });
    }
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
}

module.exports = { getMe, updateMe, getPendingFaculty, updateApproval, getAllUsers, deleteUser };