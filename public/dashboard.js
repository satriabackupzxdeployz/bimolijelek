let currentUser = null;
let posts = [];
let firebaseAuth = null;

const homePage = document.getElementById('homePage');
const postFeed = document.getElementById('postFeed');
const postInput = document.getElementById('postInput');
const postSubmit = document.getElementById('postSubmit');
const modalPostInput = document.getElementById('modalPostInput');
const modalPostSubmit = document.getElementById('modalPostSubmit');
const createModal = document.getElementById('createModal');
const closeModal = document.getElementById('closeModal');
const createContentMobile = document.getElementById('createContentMobile');
const createContentDesktop = document.getElementById('createContentDesktop');
const postButtonDesktop = document.getElementById('postButtonDesktop');
const logoHeader = document.getElementById('logoHeader');
const logoDesktop = document.getElementById('logoDesktop');
const profileIconTop = document.getElementById('profileIconTop');
const mainSearchInput = document.getElementById('mainSearchInput');
const searchResults = document.getElementById('searchResults');
const chatSearchInput = document.getElementById('chatSearchInput');
const chatSearchResults = document.getElementById('chatSearchResults');
const logoutBtn = document.getElementById('logoutBtn');
const notificationBtn = document.getElementById('notificationBtn');
const settingsBtn = document.getElementById('settingsBtn');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const notificationsList = document.getElementById('notificationsList');
const mediaPreview = document.getElementById('mediaPreview');
const pollForm = document.getElementById('pollForm');
const eventForm = document.getElementById('eventForm');
const mediaUploadBtn = document.getElementById('mediaUploadBtn');
const mediaUploadInput = document.getElementById('mediaUploadInput');
const pollQuestion = document.getElementById('pollQuestion');
const pollOptions = document.getElementById('pollOptions');
const addPollOption = document.getElementById('addPollOption');
const pollDuration = document.getElementById('pollDuration');
const eventTitle = document.getElementById('eventTitle');
const eventDate = document.getElementById('eventDate');
const eventLocation = document.getElementById('eventLocation');
const postTypeButtons = document.getElementById('postTypeButtons');
const profileBanner = document.getElementById('profileBanner');
const profileAvatarLarge = document.getElementById('profileAvatarLarge');
const profileNameDisplay = document.getElementById('profileNameDisplay');
const profileHandleDisplay = document.getElementById('profileHandleDisplay');
const profileBioDisplay = document.getElementById('profileBioDisplay');
const postCount = document.getElementById('postCount');
const followerCount = document.getElementById('followerCount');
const followingCount = document.getElementById('followingCount');
const currentUserAvatar = document.getElementById('currentUserAvatar');
const modalUserAvatar = document.getElementById('modalUserAvatar');
const sidebarAvatar = document.getElementById('sidebarAvatar');
const sidebarName = document.getElementById('sidebarName');
const sidebarHandle = document.getElementById('sidebarHandle');
const editAvatarBtn = document.getElementById('editAvatarBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const accountSettingsBtn = document.getElementById('accountSettingsBtn');
const privacySettingsBtn = document.getElementById('privacySettingsBtn');
const dangerZoneBtn = document.getElementById('dangerZoneBtn');
const editProfileModal = document.getElementById('editProfileModal');
const closeEditProfileModal = document.getElementById('closeEditProfileModal');
const cancelEditProfile = document.getElementById('cancelEditProfile');
const saveProfile = document.getElementById('saveProfile');
const editDisplayName = document.getElementById('editDisplayName');
const editUsername = document.getElementById('editUsername');
const editBio = document.getElementById('editBio');
const editRole = document.getElementById('editRole');
const avatarUpload = document.getElementById('avatarUpload');
const avatarUploadInput = document.getElementById('avatarUploadInput');
const bannerUpload = document.getElementById('bannerUpload');
const bannerUploadInput = document.getElementById('bannerUploadInput');
const checkmarkOptions = document.getElementById('checkmarkOptions');
const customCheckmarkUpload = document.getElementById('customCheckmarkUpload');
const privacyModal = document.getElementById('privacyModal');
const closePrivacyModal = document.getElementById('closePrivacyModal');
const cancelPrivacy = document.getElementById('cancelPrivacy');
const savePrivacy = document.getElementById('savePrivacy');
const privacyOptions = document.getElementById('privacyOptions');
const deleteAccountModal = document.getElementById('deleteAccountModal');
const closeDeleteModal = document.getElementById('closeDeleteModal');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');
const deleteConfirmation = document.getElementById('deleteConfirmation');
const profilePreviewModal = document.getElementById('profilePreviewModal');
const closeProfilePreviewModal = document.getElementById('closeProfilePreviewModal');
const profilePreviewContent = document.getElementById('profilePreviewContent');

let currentPostType = 'text';

// Ambil Firebase ID Token terbaru (auto-refresh jika hampir expired)
async function getIdToken() {
    if (firebaseAuth && firebaseAuth.currentUser) {
        return await firebaseAuth.currentUser.getIdToken();
    }
    // Fallback ke token di localStorage
    return localStorage.getItem('coders_token');
}

async function initFirebase() {
    try {
        const res = await fetch('/api/config');
        const config = await res.json();
        if (!firebase.apps.length) firebase.initializeApp(config);
        firebaseAuth = firebase.auth();
    } catch (e) {
        console.error('Gagal inisialisasi Firebase:', e);
    }
}

function checkAuth() {
    const userStr = localStorage.getItem('coders_user');
    const token = localStorage.getItem('coders_token');
    if (token && userStr) {
        try {
            currentUser = JSON.parse(userStr);
            updateProfileUI();
            loadPosts();
        } catch (e) {
            redirectToLogin();
        }
    } else {
        redirectToLogin();
    }
}

function redirectToLogin() {
    localStorage.removeItem('coders_token');
    localStorage.removeItem('coders_user');
    window.location.href = '/';
}

async function loadPosts() {
    try {
        const response = await fetch('/api/get-posts');
        if (response.ok) {
            const data = await response.json();
            posts = data.posts || [];
            renderAllPosts();
            currentUser.postsCount = posts.filter(p => p.uid === currentUser.uid).length;
            updateProfileCounts();
        }
    } catch (err) {
        console.error('Gagal memuat postingan');
    }
}

function renderAllPosts() {
    postFeed.innerHTML = '';
    posts.forEach(post => {
        const postElement = createPostElement(post);
        postFeed.appendChild(postElement);
    });
}

function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post';
    div.dataset.id = post.id;

    let mediaHTML = '';
    if (post.media && post.media.length > 0) {
        mediaHTML = `<div class="post-media"><img src="${post.media[0].url}" alt="Post media"></div>`;
    }

    let pollHTML = '';
    if (post.type === 'poll' && post.poll) {
        const totalVotes = post.poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
        pollHTML = `<div class="post-poll"><div class="poll-question-display">${post.poll.question}</div>`;
        post.poll.options.forEach((option) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes || 0) / totalVotes * 100) : 0;
            pollHTML += `<div class="poll-option-display"><div class="poll-option-fill" style="width: ${percentage}%"></div><div class="poll-option-bar"><div class="poll-option-text"><span>${option.text}</span><span class="poll-vote-count">${percentage}% (${option.votes || 0})</span></div></div></div>`;
        });
        pollHTML += `<div class="poll-total">${totalVotes} suara</div></div>`;
    }

    let eventHTML = '';
    if (post.type === 'event' && post.event) {
        eventHTML = `<div class="post-event"><div class="event-title">${post.event.title}</div><div class="event-date-display">${new Date(post.event.date).toLocaleString()}</div></div>`;
    }

    const showDelete = (currentUser.role === 'owner') || (post.uid === currentUser.uid);
    const deleteButton = showDelete ? `<button class="post-delete-btn" data-id="${post.id}"><i class="fas fa-trash"></i></button>` : '';

    div.innerHTML = `
        ${deleteButton}
        <div class="post-avatar" style="background-image: url('${post.avatar || ''}')">${!post.avatar ? post.author.charAt(0) : ''}</div>
        <div class="post-content">
            <div class="post-header">
                <div class="post-author-info">
                    <div class="post-author">${post.author} ${getCheckmarkBadge(post)}</div>
                    <div class="post-handle">${post.handle}</div>
                </div>
                <div class="post-time">${timeAgo(post.timestamp)}</div>
            </div>
            <div class="post-text">${post.text}</div>
            ${mediaHTML}
            ${pollHTML}
            ${eventHTML}
        </div>
    `;

    const deleteBtn = div.querySelector('.post-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Hapus postingan ini?')) {
                try {
                    const idToken = await getIdToken();
                    const res = await fetch(`/api/delete-post?id=${post.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + idToken }
                    });
                    if (res.ok) {
                        loadPosts();
                    } else {
                        const err = await res.json();
                        alert(err.error || 'Gagal menghapus');
                    }
                } catch (err) {
                    alert('Gagal menghapus postingan');
                }
            }
        });
    }

    return div;
}

function getCheckmarkBadge(post) {
    if (post.checkmarkType === 'blue') return '<i class="fas fa-check-circle blue-check-badge"></i>';
    if (post.checkmarkType === 'gold') return '<i class="fas fa-check-circle gold-check-badge"></i>';
    if (post.checkmarkType === 'custom' && post.customCheckmarkUrl) return `<img src="${post.customCheckmarkUrl}" style="width:16px;height:16px;border-radius:50%;margin-left:4px;">`;
    return '';
}

function timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
}

async function submitPost() {
    const text = postInput.value.trim();
    if (!text && currentPostType === 'text') return;
    const body = { text, type: currentPostType };
    try {
        const idToken = await getIdToken();
        const response = await fetch('/api/save-post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + idToken
            },
            body: JSON.stringify(body)
        });
        if (response.ok) {
            postInput.value = '';
            postSubmit.disabled = true;
            loadPosts();
        } else {
            const err = await response.json();
            alert(err.error || 'Gagal menyimpan postingan');
        }
    } catch (err) {
        alert('Gagal menyimpan postingan');
    }
}

postSubmit.addEventListener('click', submitPost);
postInput.addEventListener('input', () => {
    postSubmit.disabled = postInput.value.trim() === '';
});

function updateProfileUI() {
    if (!currentUser) return;
    const avatarUrl = currentUser.avatarUrl || '';
    const setAvatar = (el) => {
        el.style.backgroundImage = avatarUrl ? `url('${avatarUrl}')` : '';
        if (!avatarUrl) el.textContent = currentUser.displayName ? currentUser.displayName.charAt(0) : 'C';
    };
    setAvatar(profileIconTop);
    setAvatar(currentUserAvatar);
    setAvatar(sidebarAvatar);
    setAvatar(modalUserAvatar);
    setAvatar(profileAvatarLarge);
    const badgeHTML = getCheckmarkBadge({ checkmarkType: currentUser.checkmarkType || 'blue', customCheckmarkUrl: currentUser.customCheckmarkUrl });
    profileNameDisplay.innerHTML = `${currentUser.displayName} ${badgeHTML} ${currentUser.role === 'owner' ? '<span class="owner-badge">Owner</span>' : ''}`;
    profileHandleDisplay.textContent = currentUser.username;
    profileBioDisplay.textContent = currentUser.bio || '';
    sidebarName.innerHTML = `${currentUser.displayName} ${badgeHTML}`;
    sidebarHandle.textContent = currentUser.username;
}

function updateProfileCounts() {
    postCount.textContent = currentUser.postsCount || 0;
    followerCount.textContent = currentUser.followersCount || 0;
    followingCount.textContent = currentUser.followingCount || 0;
}

document.querySelectorAll('.nav-item, .nav-link').forEach(el => {
    el.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.getAttribute('data-page') + 'Page';
        showPage(page);
    });
});

logoHeader.addEventListener('click', (e) => { e.preventDefault(); showPage('homePage'); });
logoDesktop.addEventListener('click', (e) => { e.preventDefault(); showPage('homePage'); });
profileIconTop.addEventListener('click', () => showPage('profilePage'));
document.querySelector('.user-profile-side')?.addEventListener('click', () => showPage('profilePage'));

function showPage(pageId) {
    document.querySelectorAll('.main-content').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'profilePage') {
        updateProfileCounts();
    }
}

logoutBtn.addEventListener('click', async () => {
    if (firebaseAuth) await firebaseAuth.signOut();
    localStorage.removeItem('coders_token');
    localStorage.removeItem('coders_user');
    window.location.href = '/';
});

editProfileBtn.addEventListener('click', () => {
    if (!currentUser) return;
    editDisplayName.value = currentUser.displayName || '';
    editUsername.value = currentUser.username || '';
    editBio.value = currentUser.bio || '';
    editRole.value = currentUser.role || 'member';
    editRole.disabled = true;

    const options = document.querySelectorAll('.checkmark-option');
    if (currentUser.role !== 'owner') {
        options.forEach(opt => opt.classList.add('disabled-option'));
        options.forEach(opt => opt.style.pointerEvents = 'none');
        options.forEach(opt => opt.style.opacity = '0.5');
    } else {
        options.forEach(opt => opt.classList.remove('disabled-option'));
        options.forEach(opt => opt.style.pointerEvents = 'auto');
        options.forEach(opt => opt.style.opacity = '1');
    }

    document.querySelectorAll('.checkmark-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.type === currentUser.checkmarkType) opt.classList.add('selected');
    });

    editProfileModal.style.display = 'flex';
});

saveProfile.addEventListener('click', async () => {
    const updatedData = {
        displayName: editDisplayName.value.trim(),
        username: editUsername.value.trim(),
        bio: editBio.value.trim()
    };
    if (currentUser.role === 'owner') {
        const selectedCheckmark = document.querySelector('.checkmark-option.selected');
        if (selectedCheckmark) {
            updatedData.checkmarkType = selectedCheckmark.dataset.type;
        }
    }
    try {
        const idToken = await getIdToken();
        const response = await fetch('/api/update-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + idToken
            },
            body: JSON.stringify(updatedData)
        });
        if (response.ok) {
            const result = await response.json();
            currentUser = result.user;
            localStorage.setItem('coders_user', JSON.stringify(currentUser));
            updateProfileUI();
            editProfileModal.style.display = 'none';
            alert('Profil berhasil diperbarui');
        } else {
            const err = await response.json();
            alert(err.error || 'Gagal update profil');
        }
    } catch (err) {
        alert('Gagal update profil');
    }
});

closeEditProfileModal.addEventListener('click', () => editProfileModal.style.display = 'none');
cancelEditProfile.addEventListener('click', () => editProfileModal.style.display = 'none');

dangerZoneBtn.addEventListener('click', () => {
    deleteAccountModal.style.display = 'flex';
    deleteConfirmation.value = '';
    confirmDelete.disabled = true;
});

deleteConfirmation.addEventListener('input', () => {
    confirmDelete.disabled = deleteConfirmation.value !== 'DELETE';
});

confirmDelete.addEventListener('click', async () => {
    if (deleteConfirmation.value === 'DELETE') {
        if (confirm('Yakin hapus akun? Tindakan ini tidak dapat dibatalkan.')) {
            try {
                const idToken = await getIdToken();
                const res = await fetch('/api/delete-account', {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + idToken }
                });
                if (res.ok) {
                    alert('Akun berhasil dihapus');
                    if (firebaseAuth) await firebaseAuth.signOut();
                    localStorage.clear();
                    window.location.href = '/';
                } else {
                    const err = await res.json();
                    alert(err.error || 'Gagal menghapus akun');
                }
            } catch (err) {
                alert('Gagal menghapus akun');
            }
        }
    }
});

closeDeleteModal.addEventListener('click', () => deleteAccountModal.style.display = 'none');
cancelDelete.addEventListener('click', () => deleteAccountModal.style.display = 'none');

privacySettingsBtn.addEventListener('click', () => {
    privacyModal.style.display = 'flex';
});
savePrivacy.addEventListener('click', () => {
    const selected = document.querySelector('.privacy-option.selected');
    if (selected) {
        currentUser.privacy = selected.dataset.privacy;
        privacyModal.style.display = 'none';
    }
});
closePrivacyModal.addEventListener('click', () => privacyModal.style.display = 'none');
cancelPrivacy.addEventListener('click', () => privacyModal.style.display = 'none');

window.addEventListener('click', (e) => {
    if (e.target === createModal) createModal.style.display = 'none';
    if (e.target === editProfileModal) editProfileModal.style.display = 'none';
    if (e.target === privacyModal) privacyModal.style.display = 'none';
    if (e.target === deleteAccountModal) deleteAccountModal.style.display = 'none';
    if (e.target === profilePreviewModal) profilePreviewModal.style.display = 'none';
});

createContentMobile.addEventListener('click', () => { createModal.style.display = 'flex'; modalPostInput.focus(); });
createContentDesktop.addEventListener('click', () => { createModal.style.display = 'flex'; modalPostInput.focus(); });
postButtonDesktop.addEventListener('click', () => { createModal.style.display = 'flex'; modalPostInput.focus(); });
closeModal.addEventListener('click', () => { createModal.style.display = 'none'; });

modalPostSubmit.addEventListener('click', async () => {
    const text = modalPostInput.value.trim();
    if (!text) return;
    const body = { text, type: 'text' };
    try {
        const idToken = await getIdToken();
        const res = await fetch('/api/save-post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + idToken
            },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            modalPostInput.value = '';
            modalPostSubmit.disabled = true;
            createModal.style.display = 'none';
            loadPosts();
            showPage('homePage');
        } else {
            const err = await res.json();
            alert(err.error || 'Gagal posting');
        }
    } catch (err) {
        alert('Gagal posting');
    }
});

modalPostInput.addEventListener('input', () => {
    modalPostSubmit.disabled = modalPostInput.value.trim() === '';
});

async function start() {
    await initFirebase();
    checkAuth();
}

start();
