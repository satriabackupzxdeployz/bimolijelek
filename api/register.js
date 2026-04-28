const admin = require('../lib/firebase-admin');
const bcrypt = require('bcryptjs');

const db = admin.database();

module.exports = async (req, res) => {
    try {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const { username, email, password, birthdate } = req.body;
        if (!username || !email || !password || !birthdate) {
            return res.status(400).json({ error: 'Semua field harus diisi' });
        }

        const usernameLower = username.toLowerCase();
        const snapshot = await db.ref('users').orderByChild('usernameLower').equalTo(usernameLower).once('value');
        if (snapshot.exists()) {
            return res.status(409).json({ error: 'Username sudah dipakai' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRef = db.ref('users').push();
        const uid = userRef.key;

        const userData = {
            username,
            usernameLower,
            email,
            password: hashedPassword,
            birthdate,
            displayName: username,
            bio: '',
            role: 'member',
            avatarUrl: '',
            bannerUrl: '',
            checkmarkType: 'blue',
            customCheckmarkUrl: '',
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            createdAt: Date.now()
        };

        await userRef.set(userData);

        // Log aktivitas registrasi
        await db.ref('activity_logs').push({
            uid,
            username,
            action: 'register',
            timestamp: Date.now()
        });

        const customToken = await admin.auth().createCustomToken(uid, { role: 'member' });

        const userResponse = {
            uid,
            displayName: username,
            username: '@' + username,
            email,
            bio: '',
            role: 'member',
            avatarUrl: '',
            checkmarkType: 'blue',
            customCheckmarkUrl: '',
            postsCount: 0,
            followersCount: 0,
            followingCount: 0
        };

        res.status(201).json({ customToken, user: userResponse });
    } catch (err) {
        console.error('register error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
