const admin = require('../lib/firebase-admin');

const db = admin.database();

module.exports = async (req, res) => {
    try {
        if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token diperlukan' });

        const idToken = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = await admin.auth().verifyIdToken(idToken);
        } catch (e) {
            return res.status(401).json({ error: 'Token tidak valid' });
        }

        const userSnapshot = await db.ref('users/' + decoded.uid).once('value');
        if (!userSnapshot.exists()) return res.status(404).json({ error: 'User tidak ditemukan' });

        const currentData = userSnapshot.val();
        const role = currentData.role || 'member';
        const updates = {};

        const { displayName, username, bio, checkmarkType, customCheckmarkUrl } = req.body;
        if (displayName) updates.displayName = displayName;
        if (username) {
            updates.username = username;
            updates.usernameLower = username.toLowerCase();
        }
        if (bio !== undefined) updates.bio = bio;
        if (role === 'owner') {
            if (checkmarkType) updates.checkmarkType = checkmarkType;
            if (customCheckmarkUrl !== undefined) updates.customCheckmarkUrl = customCheckmarkUrl;
        }

        if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Tidak ada data yang diupdate' });

        await db.ref('users/' + decoded.uid).update(updates);

        // Log aktivitas update profil
        await db.ref('activity_logs').push({
            uid: decoded.uid,
            username: currentData.username,
            action: 'update_profile',
            changes: Object.keys(updates).join(', '),
            timestamp: Date.now()
        });

        const updatedSnapshot = await db.ref('users/' + decoded.uid).once('value');
        const ud = updatedSnapshot.val();
        const userResponse = {
            uid: decoded.uid,
            displayName: ud.displayName,
            username: '@' + ud.username,
            email: ud.email,
            bio: ud.bio || '',
            role: ud.role || 'member',
            avatarUrl: ud.avatarUrl || '',
            checkmarkType: ud.checkmarkType || 'blue',
            customCheckmarkUrl: ud.customCheckmarkUrl || '',
            postsCount: ud.postsCount || 0,
            followersCount: ud.followersCount || 0,
            followingCount: ud.followingCount || 0
        };

        res.status(200).json({ user: userResponse });
    } catch (err) {
        console.error('update-profile error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
