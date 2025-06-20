// Primary Firebase Configuration
const primaryFirebaseConfig = {
    databaseURL: "https://free-fire-craftaland-default-rtdb.firebaseio.com"
};

// Secondary Firebase Configuration (for assets)
const secondaryFirebaseConfig = {
    databaseURL: "https://earn-world-c6fca-800063-default-rtdb.firebaseio.com",
    apiKey: "AIzaSyAx1dokGsKM9QdWO61Be-pmDyvbDoAkiIk",
    authDomain: "earn-world-c6fca-800063.firebaseapp.com",
    projectId: "earn-world-c6fca-800063",
    storageBucket: "earn-world-c6fca-800063.appspot.com",
    messagingSenderId: "656863499063",
    appId: "1:656863499063:web:a0795fd4eb81284f8ec0b2",
    measurementId: "G-BWS50VZNS1"
};

// Backup Firebase Configuration (if primary fails)
const backupFirebaseConfig = {
    apiKey: "AIzaSyCM_cDQOr-8no1gKQ1J9X-G09EHDbssN1s",
    authDomain: "free-fire-ke.firebaseapp.com",
    databaseURL: "https://free-fire-ke-default-rtdb.firebaseio.com",
    projectId: "free-fire-ke",
    storageBucket: "free-fire-ke.firebasestorage.app",
    messagingSenderId: "955379414280",
    appId: "1:955379414280:web:de946c9a445482cdb968bd"
};

// Initialize Firebase apps
const primaryApp = firebase.initializeApp(primaryFirebaseConfig, "primary");
const secondaryApp = firebase.initializeApp(secondaryFirebaseConfig, "secondary");
const backupApp = firebase.initializeApp(backupFirebaseConfig, "backup");

// Get database references
const primaryDatabase = firebase.database(primaryApp);
const secondaryDatabase = firebase.database(secondaryApp);
const backupDatabase = firebase.database(backupApp);

// ImgBB API keys (primary and backup)
const IMGBB_API_KEYS = [
    'ac36a174ebd65fec02ea7f14ed716a20', // Primary key
    '75c50f78e44ef8d7bf0d6d913c42c689'  // Backup key
];
let currentImgBBKeyIndex = 0;

const DEFAULT_THUMBNAIL = 'image.png';
const DEFAULT_PROFILE_PIC = 'profile.png';
const BASE_URL = window.location.href.split('?')[0];

// DOM elements
const searchHeader = document.getElementById('search-header');
const contentArea = document.getElementById('content-area');
const bottomNav = document.getElementById('bottom-nav');
const floatingUploadBtn = document.getElementById('floating-upload-btn');
const uploadFormModal = document.getElementById('upload-form-modal');
const assetsUploadFormModal = document.getElementById('assets-upload-form-modal');
const closeModal = document.querySelector('.close-modal');
const closeAssetsModal = document.querySelector('.close-assets-modal');
const submitBtn = document.getElementById('submit-btn');
const assetsSubmitBtn = document.getElementById('assets-submit-btn');
const submitLoader = document.getElementById('submit-loader');
const assetsSubmitLoader = document.getElementById('assets-submit-loader');
const thumbnailUpload = document.getElementById('thumbnail-upload');
const assetsThumbnailUpload = document.getElementById('assets-thumbnail-upload');
const thumbnailPreview = document.getElementById('thumbnail-preview');
const assetsThumbnailPreview = document.getElementById('assets-thumbnail-preview');
const homeBtn = document.getElementById('home-btn');
const assetsBtn = document.getElementById('assets-btn');
const profileBtn = document.getElementById('profile-btn');
const mapCardTemplate = document.getElementById('map-card-template');
const profilePageTemplate = document.getElementById('profile-page-template');
const mapDetailModal = document.getElementById('map-detail-modal');
const closeDetail = document.querySelector('.close-detail');
const togglePassword = document.getElementById('toggle-password');
const toggleRegPassword = document.getElementById('toggle-reg-password');
const passwordInput = document.getElementById('password');
const regPasswordInput = document.getElementById('reg-password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const confirmDeleteModal = document.getElementById('confirm-delete');
const confirmDeleteYes = document.getElementById('confirm-delete-yes');
const confirmDeleteNo = document.getElementById('confirm-delete-no');
const loginModal = document.getElementById('login-modal');
const closeLoginModal = document.querySelector('.close-login-modal');
const shareModal = document.getElementById('share-modal');
const shareLinkInput = document.getElementById('share-link-input');
const closeShare = document.querySelector('.close-share');
const codeInputsContainer = document.getElementById('code-inputs-container');
const assetsCodeInputsContainer = document.getElementById('assets-code-inputs-container');
const addCodeBtn = document.getElementById('add-code-btn');
const assetsAddCodeBtn = document.getElementById('assets-add-code-btn');
const codeInputTemplate = document.getElementById('code-input-template');
const mapCodeItemTemplate = document.getElementById('map-code-item-template');
const mapTagTemplate = document.getElementById('map-tag-template');
const detailCodesContainer = document.getElementById('detail-codes-container');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginContent = document.getElementById('login-content');
const registerContent = document.getElementById('register-content');

let currentUser = null;
let thumbnailFile = null;
let assetsThumbnailFile = null;
let mapToDelete = null;
let currentMapToShare = null;
let currentDatabase = 'primary'; // 'primary', 'assets', or 'backup'
let currentPage = 'home'; // 'home', 'assets', or 'profile'
let currentMapDetail = null;
let previousState = {
    scrollPosition: 0,
    searchTerm: '',
    page: 'home'
};
let isDirectMapLink = false; // Flag to track if we came from a direct map link
let isDirectProfileLink = false; // Flag to track if we came from a direct profile link

// Format timestamp to readable date
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function changeColor() {
    document.getElementById("buttonon").style.backgroundColor = "green";
}

// Initialize the app
function initApp() {
    // Check URL for map ID or profile parameter
    const urlParams = new URLSearchParams(window.location.search);
    const mapId = urlParams.get('map');
    const profileId = urlParams.get('profile');
    
    if (mapId) {
        isDirectMapLink = true;
        // If there's a map ID in the URL, show that map directly
        const dbRef = currentDatabase === 'primary' ? primaryDatabase : 
                     currentDatabase === 'assets' ? secondaryDatabase : backupDatabase;
        dbRef.ref('maps/' + mapId).once('value')
            .then(snapshot => {
                const mapData = snapshot.val();
                if (mapData) {
                    showMapDetail({ id: mapId, ...mapData });
                } else {
                    loadHomepage();
                }
            })
            .catch(() => {
                loadHomepage();
            });
    } else if (profileId) {
        isDirectProfileLink = true;
        viewUserProfile(profileId);
    } else {
        // Otherwise load the homepage normally
        const loggedInUser = localStorage.getItem('currentUser');
        if (loggedInUser) {
            currentUser = JSON.parse(loggedInUser);
        }
        
        // Add first code input by default
        addCodeInput(codeInputsContainer);
        addCodeInput(assetsCodeInputsContainer);
        
        loadHomepage();
    }
}

// Toggle sidebar
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Open external links
function openLink(url) {
    window.open(url, '_blank');
}

// Show toast notification
function showToast(message, duration = 3000, isAssets = false) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    
    if (isAssets) {
        toast.classList.add('assets-toast');
    } else {
        toast.classList.remove('assets-toast');
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Toggle password visibility
function togglePasswordVisibility(input, icon) {
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Shuffle array (for randomizing map display)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Upload image to ImgBB
async function uploadImageToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEYS[currentImgBBKeyIndex]}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            return data.data.url;
        } else {
            throw new Error('Image upload failed');
        }
    } catch (error) {
        console.error('Error uploading image with key', IMGBB_API_KEYS[currentImgBBKeyIndex], error);
        
        // Try the next API key if available
        if (currentImgBBKeyIndex < IMGBB_API_KEYS.length - 1) {
            currentImgBBKeyIndex++;
            console.log('Trying backup ImgBB API key:', IMGBB_API_KEYS[currentImgBBKeyIndex]);
            return uploadImageToImgBB(file);
        } else {
            throw error;
        }
    }
}

// Update floating button style based on current page
function updateFloatingButtonStyle() {
    if (currentPage === 'assets') {
        floatingUploadBtn.classList.add('assets-floating-btn');
        floatingUploadBtn.classList.remove('primary-floating-btn');
    } else {
        floatingUploadBtn.classList.add('primary-floating-btn');
        floatingUploadBtn.classList.remove('assets-floating-btn');
    }
}

// Update navigation buttons active state
function updateNavButtons() {
    // Remove active classes from all buttons
    homeBtn.classList.remove('active');
    assetsBtn.classList.remove('active');
    profileBtn.classList.remove('active');
    
    // Add active class to current page button
    if (currentPage === 'home') {
        homeBtn.classList.add('active');
    } else if (currentPage === 'assets') {
        assetsBtn.classList.add('active', 'assets-active');
    } else if (currentPage === 'profile') {
        profileBtn.classList.add('active');
    }
}

// Add a new code input field
function addCodeInput(container) {
    const codeInput = codeInputTemplate.content.cloneNode(true);
    container.appendChild(codeInput);
    
    // Limit to 4 inputs
    const inputs = container.querySelectorAll('.code-input-wrapper');
    if (inputs.length >= 4) {
        if (container === codeInputsContainer) {
            addCodeBtn.style.display = 'none';
        } else {
            assetsAddCodeBtn.style.display = 'none';
        }
    }
}

// Remove a code input field
function removeCodeInput(button) {
    const wrapper = button.closest('.code-input-wrapper');
    wrapper.remove();
    
    // Show add button if less than 4 inputs
    const container = wrapper.parentElement;
    const inputs = container.querySelectorAll('.code-input-wrapper');
    if (inputs.length < 4) {
        if (container === codeInputsContainer) {
            addCodeBtn.style.display = 'flex';
        } else {
            assetsAddCodeBtn.style.display = 'flex';
        }
    }
}

// Update input label when changed
function updateInputLabel(input) {
    // You can add validation or formatting here if needed
}

// User login function
function login(username, password) {
    primaryDatabase.ref('users').orderByChild('username').equalTo(username).once('value')
        .then(snapshot => {
            const users = snapshot.val();
            if (!users) {
                throw new Error('Username not found');
            }
            
            let userFound = null;
            for (const userId in users) {
                if (users[userId].password === password) {
                    userFound = {
                        uid: userId,
                        ...users[userId]
                    };
                    break;
                }
            }
            
            if (!userFound) {
                throw new Error('Incorrect password');
            }
            
            currentUser = userFound;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            loginError.textContent = '';
            showToast('Login successful!');
            loginModal.style.display = 'none';
            
            if (currentPage === 'assets') {
                assetsUploadFormModal.style.display = 'flex';
            } else {
                uploadFormModal.style.display = 'flex';
            }
        })
        .catch(error => {
            loginError.textContent = error.message;
        });
}

// User registration function
function register(username, password) {
    primaryDatabase.ref('usernames').once('value')
        .then(snapshot => {
            if (snapshot.hasChild(username)) {
                throw new Error('Username already exists');
            }
            
            const newUserRef = primaryDatabase.ref('users').push();
            const userId = newUserRef.key;
            
            return newUserRef.set({
                username: username,
                password: password,
                profilePic: DEFAULT_PROFILE_PIC,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                return primaryDatabase.ref('usernames/' + username).set(true);
            }).then(() => {
                return {
                    uid: userId,
                    username: username,
                    password: password,
                    profilePic: DEFAULT_PROFILE_PIC
                };
            });
        })
        .then((userData) => {
            showToast('Registration successful!');
            currentUser = userData;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            loginModal.style.display = 'none';
            
            if (currentPage === 'assets') {
                assetsUploadFormModal.style.display = 'flex';
            } else {
                uploadFormModal.style.display = 'flex';
            }
        })
        .catch(error => {
            registerError.textContent = error.message;
        });
}

// Load homepage with maps
function loadHomepage() {
    currentPage = 'home';
    updateNavButtons();
    updateFloatingButtonStyle();
    
    contentArea.innerHTML = '<div class="loading">Loading maps...</div>';
    
    primaryDatabase.ref('maps').once('value')
        .then(snapshot => {
            const maps = snapshot.val();
            contentArea.innerHTML = '';
            
            if (maps) {
                let mapsArray = Object.entries(maps).map(([id, map]) => ({ id, ...map }));
                mapsArray = shuffleArray(mapsArray);
                
                mapsArray.forEach(mapData => {
                    const card = mapCardTemplate.content.cloneNode(true);
                    card.querySelector('.map-thumbnail').src = mapData.thumbnail || DEFAULT_THUMBNAIL;
                    card.querySelector('.map-title').textContent = mapData.title;
                    card.querySelector('.views-count').textContent = mapData.views || 0;
                    
                    // Show the first code in the card (but hidden by default)
                    const firstCode = mapData.codes && mapData.codes.length > 0 ? mapData.codes[0].code : 'Click Thumbnail';
                    card.querySelector('.map-code').textContent = firstCode;
                    
                    const deleteBtn = card.querySelector('.delete-btn');
                    if (currentUser && mapData.uploaderId === currentUser.uid) {
                        deleteBtn.style.display = 'flex';
                        deleteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            showDeleteConfirmation(mapData, 'primary');
                        });
                    } else {
                        deleteBtn.style.display = 'none';
                    }
                    
                    const copyButton = card.querySelector('.copy-btn');
                    copyButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const codeToCopy = card.querySelector('.map-code').textContent;
                        navigator.clipboard.writeText(codeToCopy);
                        showToast(`Map code "${codeToCopy}" copied!`);
                    });
                    
                    const shareButton = card.querySelector('.share-btn');
                    shareButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showShareModal(mapData);
                    });
                    
                    // Handle thumbnail click to toggle code display
                    const thumbnail = card.querySelector('.map-thumbnail');
                    thumbnail.addEventListener('click', (e) => {
                        e.preventDefault();
                        const codeDisplay = card.querySelector('.map-code-display');
                        codeDisplay.style.display = codeDisplay.style.display === 'flex' ? 'none' : 'flex';
                    });
                    
                    // Handle card click to show map detail
                    const cardElement = card.querySelector('.map-card');
                    cardElement.addEventListener('click', () => {
                        previousState = {
                            scrollPosition: window.scrollY,
                            searchTerm: document.getElementById('search-input').value,
                            page: currentPage
                        };
                        showMapDetail(mapData);
                    });
                    
                    const uploaderInfo = card.querySelector('.uploader-info');
                    primaryDatabase.ref('users/' + mapData.uploaderId).once('value')
                        .then(userSnapshot => {
                            const user = userSnapshot.val();
                            if (user) {
                                uploaderInfo.querySelector('.uploader-name').textContent = user.username;
                                uploaderInfo.querySelector('.profile-pic').src = user.profilePic || DEFAULT_PROFILE_PIC;
                                
                                uploaderInfo.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    viewUserProfile(mapData.uploaderId);
                                });
                            }
                        });
                    
                    contentArea.appendChild(card);
                });
            } else {
                // If primary database fails, try backup database
                backupDatabase.ref('maps').once('value')
                    .then(snapshot => {
                        const maps = snapshot.val();
                        contentArea.innerHTML = '';
                        
                        if (maps) {
                            let mapsArray = Object.entries(maps).map(([id, map]) => ({ id, ...map }));
                            mapsArray = shuffleArray(mapsArray);
                            
                            mapsArray.forEach(mapData => {
                                const card = mapCardTemplate.content.cloneNode(true);
                                card.querySelector('.map-thumbnail').src = mapData.thumbnail || DEFAULT_THUMBNAIL;
                                card.querySelector('.map-title').textContent = mapData.title;
                                card.querySelector('.views-count').textContent = mapData.views || 0;
                                
                                // Show the first code in the card (but hidden by default)
                                const firstCode = mapData.codes && mapData.codes.length > 0 ? mapData.codes[0].code : 'Click Thumbnail';
                                card.querySelector('.map-code').textContent = firstCode;
                                
                                const deleteBtn = card.querySelector('.delete-btn');
                                if (currentUser && mapData.uploaderId === currentUser.uid) {
                                    deleteBtn.style.display = 'flex';
                                    deleteBtn.addEventListener('click', (e) => {
                                        e.stopPropagation();
                                        showDeleteConfirmation(mapData, 'backup');
                                    });
                                } else {
                                    deleteBtn.style.display = 'none';
                                }
                                
                                const copyButton = card.querySelector('.copy-btn');
                                copyButton.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    const codeToCopy = card.querySelector('.map-code').textContent;
                                    navigator.clipboard.writeText(codeToCopy);
                                    showToast(`Map code "${codeToCopy}" copied!`);
                                });
                                
                                const shareButton = card.querySelector('.share-btn');
                                shareButton.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    showShareModal(mapData);
                                });
                                
                                // Handle thumbnail click to toggle code display
                                const thumbnail = card.querySelector('.map-thumbnail');
                                thumbnail.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    const codeDisplay = card.querySelector('.map-code-display');
                                    codeDisplay.style.display = codeDisplay.style.display === 'flex' ? 'none' : 'flex';
                                });
                                
                                // Handle card click to show map detail
                                const cardElement = card.querySelector('.map-card');
                                cardElement.addEventListener('click', () => {
                                    previousState = {
                                        scrollPosition: window.scrollY,
                                        searchTerm: document.getElementById('search-input').value,
                                        page: currentPage
                                    };
                                    showMapDetail(mapData);
                                });
                                
                                const uploaderInfo = card.querySelector('.uploader-info');
                                primaryDatabase.ref('users/' + mapData.uploaderId).once('value')
                                    .then(userSnapshot => {
                                        const user = userSnapshot.val();
                                        if (user) {
                                            uploaderInfo.querySelector('.uploader-name').textContent = user.username;
                                            uploaderInfo.querySelector('.profile-pic').src = user.profilePic || DEFAULT_PROFILE_PIC;
                                            
                                            uploaderInfo.addEventListener('click', (e) => {
                                                e.stopPropagation();
                                                viewUserProfile(mapData.uploaderId);
                                            });
                                        }
                                    });
                                
                                contentArea.appendChild(card);
                            });
                        } else {
                            contentArea.innerHTML = '<p>No maps found. Be the first to upload one!</p>';
                        }
                    })
                    .catch(error => {
                        contentArea.innerHTML = `<p>Error loading maps: ${error.message}</p>`;
                    });
            }
        })
        .catch(error => {
            // If primary database fails, try backup database
            backupDatabase.ref('maps').once('value')
                .then(snapshot => {
                    const maps = snapshot.val();
                    contentArea.innerHTML = '';
                    
                    if (maps) {
                        let mapsArray = Object.entries(maps).map(([id, map]) => ({ id, ...map }));
                        mapsArray = shuffleArray(mapsArray);
                        
                        mapsArray.forEach(mapData => {
                            const card = mapCardTemplate.content.cloneNode(true);
                            card.querySelector('.map-thumbnail').src = mapData.thumbnail || DEFAULT_THUMBNAIL;
                            card.querySelector('.map-title').textContent = mapData.title;
                            card.querySelector('.views-count').textContent = mapData.views || 0;
                            
                            // Show the first code in the card (but hidden by default)
                            const firstCode = mapData.codes && mapData.codes.length > 0 ? mapData.codes[0].code : 'Click Thumbnail';
                            card.querySelector('.map-code').textContent = firstCode;
                            
                            const deleteBtn = card.querySelector('.delete-btn');
                            if (currentUser && mapData.uploaderId === currentUser.uid) {
                                deleteBtn.style.display = 'flex';
                                deleteBtn.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    showDeleteConfirmation(mapData, 'backup');
                                });
                            } else {
                                deleteBtn.style.display = 'none';
                            }
                            
                            const copyButton = card.querySelector('.copy-btn');
                            copyButton.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const codeToCopy = card.querySelector('.map-code').textContent;
                                navigator.clipboard.writeText(codeToCopy);
                                showToast(`Map code "${codeToCopy}" copied!`);
                            });
                            
                            const shareButton = card.querySelector('.share-btn');
                            shareButton.addEventListener('click', (e) => {
                                e.stopPropagation();
                                showShareModal(mapData);
                            });
                            
                            // Handle thumbnail click to toggle code display
                            const thumbnail = card.querySelector('.map-thumbnail');
                            thumbnail.addEventListener('click', (e) => {
                                e.preventDefault();
                                const codeDisplay = card.querySelector('.map-code-display');
                                codeDisplay.style.display = codeDisplay.style.display === 'flex' ? 'none' : 'flex';
                            });
                            
                            // Handle card click to show map detail
                            const cardElement = card.querySelector('.map-card');
                            cardElement.addEventListener('click', () => {
                                previousState = {
                                    scrollPosition: window.scrollY,
                                    searchTerm: document.getElementById('search-input').value,
                                    page: currentPage
                                };
                                showMapDetail(mapData);
                            });
                            
                            const uploaderInfo = card.querySelector('.uploader-info');
                            primaryDatabase.ref('users/' + mapData.uploaderId).once('value')
                                .then(userSnapshot => {
                                    const user = userSnapshot.val();
                                    if (user) {
                                        uploaderInfo.querySelector('.uploader-name').textContent = user.username;
                                        uploaderInfo.querySelector('.profile-pic').src = user.profilePic || DEFAULT_PROFILE_PIC;
                                        
                                        uploaderInfo.addEventListener('click', (e) => {
                                            e.stopPropagation();
                                            viewUserProfile(mapData.uploaderId);
                                        });
                                    }
                                });
                            
                            contentArea.appendChild(card);
                        });
                    } else {
                        contentArea.innerHTML = '<p>No maps found. Be the first to upload one!</p>';
                    }
                })
                .catch(error => {
                    contentArea.innerHTML = `<p>Error loading maps: ${error.message}</p>`;
                });
        });
}

// Load assets page
function loadAssetsPage() {
    currentPage = 'assets';
    updateNavButtons();
    updateFloatingButtonStyle();
    
    contentArea.innerHTML = '<div class="loading">Loading assets maps...</div>';
    
    secondaryDatabase.ref('maps').once('value')
        .then(snapshot => {
            const maps = snapshot.val();
            contentArea.innerHTML = '';
            
            if (maps) {
                let mapsArray = Object.entries(maps).map(([id, map]) => ({ id, ...map }));
                mapsArray = shuffleArray(mapsArray);
                
                mapsArray.forEach(mapData => {
                    const card = mapCardTemplate.content.cloneNode(true);
                    card.querySelector('.map-thumbnail').src = mapData.thumbnail || DEFAULT_THUMBNAIL;
                    card.querySelector('.map-title').textContent = mapData.title;
                    card.querySelector('.views-count').textContent = mapData.views || 0;
                    
                    // Show the first code in the card (but hidden by default)
                    const firstCode = mapData.codes && mapData.codes.length > 0 ? mapData.codes[0].code : 'Click Thumbnail';
                    card.querySelector('.map-code').textContent = firstCode;
                    
                    // Change copy button style for assets
                    const copyButton = card.querySelector('.copy-btn');
                    copyButton.classList.add('assets-copy-btn');
                    
                    const deleteBtn = card.querySelector('.delete-btn');
                    if (currentUser && mapData.uploaderId === currentUser.uid) {
                        deleteBtn.style.display = 'flex';
                        deleteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            showDeleteConfirmation(mapData, 'assets');
                        });
                    } else {
                        deleteBtn.style.display = 'none';
                    }
                    
                    copyButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const codeToCopy = card.querySelector('.map-code').textContent;
                        navigator.clipboard.writeText(codeToCopy);
                        showToast(`Map code "${codeToCopy}" copied!`, 3000, true);
                    });
                    
                    const shareButton = card.querySelector('.share-btn');
                    shareButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showShareModal(mapData);
                    });
                    
                    // Handle thumbnail click to toggle code display
                    const thumbnail = card.querySelector('.map-thumbnail');
                    thumbnail.addEventListener('click', (e) => {
                        e.preventDefault();
                        const codeDisplay = card.querySelector('.map-code-display');
                        codeDisplay.style.display = codeDisplay.style.display === 'flex' ? 'none' : 'flex';
                    });
                    
                    // Handle card click to show map detail
                    const cardElement = card.querySelector('.map-card');
                    cardElement.addEventListener('click', () => {
                        previousState = {
                            scrollPosition: window.scrollY,
                            searchTerm: document.getElementById('search-input').value,
                            page: currentPage
                        };
                        showMapDetail(mapData);
                    });
                    
                    const uploaderInfo = card.querySelector('.uploader-info');
                    primaryDatabase.ref('users/' + mapData.uploaderId).once('value')
                        .then(userSnapshot => {
                            const user = userSnapshot.val();
                            if (user) {
                                uploaderInfo.querySelector('.uploader-name').textContent = user.username;
                                uploaderInfo.querySelector('.profile-pic').src = user.profilePic || DEFAULT_PROFILE_PIC;
                                
                                uploaderInfo.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    viewUserProfile(mapData.uploaderId);
                                });
                            }
                        });
                    
                    contentArea.appendChild(card);
                });
            } else {
                contentArea.innerHTML = '<p>No assets maps found. Be the first to upload one!</p>';
            }
        })
        .catch(error => {
            contentArea.innerHTML = `<p>Error loading assets maps: ${error.message}</p>`;
        });
}

// Show delete confirmation dialog
function showDeleteConfirmation(mapData, dbType) {
    mapToDelete = mapData;
    currentDatabase = dbType;
    confirmDeleteModal.style.display = 'flex';
}

// Delete map function
function deleteMap() {
    if (!mapToDelete || !currentUser) return;
    
    const dbRef = currentDatabase === 'primary' ? primaryDatabase : 
                 currentDatabase === 'assets' ? secondaryDatabase : backupDatabase;
    
    dbRef.ref('maps/' + mapToDelete.id).remove()
        .then(() => {
            showToast('Map deleted successfully!', 3000, currentDatabase === 'assets');
            confirmDeleteModal.style.display = 'none';
            
            if (currentPage === 'assets') {
                loadAssetsPage();
            } else {
                loadHomepage();
            }
        })
        .catch(error => {
            showToast('Error deleting map: ' + error.message, 3000, currentDatabase === 'assets');
        });
}

// Show map detail view
function showMapDetail(mapData) {
    currentMapDetail = mapData;
    
    document.getElementById('detail-title').textContent = mapData.title;
    document.getElementById('detail-thumbnail').src = mapData.thumbnail || DEFAULT_THUMBNAIL;
    
    // Update date display
    document.getElementById('detail-date').textContent = `Uploaded: ${mapData.formattedDate || formatDate(mapData.createdAt)}`;
    
    // Update stats (views)
    document.getElementById('detail-views').textContent = mapData.views || 0;
    
    // Update tags
    const tagsContainer = document.getElementById('detail-tags');
    tagsContainer.innerHTML = '';
    
    if (mapData.tags && mapData.tags.length > 0) {
        mapData.tags.forEach(tag => {
            const tagElement = mapTagTemplate.content.cloneNode(true);
            tagElement.querySelector('.map-tag').textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
    } else {
        // Add default tags if none exist
        const defaultTags = ['Free Fire', 'Map', 'Craftland'];
        defaultTags.forEach(tag => {
            const tagElement = mapTagTemplate.content.cloneNode(true);
            tagElement.querySelector('.map-tag').textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
    }
    
    // Clear previous codes
    detailCodesContainer.innerHTML = '';
    
    // Add all map codes with copy buttons
    if (mapData.codes && mapData.codes.length > 0) {
        mapData.codes.forEach(codeItem => {
            const codeItemElement = mapCodeItemTemplate.content.cloneNode(true);
            codeItemElement.querySelector('.map-detail-code-label').textContent = codeItem.label || 'Map Code';
            codeItemElement.querySelector('.map-detail-code-value').textContent = codeItem.code;
            
            const copyButton = codeItemElement.querySelector('.map-detail-copy-btn');
            const shareButton = codeItemElement.querySelector('.map-detail-share-btn');
            
            // Style differently for assets
            if (currentPage === 'assets') {
                copyButton.classList.add('assets-detail-copy-btn');
            }
            
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(codeItem.code);
                showToast(`Map code "${codeItem.code}" copied!`, 3000, currentPage === 'assets');
            });
            
            shareButton.addEventListener('click', () => {
                showShareModal({
                    ...mapData,
                    code: codeItem.code
                });
            });
            
            detailCodesContainer.appendChild(codeItemElement);
        });
    } else {
        // Fallback for old maps with single code
        const codeItemElement = mapCodeItemTemplate.content.cloneNode(true);
        codeItemElement.querySelector('.map-detail-code-label').textContent = 'Map Code';
        codeItemElement.querySelector('.map-detail-code-value').textContent = mapData.code || 'No code available';
        
        const copyButton = codeItemElement.querySelector('.map-detail-copy-btn');
        const shareButton = codeItemElement.querySelector('.map-detail-share-btn');
        
        // Style differently for assets
        if (currentPage === 'assets') {
            copyButton.classList.add('assets-detail-copy-btn');
        }
        
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(mapData.code);
            showToast(`Map code "${mapData.code}" copied!`, 3000, currentPage === 'assets');
        });
        
        shareButton.addEventListener('click', () => {
            showShareModal(mapData);
        });
        
        detailCodesContainer.appendChild(codeItemElement);
    }
    
    if (mapData.youtubeUrl) {
        document.getElementById('detail-youtube').href = mapData.youtubeUrl;
        document.getElementById('detail-youtube').style.display = 'block';
    } else {
        document.getElementById('detail-youtube').style.display = 'none';
    }
    
    document.getElementById('detail-description').textContent = mapData.description || 'No description provided.';
    
    const uploaderInfo = document.getElementById('detail-uploader');
    primaryDatabase.ref('users/' + mapData.uploaderId).once('value')
        .then(userSnapshot => {
            const user = userSnapshot.val();
            if (user) {
                uploaderInfo.querySelector('.uploader-name').textContent = user.username;
                uploaderInfo.querySelector('.profile-pic').src = user.profilePic || DEFAULT_PROFILE_PIC;
                
                uploaderInfo.addEventListener('click', () => {
                    viewUserProfile(mapData.uploaderId);
                });
            }
        });
    
    mapDetailModal.style.display = 'block';
    
    // Increment view count
    const dbRef = currentDatabase === 'primary' ? primaryDatabase : 
                 currentDatabase === 'assets' ? secondaryDatabase : backupDatabase;
    
    dbRef.ref('maps/' + mapData.id).transaction(map => {
        if (map) {
            map.views = (map.views || 0) + 1;
        }
        return map;
    }).then(() => {
        // Update the view count on the home page card if it exists
        const mapCard = document.querySelector(`.map-card[data-id="${mapData.id}"]`);
        if (mapCard) {
            const viewsCount = mapCard.querySelector('.views-count');
            if (viewsCount) {
                viewsCount.textContent = (parseInt(viewsCount.textContent) || 0) + 1;
            }
        }
    });
    
    // Update URL without reloading if not a direct map link
    if (!isDirectMapLink) {
        const newUrl = `${BASE_URL}?map=${mapData.id}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    }
}

// Show share modal
function showShareModal(mapData) {
    currentMapToShare = mapData;
    const shareLink = `${BASE_URL}?map=${mapData.id}`;
    shareLinkInput.value = shareLink;
    shareModal.style.display = 'flex';
}

// Show profile share modal
function showProfileShareModal(userId, username) {
    const shareLink = `${BASE_URL}?profile=${userId}`;
    shareLinkInput.value = shareLink;
    shareModal.style.display = 'flex';
}

// Copy share link to clipboard
function copyShareLink() {
    shareLinkInput.select();
    document.execCommand('copy');
    showToast('Link copied to clipboard!', 3000, currentPage === 'assets');
}

// Share via WhatsApp
function shareViaWhatsApp() {
    const message = `Check out this Free Fire map: ${shareLinkInput.value}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

// Share via Facebook
function shareViaFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLinkInput.value)}`, '_blank');
}

// Share via Telegram
function shareViaTelegram() {
    const message = `Check out this Free Fire map: ${shareLinkInput.value}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(message)}`, '_blank');
}

// View user profile
function viewUserProfile(userId) {
    if (!currentUser) {
        showToast('Please login to view profiles');
        loginModal.style.display = 'flex';
        return;
    }
    
    contentArea.innerHTML = '<div class="loading">Loading profile...</div>';
    
    // Save previous state if not coming from a direct link
    if (!isDirectProfileLink) {
        previousState = {
            scrollPosition: window.scrollY,
            searchTerm: document.getElementById('search-input').value,
            page: currentPage
        };
    }
    
    // Update URL if not a direct profile link
    if (!isDirectProfileLink) {
        const newUrl = `${BASE_URL}?profile=${userId}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    }
    
    primaryDatabase.ref('users/' + userId).once('value')
        .then(userSnapshot => {
            const userData = userSnapshot.val();
            
            const profilePage = profilePageTemplate.content.cloneNode(true);
            
            profilePage.getElementById('profile-username').textContent = userData.username;
            profilePage.querySelector('.profile-pic').src = userData.profilePic || DEFAULT_PROFILE_PIC;
            
            // Only show edit profile pic button if viewing own profile
            const editProfilePic = profilePage.querySelector('.edit-profile-pic');
            if (userId === currentUser.uid) {
                editProfilePic.style.display = 'flex';
                
                const profilePicUpload = profilePage.getElementById('profile-pic-upload');
                const profilePic = profilePage.querySelector('.profile-pic');
                
                profilePicUpload.addEventListener('change', async (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        try {
                            showToast('Uploading profile picture...');
                            const imageUrl = await uploadImageToImgBB(file);
                            
                            await primaryDatabase.ref('users/' + userId).update({
                                profilePic: imageUrl
                            });
                            
                            currentUser.profilePic = imageUrl;
                            localStorage.setItem('currentUser', JSON.stringify(currentUser));
                            
                            profilePic.src = imageUrl;
                            showToast('Profile picture updated!');
                        } catch (error) {
                            showToast('Error updating profile picture: ' + error.message);
                        }
                    }
                });
            } else {
                editProfilePic.style.display = 'none';
            }
            
            const logoutBtn = profilePage.getElementById('logout-btn');
            const shareProfileBtn = profilePage.getElementById('share-profile-btn');
            
            if (userId !== currentUser.uid) {
                logoutBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back';
                logoutBtn.style.backgroundColor = '#4a6bff';
                logoutBtn.addEventListener('click', () => {
                    if (currentPage === 'assets') {
                        loadAssetsPage();
                    } else {
                        loadHomepage();
                    }
                });
                shareProfileBtn.style.display = 'none';
            } else {
                logoutBtn.addEventListener('click', () => {
                    currentUser = null;
                    localStorage.removeItem('currentUser');
                    loadHomepage();
                });
                shareProfileBtn.style.display = 'flex';
                shareProfileBtn.addEventListener('click', () => {
                    showProfileShareModal(userId, userData.username);
                });
            }
            
            const uploadedMapsContainer = profilePage.getElementById('uploaded-maps-container');
            const databaseSelector = profilePage.getElementById('profile-database-selector');
            const dbButtons = databaseSelector.querySelectorAll('.profile-database-btn');
            
            // Function to load maps for the profile
            function loadProfileMaps(dbType) {
                uploadedMapsContainer.innerHTML = '<div class="loading">Loading maps...</div>';
                
                // Update active button
                dbButtons.forEach(btn => {
                    if (btn.dataset.db === dbType) {
                        btn.classList.add('active');
                        if (dbType === 'assets') {
                            btn.classList.add('assets-active');
                        }
                    } else {
                        btn.classList.remove('active', 'assets-active');
                    }
                });
                
                const dbRef = dbType === 'primary' ? primaryDatabase : 
                             dbType === 'assets' ? secondaryDatabase : backupDatabase;
                
                dbRef.ref('maps').orderByChild('uploaderId').equalTo(userId).once('value')
                    .then(snapshot => {
                        const maps = snapshot.val();
                        uploadedMapsContainer.innerHTML = '';
                        
                        if (maps) {
                            let mapsArray = Object.entries(maps).map(([id, map]) => ({ id, ...map, dbType }));
                            
                            // Sort by timestamp if available
                            mapsArray.sort((a, b) => {
                                const timeA = a.createdAt || 0;
                                const timeB = b.createdAt || 0;
                                return timeB - timeA;
                            });
                            
                            mapsArray.forEach(mapData => {
                                const card = mapCardTemplate.content.cloneNode(true);
                                card.querySelector('.map-thumbnail').src = mapData.thumbnail || DEFAULT_THUMBNAIL;
                                card.querySelector('.map-title').textContent = mapData.title;
                                card.querySelector('.views-count').textContent = mapData.views || 0;
                                
                                // Show the first code in the card (but hidden by default)
                                const firstCode = mapData.codes && mapData.codes.length > 0 ? mapData.codes[0].code : 'Click Thumbnail';
                                card.querySelector('.map-code').textContent = firstCode;
                                
                                // Style differently for assets
                                if (mapData.dbType === 'assets') {
                                    const copyButton = card.querySelector('.copy-btn');
                                    copyButton.classList.add('assets-copy-btn');
                                }
                                
                                const deleteBtn = card.querySelector('.delete-btn');
                                if (currentUser && mapData.uploaderId === currentUser.uid) {
                                    deleteBtn.style.display = 'flex';
                                    deleteBtn.addEventListener('click', (e) => {
                                        e.stopPropagation();
                                        showDeleteConfirmation(mapData, mapData.dbType);
                                    });
                                } else {
                                    deleteBtn.style.display = 'none';
                                }
                                
                                const copyButton = card.querySelector('.copy-btn');
                                copyButton.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    const codeToCopy = card.querySelector('.map-code').textContent;
                                    navigator.clipboard.writeText(codeToCopy);
                                    showToast(`Map code "${codeToCopy}" copied!`, 3000, mapData.dbType === 'assets');
                                });

                                const shareButton = card.querySelector('.share-btn');
                                shareButton.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    showShareModal(mapData);
                                });
                                
                                // Handle thumbnail click to toggle code display
                                const thumbnail = card.querySelector('.map-thumbnail');
                                thumbnail.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    const codeDisplay = card.querySelector('.map-code-display');
                                    codeDisplay.style.display = codeDisplay.style.display === 'flex' ? 'none' : 'flex';
                                });
                                
                                // Handle card click to show map detail
                                const cardElement = card.querySelector('.map-card');
                                cardElement.addEventListener('click', () => {
                                    previousState = {
                                        scrollPosition: window.scrollY,
                                        searchTerm: document.getElementById('search-input').value,
                                        page: currentPage
                                    };
                                    showMapDetail(mapData);
                                });
                                
                                card.querySelector('.uploader-info').style.display = 'none';
                                
                                uploadedMapsContainer.appendChild(card);
                            });
                        } else {
                            uploadedMapsContainer.innerHTML = '<p>No maps uploaded yet.</p>';
                        }
                    });
            }
            
            // Add click handlers for database buttons
            dbButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    loadProfileMaps(btn.dataset.db);
                });
            });
            
            // Load primary maps by default
            loadProfileMaps('primary');
            
            contentArea.innerHTML = '';
            contentArea.appendChild(profilePage);
        });
}

// Load profile page
function loadProfilePage() {
    currentPage = 'profile';
    updateNavButtons();
    
    if (currentUser) {
        viewUserProfile(currentUser.uid);
    } else {
        showToast('Please login to view profile');
        loginModal.style.display = 'flex';
    }
}

// Upload map function
async function uploadMap(title, code, youtubeUrl, description, isAssets = false) {
    if (!title || !code) {
        showToast('Please fill in all required fields', 3000, isAssets);
        return;
    }
    
    if (!currentUser) {
        showToast('Please login to upload maps', 3000, isAssets);
        loginModal.style.display = 'flex';
        return;
    }
    
    const loader = isAssets ? assetsSubmitLoader : submitLoader;
    const btn = isAssets ? assetsSubmitBtn : submitBtn;
    
    loader.style.display = 'block';
    btn.disabled = true;
    
    try {
        let thumbnailUrl = DEFAULT_THUMBNAIL;
        const thumbnail = isAssets ? assetsThumbnailFile : thumbnailFile;
        
        if (thumbnail) {
            thumbnailUrl = await uploadImageToImgBB(thumbnail);
        }
        
        // Get all map codes from the inputs
        const container = isAssets ? assetsCodeInputsContainer : codeInputsContainer;
        const codeInputs = container.querySelectorAll('.map-code-input');
        const labels = container.querySelectorAll('.input-label');
        
        let codes = [];
        codeInputs.forEach((input, index) => {
            if (input.value.trim()) {
                codes.push({
                    label: labels[index].value || 'Map Code',
                    code: input.value.trim()
                });
            }
        });
        
        if (codes.length === 0) {
            throw new Error('Please enter at least one map code');
        }
        
        const mapData = {
            title: title,
            codes: codes,
            youtubeUrl: youtubeUrl || '',
            description: description || '',
            uploaderId: currentUser.uid,
            uploaderName: currentUser.username || 'Anonymous',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            formattedDate: formatDate(Date.now()),
            thumbnail: thumbnailUrl,
            views: 0,
            tags: ['Free Fire', 'Map', 'Craftland']
        };
        
        // First try primary database
        try {
            const dbRef = isAssets ? secondaryDatabase : primaryDatabase;
            const newMapRef = dbRef.ref('maps').push();
            await newMapRef.set(mapData);
            
            loader.style.display = 'none';
            btn.disabled = false;
            
            if (isAssets) {
                assetsUploadFormModal.style.display = 'none';
                document.getElementById('assets-map-title').value = '';
                document.getElementById('assets-youtube-url').value = '';
                document.getElementById('assets-description').value = '';
                assetsThumbnailPreview.style.display = 'none';
                assetsThumbnailFile = null;
                
                // Clear code inputs but keep one
                assetsCodeInputsContainer.innerHTML = '';
                addCodeInput(assetsCodeInputsContainer);
            } else {
                uploadFormModal.style.display = 'none';
                document.getElementById('map-title').value = '';
                document.getElementById('youtube-url').value = '';
                document.getElementById('description').value = '';
                thumbnailPreview.style.display = 'none';
                thumbnailFile = null;
                
                // Clear code inputs but keep one
                codeInputsContainer.innerHTML = '';
                addCodeInput(codeInputsContainer);
            }
            
            showToast('Map uploaded successfully!', 3000, isAssets);
            
            if (isAssets) {
                loadAssetsPage();
            } else {
                loadHomepage();
            }
        } catch (primaryError) {
            // If primary fails, try backup database
            if (!isAssets) { // Only for home maps (assets have their own database)
                try {
                    const backupRef = backupDatabase.ref('maps').push();
                    await backupRef.set(mapData);
                    
                    loader.style.display = 'none';
                    btn.disabled = false;
                    
                    uploadFormModal.style.display = 'none';
                    document.getElementById('map-title').value = '';
                    document.getElementById('youtube-url').value = '';
                    document.getElementById('description').value = '';
                    thumbnailPreview.style.display = 'none';
                    thumbnailFile = null;
                    
                    // Clear code inputs but keep one
                    codeInputsContainer.innerHTML = '';
                    addCodeInput(codeInputsContainer);
                    
                    showToast('Map uploaded to backup database successfully!');
                    loadHomepage();
                } catch (backupError) {
                    loader.style.display = 'none';
                    btn.disabled = false;
                    showToast('Error uploading map to both databases: ' + backupError.message);
                }
            } else {
                loader.style.display = 'none';
                btn.disabled = false;
                showToast('Error uploading map: ' + primaryError.message, 3000, true);
            }
        }
    } catch (error) {
        loader.style.display = 'none';
        btn.disabled = false;
        showToast('Error uploading map: ' + error.message, 3000, isAssets);
    }
}

// Handle back button/popstate events
window.addEventListener('popstate', function(event) {
    // Check if we're coming from a map detail view
    if (mapDetailModal.style.display === 'block') {
        mapDetailModal.style.display = 'none';
        
        // Only reload if we came from a direct map link
        if (isDirectMapLink) {
            isDirectMapLink = false;
            
            // Restore previous state
            if (previousState.page === 'assets') {
                loadAssetsPage();
            } else if (previousState.page === 'home') {
                loadHomepage();
            }
            
            if (previousState.searchTerm) {
                document.getElementById('search-input').value = previousState.searchTerm;
                filterMaps(previousState.searchTerm);
            }
            
            window.scrollTo(0, previousState.scrollPosition);
        }
    }
    // Check if we're coming from a direct profile link
    else if (isDirectProfileLink) {
        isDirectProfileLink = false;
        
        // Restore previous state
        if (previousState.page === 'assets') {
            loadAssetsPage();
        } else if (previousState.page === 'home') {
            loadHomepage();
        }
        
        if (previousState.searchTerm) {
            document.getElementById('search-input').value = previousState.searchTerm;
            filterMaps(previousState.searchTerm);
        }
        
        window.scrollTo(0, previousState.scrollPosition);
    }
});

// Filter maps based on search term
function filterMaps(searchTerm) {
    const mapCards = document.querySelectorAll('.map-card');
    mapCards.forEach(card => {
        const title = card.querySelector('.map-title').textContent.toLowerCase();
        const code = card.querySelector('.map-code').textContent.toLowerCase();
        if (title.includes(searchTerm.toLowerCase()) || code.includes(searchTerm.toLowerCase())) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    
    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        togglePasswordVisibility(passwordInput, togglePassword);
    });
    
    toggleRegPassword.addEventListener('click', () => {
        togglePasswordVisibility(regPasswordInput, toggleRegPassword);
    });
    
    // Login button click
    loginBtn.addEventListener('click', () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            loginError.textContent = 'Please enter both username and password';
            return;
        }
        
        login(username, password);
    });
    
    // Register button click
    registerBtn.addEventListener('click', () => {
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        
        if (username.length < 3) {
            registerError.textContent = 'Username must be at least 3 characters';
            return;
        }
        
        if (password.length < 6) {
            registerError.textContent = 'Password must be at least 6 characters';
            return;
        }
        
        register(username, password);
    });
    
    // Switch between login and register tabs
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginContent.classList.add('active');
        registerContent.classList.remove('active');
    });
    
    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerContent.classList.add('active');
        loginContent.classList.remove('active');
    });
    
    // Floating upload button click
    floatingUploadBtn.addEventListener('click', () => {
        if (!currentUser) {
            loginModal.style.display = 'flex';
            return;
        }
        
        if (currentPage === 'assets') {
            assetsUploadFormModal.style.display = 'flex';
        } else {
            uploadFormModal.style.display = 'flex';
        }
    });
    
    // Close modal buttons
    closeModal.addEventListener('click', () => {
        uploadFormModal.style.display = 'none';
    });
    
    closeAssetsModal.addEventListener('click', () => {
        assetsUploadFormModal.style.display = 'none';
    });
    
    closeLoginModal.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    closeShare.addEventListener('click', () => {
        shareModal.style.display = 'none';
    });
    
    // Close detail modal
    closeDetail.addEventListener('click', () => {
        mapDetailModal.style.display = 'none';
        
        // Only update URL if we came from a direct map link
        if (isDirectMapLink) {
            isDirectMapLink = false;
            window.history.pushState({ path: BASE_URL }, '', BASE_URL);
            
            // Restore previous state
            if (previousState.page === 'assets') {
                loadAssetsPage();
            } else if (previousState.page === 'home') {
                loadHomepage();
            }
            
            if (previousState.searchTerm) {
                document.getElementById('search-input').value = previousState.searchTerm;
                filterMaps(previousState.searchTerm);
            }
            
            window.scrollTo(0, previousState.scrollPosition);
        } else {
            // Just close the modal without changing anything else
            window.history.back();
        }
    });
    
    // Submit buttons for upload forms
    submitBtn.addEventListener('click', () => {
        const title = document.getElementById('map-title').value;
        const youtubeUrl = document.getElementById('youtube-url').value;
        const description = document.getElementById('description').value;
        
        // Get the first code as the primary code (for backward compatibility)
        const firstCodeInput = codeInputsContainer.querySelector('.map-code-input');
        const code = firstCodeInput ? firstCodeInput.value : '';
        
        uploadMap(title, code, youtubeUrl, description, false);
    });
    
    assetsSubmitBtn.addEventListener('click', () => {
        const title = document.getElementById('assets-map-title').value;
        const youtubeUrl = document.getElementById('assets-youtube-url').value;
        const description = document.getElementById('assets-description').value;
        
        // Get the first code as the primary code (for backward compatibility)
        const firstCodeInput = assetsCodeInputsContainer.querySelector('.map-code-input');
        const code = firstCodeInput ? firstCodeInput.value : '';
        
        uploadMap(title, code, youtubeUrl, description, true);
    });
    
    // Thumbnail upload handlers
    thumbnailUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            thumbnailFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                thumbnailPreview.src = e.target.result;
                thumbnailPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            thumbnailPreview.src = '#';
            thumbnailPreview.style.display = 'none';
            thumbnailFile = null;
        }
    });
    
    assetsThumbnailUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            assetsThumbnailFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                assetsThumbnailPreview.src = e.target.result;
                assetsThumbnailPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            assetsThumbnailPreview.src = '#';
            assetsThumbnailPreview.style.display = 'none';
            assetsThumbnailFile = null;
        }
    });
    
    // Navigation buttons
    homeBtn.addEventListener('click', loadHomepage);
    assetsBtn.addEventListener('click', loadAssetsPage);
    profileBtn.addEventListener('click', loadProfilePage);
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === uploadFormModal) {
            uploadFormModal.style.display = 'none';
        }
        if (event.target === assetsUploadFormModal) {
            assetsUploadFormModal.style.display = 'none';
        }
        if (event.target === mapDetailModal) {
            mapDetailModal.style.display = 'none';
            
            // Only update URL if we came from a direct map link
            if (isDirectMapLink) {
                isDirectMapLink = false;
                window.history.pushState({ path: BASE_URL }, '', BASE_URL);
                
                // Restore previous state
                if (previousState.page === 'assets') {
                    loadAssetsPage();
                } else if (previousState.page === 'home') {
                    loadHomepage();
                }
                
                if (previousState.searchTerm) {
                    document.getElementById('search-input').value = previousState.searchTerm;
                    filterMaps(previousState.searchTerm);
                }
                
                window.scrollTo(0, previousState.scrollPosition);
            } else {
                // Just close the modal without changing anything else
                window.history.back();
            }
        }
        if (event.target === confirmDeleteModal) {
            confirmDeleteModal.style.display = 'none';
        }
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (event.target === shareModal) {
            shareModal.style.display = 'none';
        }
    });
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterMaps(searchTerm);
    });
    
    // Delete confirmation buttons
    confirmDeleteYes.addEventListener('click', deleteMap);
    confirmDeleteNo.addEventListener('click', () => {
        confirmDeleteModal.style.display = 'none';
        mapToDelete = null;
    });
    
    // Add code inputs
    addCodeBtn.addEventListener('click', () => {
        addCodeInput(codeInputsContainer);
    });
    
    assetsAddCodeBtn.addEventListener('click', () => {
        addCodeInput(assetsCodeInputsContainer);
    });
});

function isWebView() {
    const ua = navigator.userAgent || '';
    // WebView detect logic (Android WebView + iOS UIWebView/WKWebView)
    return (
        (ua.includes('wv') || ua.includes('WebView')) || // Android WebView
        (ua.includes('iPhone') && !ua.includes('Safari')) // iOS WebView
    );
}

if (!isWebView()) {
    // Browser detected: show button
    document.getElementById('buttonon').style.display = 'inline-flex';
}
