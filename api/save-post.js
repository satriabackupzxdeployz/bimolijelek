const admin = require('../lib/firebase-admin');

const db = admin.database();

module.exports = async (req, res) => {
    try {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token diperlukan' });

        const idToken = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = await admin.auth().verifyIdToken(idToken);
        } catch (e) {
            return res.status(401).json({ error: 'Token tidak valid' });
        }

        const { text, type } = req.body;
        if (!text && type === 'text') return res.status(400).json({ error: 'Teks postingan tidak boleh kosong' });

        const userSnapshot = await db.ref('users/' + decoded.uid).once('value');
        if (!userSnapshot.exists()) return res.status(404).json({ error: 'User tidak ditemukan' });

        const userData = userSnapshot.val();
        const postRef = db.ref('posts').push();
        const postData = {
            author: userData.displayName,
            handle: '@' + userData.username,
            uid: decoded.uid,
            text: text || '',
            type: type || 'text',
            timestamp: Date.now(),
            likes: 0,
            retweets: 0,
            avatar: userData.avatarUrl || '',
            checkmarkType: userData.checkmarkType || 'blue',
            customCheckmarkUrl: userData.customCheckmarkUrl || ''
        };

        await postRef.set(postData);
        await db.ref('users/' + decoded.uid + '/postsCount').set((userData.postsCount || 0) + 1);

        // Log aktivitas
        await db.ref('activity_logs').push({
            uid: decoded.uid,
            username: userData.username,
            action: 'create_post',
            postId: postRef.key,
            text: (text || '').substring(0, 100),
            type: type || 'text',
            timestamp: Date.now()
        });

        res.status(201).json({ id: postRef.key, ...postData });
    } catch (err) {
        console.error('save-post error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
