const admin = require('../lib/firebase-admin');

const db = admin.database();

module.exports = async (req, res) => {
    try {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token diperlukan' });

        const idToken = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = await admin.auth().verifyIdToken(idToken);
        } catch (e) {
            return res.status(401).json({ error: 'Token tidak valid' });
        }

        // Hanya owner yang boleh lihat semua log
        const userSnapshot = await db.ref('users/' + decoded.uid).once('value');
        const userRole = userSnapshot.exists() ? (userSnapshot.val().role || 'member') : 'member';
        if (userRole !== 'owner') {
            return res.status(403).json({ error: 'Akses ditolak' });
        }

        const limit = parseInt(req.query.limit) || 100;
        const snapshot = await db.ref('activity_logs').orderByChild('timestamp').limitToLast(limit).once('value');
        const logs = [];
        snapshot.forEach(child => {
            logs.push({ id: child.key, ...child.val() });
        });
        logs.reverse();

        res.status(200).json({ logs });
    } catch (err) {
        console.error('activity-log error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
