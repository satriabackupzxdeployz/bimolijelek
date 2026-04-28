const admin = require('../lib/firebase-admin');

const db = admin.database();

module.exports = async (req, res) => {
    try {
        const snapshot = await db.ref('posts').orderByChild('timestamp').once('value');
        const posts = [];
        snapshot.forEach(child => {
            posts.push({ id: child.key, ...child.val() });
        });
        posts.reverse();
        res.status(200).json({ posts });
    } catch (err) {
        console.error('get-posts error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
