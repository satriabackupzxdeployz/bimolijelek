const admin = require('../lib/firebase-admin');

const db = admin.database();

module.exports = async (req, res) => {
    try {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

        const { postId } = req.query;
        if (!postId) return res.status(400).json({ error: 'ID postingan diperlukan' });

        const snapshot = await db.ref('comments/' + postId).orderByChild('timestamp').once('value');
        const comments = [];
        snapshot.forEach(child => {
            comments.push({ id: child.key, ...child.val() });
        });

        res.status(200).json({ comments });
    } catch (err) {
        console.error('get-comments error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
