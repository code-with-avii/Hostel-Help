import Complaint from '../models/Complaint.js';
import { getUserFromReq } from '../middlewares/auth.js';
import Student from '../models/Student.js';

export async function listComplaints(req, res) {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;

    const user = getUserFromReq(req);
    const isAdmin = ((user.email || '') === (process.env.admin_email || '').toLowerCase());
    const projection = isAdmin ? {} : { contactNumber: 0 };

    const complaints = await Complaint.find(filter, projection).sort({ submittedDate: -1 });
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
}

export async function adminListComplaints(req, res) {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    const complaints = await Complaint.find(filter).sort({ submittedDate: -1 });
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching admin complaints:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
}

export async function getComplaintById(req, res) {
  try {
    const user = getUserFromReq(req);
    const isAdmin = ((user.email || '') === (process.env.admin_email || '').toLowerCase());
    const projection = isAdmin ? {} : { contactNumber: 0 };

    const complaint = await Complaint.findById(req.params.id).select(projection);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
}

export async function createComplaint(req, res) {
  try {
    const user = getUserFromReq(req);
    if ((user.email || '') === (process.env.admin_email || '').toLowerCase()) {
      return res.status(403).json({ error: 'Admins cannot create complaints. Admins can only manage existing complaints.' });
    }

    const { studentName, roomNumber, category, priority, description, contactNumber } = req.body || {};
    const errors = [];
    if (!studentName || typeof studentName !== 'string' || !studentName.trim()) errors.push('studentName is required');
    if (!roomNumber || typeof roomNumber !== 'string' || !roomNumber.trim()) errors.push('roomNumber is required');
    const allowedCategories = ['electrical','plumbing','wifi','cleaning','security','noise','furniture','other'];
    if (!category || !allowedCategories.includes(String(category))) errors.push('category is invalid');
    const allowedPriorities = ['low','medium','high','urgent'];
    if (!priority || !allowedPriorities.includes(String(priority))) errors.push('priority is invalid');
    if (!description || typeof description !== 'string' || !description.trim()) errors.push('description is required');
    if (!contactNumber || typeof contactNumber !== 'string' || !contactNumber.trim()) errors.push('contactNumber is required');

    if (errors.length) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    // Validate student name and room against students collection
    try {
      const trimmedName = String(studentName).trim();
      const trimmedRoom = String(roomNumber).trim();

      // Helper to normalize full name
      const normalize = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
      const providedFullName = normalize(trimmedName);

      let studentRec = null;
      // Prefer lookup by authenticated email
      if (user && user.email) {
        studentRec = await Student.findOne({ email: (user.email || '').toLowerCase() });
      }
      // Fallback: try by name + room
      if (!studentRec) {
        const parts = trimmedName.trim().split(/\s+/);
        const first = parts.shift() || '';
        const last = parts.join(' ') || '';
        const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const firstRe = new RegExp('^' + esc(first) + '$', 'i');
        const lastRe = new RegExp('^' + esc(last) + '$', 'i');
        studentRec = await Student.findOne({
          room: trimmedRoom,
          ...(first ? { firstName: firstRe } : {}),
          ...(last ? { lastName: lastRe } : {}),
        });
      }

      if (!studentRec) {
        return res.status(403).json({ error: 'Student record not found for provided name/room' });
      }

      // Verify room matches
      const recRoom = String(studentRec.room || '').trim().toLowerCase();
      if (recRoom !== trimmedRoom.trim().toLowerCase()) {
        return res.status(403).json({ error: 'Room number does not match student records' });
      }

      // Verify name matches (full name check, case/space-insensitive)
      const recFullName = normalize(`${studentRec.firstName || ''} ${studentRec.lastName || ''}`);
      if (recFullName && providedFullName && recFullName !== providedFullName) {
        return res.status(403).json({ error: 'Name does not match student records' });
      }
    } catch (vErr) {
      console.warn('Student validation failed:', vErr?.message);
      return res.status(403).json({ error: 'Failed student validation' });
    }

    const complaint = new Complaint({
      studentName: String(studentName).trim(),
      roomNumber: String(roomNumber).trim(),
      category,
      priority,
      description: String(description).trim(),
      contactNumber: String(contactNumber).trim(),
      status: 'pending'
    });
    await complaint.save();
    res.status(201).json(complaint);
  } catch (error) {
    console.error('Error creating complaint:', error);
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error?.message || 'Failed to create complaint' });
  }
}

export async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
}

export async function resolveComplaint(req, res) {
  try {
    const { resolution } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedDate: new Date(),
        resolution,
      },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Error resolving complaint:', error);
    res.status(500).json({ error: 'Failed to resolve complaint' });
  }
}
