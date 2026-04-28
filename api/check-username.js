const admin = require('../lib/firebase-admin');

const db = admin.database();

module.exports = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: 'Username diperlukan' });
        const snapshot = await db.ref('users').orderByChild('usernameLower').equalTo(username.toLowerCase()).once('value');
        res.status(200).json({ exists: snapshot.exists() });
    } catch (err) {
        console.error('check-username error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
