const admin = require('../lib/firebase-admin');
const bcrypt = require('bcryptjs');

const db = admin.database();

module.exports = async (req, res) => {
    try {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username dan password harus diisi' });

        const isEmail = username.includes('@');
        let snapshot;
        if (isEmail) {
            snapshot = await db.ref('users').orderByChild('email').equalTo(username).once('value');
        } else {
            snapshot = await db.ref('users').orderByChild('usernameLower').equalTo(username.toLowerCase()).once('value');
        }

        if (!snapshot.exists()) return res.status(401).json({ error: 'Username atau password salah' });

        let userData, uid;
        snapshot.forEach(child => {
            userData = child.val();
            uid = child.key;
        });

        const valid = await bcrypt.compare(password, userData.password);
        if (!valid) return res.status(401).json({ error: 'Username atau password salah' });

        const customToken = await admin.auth().createCustomToken(uid, {
            role: userData.role || 'member'
        });

        // Log aktivitas login
        await db.ref('activity_logs').push({
            uid,
            username: userData.username,
            action: 'login',
            timestamp: Date.now()
        });

        const userResponse = {
            uid,
            displayName: userData.displayName,
            username: '@' + userData.username,
            email: userData.email,
            bio: userData.bio || '',
            role: userData.role || 'member',
            avatarUrl: userData.avatarUrl || '',
            checkmarkType: userData.checkmarkType || 'blue',
            customCheckmarkUrl: userData.customCheckmarkUrl || '',
            postsCount: userData.postsCount || 0,
            followersCount: userData.followersCount || 0,
            followingCount: userData.followingCount || 0
        };

        res.status(200).json({ customToken, user: userResponse });
    } catch (err) {
        console.error('login error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
