const admin = require('../lib/firebase-admin');

const db = admin.database();

module.exports = async (req, res) => {
    try {
        if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token diperlukan' });

        const idToken = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = await admin.auth().verifyIdToken(idToken);
        } catch (e) {
            return res.status(401).json({ error: 'Token tidak valid' });
        }

        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'ID postingan diperlukan' });

        const postSnapshot = await db.ref('posts/' + id).once('value');
        if (!postSnapshot.exists()) return res.status(404).json({ error: 'Postingan tidak ditemukan' });

        const postData = postSnapshot.val();
        const userSnapshot = await db.ref('users/' + decoded.uid).once('value');
        const userRole = userSnapshot.exists() ? (userSnapshot.val().role || 'member') : 'member';
        if (userRole !== 'owner' && postData.uid !== decoded.uid) {
            return res.status(403).json({ error: 'Anda tidak berhak menghapus postingan ini' });
        }

        await db.ref('posts/' + id).remove();
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('delete-post error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
