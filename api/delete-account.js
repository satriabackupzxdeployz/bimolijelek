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

        const uid = decoded.uid;
        await db.ref('users/' + uid).remove();

        const postsSnapshot = await db.ref('posts').orderByChild('uid').equalTo(uid).once('value');
        const deletions = [];
        postsSnapshot.forEach(child => {
            deletions.push(db.ref('posts/' + child.key).remove());
        });
        await Promise.all(deletions);

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('delete-account error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
