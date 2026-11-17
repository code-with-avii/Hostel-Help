import Complaint from '../models/Complaint.js';
import { getUserFromReq } from '../middlewares/auth.js';
import Student from '../models/Student.js';

export async function listComplaints(req, res) {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;

    const user = req.user || getUserFromReq(req);
    const isAdmin = user.role === 'admin';
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
    const user = req.user || getUserFromReq(req);
    const projection = user.role === 'admin' ? {} : { contactNumber: 0 };
    const complaint = await Complaint.findById(req.params.id).select(projection);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
}

export async function createComplaint(req, res) {
  try {
    const user = req.user || getUserFromReq(req);
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot create complaints.' });
    }

    const { studentName, roomNumber, category, priority, description, contactNumber } = req.body || {};
    const allowedCategories = ['electrical','plumbing','wifi','cleaning','security','noise','furniture','other'];
    const allowedPriorities = ['low','medium','high','urgent'];

    if (!studentName?.trim() || !roomNumber?.trim() || !description?.trim() || !contactNumber?.trim()) {
      return res.status(400).json({ error: 'Missing required complaint fields' });
    }
    if (!allowedCategories.includes(String(category))) return res.status(400).json({ error: 'Invalid category' });
    if (!allowedPriorities.includes(String(priority))) return res.status(400).json({ error: 'Invalid priority' });

    // Validate student record if present
    if (user.email) {
      const studentRec = await Student.findOne({ email: user.email });
      if (studentRec && studentRec.room && studentRec.room.toLowerCase() !== roomNumber.trim().toLowerCase()) {
        return res.status(403).json({ error: 'Room number does not match student records' });
      }
    }

    const complaint = await Complaint.create({
      userEmail: user.email || '',
      studentName: studentName.trim(),
      roomNumber: roomNumber.trim(),
      category,
      priority,
      description: description.trim(),
      contactNumber: contactNumber.trim(),
      status: 'pending'
    });

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(400).json({ error: error.message || 'Failed to create complaint' });
  }
}

export async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['pending', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
}

export async function resolveComplaint(req, res) {
  try {
    const { resolution } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolvedDate: new Date(), resolution: (resolution || '').trim() },
      { new: true, runValidators: true }
    );
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    console.error('Error resolving complaint:', error);
    res.status(500).json({ error: 'Failed to resolve complaint' });
  }
}

export async function deleteComplaint(req, res) {
  try {
    const user = req.user || getUserFromReq(req);
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    if (user.role !== 'admin' && complaint.userEmail && complaint.userEmail !== user.email) {
      return res.status(403).json({ error: 'Not authorized to delete this complaint' });
    }

    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
}
