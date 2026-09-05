const contactService = require('../services/contactService');

/**
 * Submit contact form (public)
 * POST /api/contact
 */
const submitContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    // simple email validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    const result = await contactService.createMessage(name, email, message);
    res.status(201).json({ success: true, message: 'Message sent successfully', data: result });
  } catch (err) {
    console.error('Submit contact error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get all messages (admin only)
 * GET /api/admin/contact
 */
const getMessages = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await contactService.getAllMessages({
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    res.json(result);
  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Update message status (admin)
 * PUT /api/admin/contact/:id/status
 */
const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['unread', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const updated = await contactService.updateStatus(parseInt(id, 10), status);
    if (!updated) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ success: true, message: 'Status updated', data: updated });
  } catch (err) {
    console.error('Update status error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Delete a message (admin)
 * DELETE /api/admin/contact/:id
 */
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await contactService.deleteMessage(parseInt(id, 10));
    if (!deleted) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  submitContact,
  getMessages,
  updateMessageStatus,
  deleteMessage,
};