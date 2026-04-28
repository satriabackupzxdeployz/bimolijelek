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

        const { postId, text } = req.body;
        if (!postId) return res.status(400).json({ error: 'ID postingan diperlukan' });
        if (!text || !text.trim()) return res.status(400).json({ error: 'Teks komentar tidak boleh kosong' });

        const postSnapshot = await db.ref('posts/' + postId).once('value');
        if (!postSnapshot.exists()) return res.status(404).json({ error: 'Postingan tidak ditemukan' });

        const userSnapshot = await db.ref('users/' + decoded.uid).once('value');
        if (!userSnapshot.exists()) return res.status(404).json({ error: 'User tidak ditemukan' });
        const userData = userSnapshot.val();

        const commentRef = db.ref('comments/' + postId).push();
        const commentData = {
            postId,
            uid: decoded.uid,
            author: userData.displayName,
            handle: '@' + userData.username,
            avatar: userData.avatarUrl || '',
            checkmarkType: userData.checkmarkType || 'blue',
            customCheckmarkUrl: userData.customCheckmarkUrl || '',
            text: text.trim(),
            timestamp: Date.now()
        };

        await commentRef.set(commentData);

        // Increment comment count on post
        const postData = postSnapshot.val();
        await db.ref('posts/' + postId + '/commentsCount').set((postData.commentsCount || 0) + 1);

        // Log aktivitas
        await db.ref('activity_logs').push({
            uid: decoded.uid,
            username: userData.username,
            action: 'create_comment',
            postId,
            commentId: commentRef.key,
            text: text.trim().substring(0, 100),
            timestamp: Date.now()
        });

        res.status(201).json({ id: commentRef.key, ...commentData });
    } catch (err) {
        console.error('save-comment error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
