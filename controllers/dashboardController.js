import Complaint from '../models/Complaint.js';

export async function getStats(req, res) {
  try {
    const [totalComplaints, pendingComplaints, inProgressComplaints, resolvedComplaints] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'in-progress' }),
      Complaint.countDocuments({ status: 'resolved' })
    ]);

    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

    res.json({
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      resolutionRate,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
}
