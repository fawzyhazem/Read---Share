// script.js - نسخة Frontend احترافية مع SweetAlert2 ودعم كامل للسعر والصور

// مفاتيح التخزين
const LS_USERS_KEY = 'BOOK_APP_USERS';
const LS_BOOKS_KEY = 'BOOK_APP_BOOKS';
const LS_CURRENT_USER_KEY = 'BOOK_APP_CURRENT_USER_ID';

// عناصر DOM
const loginSection = document.getElementById('auth-modal');
const mainContent = document.getElementById('main-content');
const addBookModal = document.getElementById('add-book-modal');
const bookDetailsModal = document.getElementById('book-details-modal');
const bookDetailsContent = document.getElementById('book-details-content');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutButton = document.getElementById('logout-btn');

const addBookBtn = document.getElementById('add-book-btn');
const addBookForm = document.getElementById('add-book-form');
const booksList = document.getElementById('books-list');

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

const showLoginBtn = document.getElementById('show-login-btn');
const showRegisterBtn = document.getElementById('show-register-btn');

// ===================== إعدادات SweetAlert2 الموحدة =====================
const swalConfig = {
    background: '#1e1e1e', 
    color: '#FFC300',      
    confirmButtonColor: '#FFC300', 
    customClass: {
        popup: 'neon-border' 
    }
};

// ===================== دوال مساعدة للتخزين =====================
const getUsers = () => {
    try { return JSON.parse(localStorage.getItem(LS_USERS_KEY)) || []; }
    catch { return []; }
};
const saveUsers = (users) => localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));

const getBooks = () => {
    try { return JSON.parse(localStorage.getItem(LS_BOOKS_KEY)) || []; }
    catch { return []; }
};
const saveBooks = (books) => localStorage.setItem(LS_BOOKS_KEY, JSON.stringify(books));

const getCurrentUserId = () => localStorage.getItem(LS_CURRENT_USER_KEY);
const setCurrentUserId = (id) => localStorage.setItem(LS_CURRENT_USER_KEY, id);
const clearCurrentUserId = () => localStorage.removeItem(LS_CURRENT_USER_KEY);

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// ===================== معالجة الصور =====================
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('الملف المرفوع يجب أن يكون صورة'));
            return;
        }
        const maxSize = 2 * 1024 * 1024; 
        if (file.size > maxSize) {
            reject(new Error('حجم الصورة كبير جداً (الحد الأقصى 2MB)'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('فشل في قراءة الصورة'));
        reader.readAsDataURL(file);
    });
};

// ===================== التحكم في الواجهة =====================
const updateUI = () => {
    const userId = getCurrentUserId();
    if (userId) {
        if (loginSection) loginSection.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        renderBooks();
    } else {
        if (loginSection) loginSection.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
    }
};

const openAddBookModal = () => { if (addBookModal) addBookModal.style.display = 'flex'; };
const closeAddBookModal = () => {
    if (addBookModal) addBookModal.style.display = 'none';
    if (addBookForm) addBookForm.reset();
};
const openBookDetailsModal = () => { if (bookDetailsModal) bookDetailsModal.style.display = 'flex'; };
const closeBookDetailsModal = () => { if (bookDetailsModal) bookDetailsModal.style.display = 'none'; };
const closeModal = () => { closeAddBookModal(); closeBookDetailsModal(); };

document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', closeModal);
});

if (showLoginBtn && showRegisterBtn) {
    showLoginBtn.addEventListener('click', () => {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        showLoginBtn.classList.add('active');
        showRegisterBtn.classList.remove('active');
    });
    showRegisterBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        showLoginBtn.classList.remove('active');
        showRegisterBtn.classList.add('active');
    });
}

// ===================== المصادقة =====================

if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;

        if (!email || !password) {
            Swal.fire({ ...swalConfig, icon: 'warning', title: 'بيانات ناقصة', text: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.' });
            return;
        }

        const users = getUsers();
        if (users.find(u => u.email === email)) {
            Swal.fire({ ...swalConfig, icon: 'error', title: 'خطأ', text: 'البريد الإلكتروني مسجل بالفعل.' });
            return;
        }

        users.push({ id: generateId(), email, password });
        saveUsers(users);

        Swal.fire({ ...swalConfig, icon: 'success', title: 'تم بنجاح', text: '✅ تم التسجيل بنجاح. يمكنك الآن تسجيل الدخول.' })
            .then(() => {
                registerForm.reset();
                if (showLoginBtn) showLoginBtn.click();
            });
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            Swal.fire({ ...swalConfig, icon: 'warning', title: 'تنبيه', text: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.' });
            return;
        }

        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            Swal.fire({ ...swalConfig, icon: 'error', title: 'فشل الدخول', text: '❌ البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
            return;
        }

        setCurrentUserId(user.id);
        loginForm.reset();
        updateUI();
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        clearCurrentUserId();
        updateUI();
    });
}

// ===================== إدارة الكتب =====================

if (addBookBtn) {
    addBookBtn.addEventListener('click', openAddBookModal);
}

if (addBookForm) {
    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userId = getCurrentUserId();
        if (!userId) {
            Swal.fire({ ...swalConfig, icon: 'info', title: 'تسجيل دخول', text: 'الرجاء تسجيل الدخول أولاً لإضافة كتاب.' });
            return;
        }

        const title = document.getElementById('book-title').value.trim();
        const description = document.getElementById('book-description').value.trim();
        const condition = document.getElementById('book-condition').value;
        const category = document.getElementById('book-category').value.trim();
        const exchangeType = document.querySelector('input[name="exchange_type"]:checked')?.value || 'تبادل';
        const bookPrice = document.getElementById('book-price').value; // جلب قيمة السعر
        const imageFile = document.getElementById('book-image')?.files[0];

        if (!title) {
            Swal.fire({ ...swalConfig, icon: 'warning', title: 'مفقود', text: '❌ الرجاء إدخال عنوان الكتاب.' });
            return;
        }

        let imageBase64 = null;
        if (imageFile) {
            try {
                imageBase64 = await fileToBase64(imageFile);
            } catch (error) {
                Swal.fire({ ...swalConfig, icon: 'error', title: 'خطأ في الصورة', text: error.message });
                return;
            }
        }

        const books = getBooks();
        books.push({
            id: generateId(),
            title,
            description,
            condition,
            category,
            exchange_type: exchangeType,
            price: exchangeType === 'بيع' ? bookPrice : null, // تخزين السعر فقط لو كان النوع بيع
            user_id: userId,
            image: imageBase64,
            created_at: new Date().toISOString()
        });

        try {
            saveBooks(books);
            Swal.fire({ ...swalConfig, icon: 'success', title: 'تمت الإضافة', text: '✅ تم إضافة الكتاب بنجاح!' })
                .then(() => {
                    addBookForm.reset();
                    closeAddBookModal();
                    renderBooks();
                });
        } catch (error) {
            Swal.fire({ ...swalConfig, icon: 'error', title: 'خطأ في الحفظ', text: '❌ فشل في حفظ الكتاب. قد يكون التخزين ممتلئ.' });
        }
    });
}

const createBookCard = (book) => {
    const card = document.createElement('div');
    card.className = 'book-item';
    card.setAttribute('data-id', book.id);

    const currentUserId = getCurrentUserId();
    const canDelete = currentUserId && currentUserId === book.user_id;
    const exchangeClass = book.exchange_type === 'تبرع' ? 'exchange-type-donate' : 'exchange-type-exchange';

    // إضافة عرض السعر في الكارت
    const priceHTML = (book.exchange_type === 'بيع' && book.price) 
        ? `<p style="color: #FFC300; font-weight: bold;">💰 السعر: ${book.price} ج.م</p>` 
        : '';

    const thumbnailHTML = book.image 
        ? `<div style="text-align: center; margin-bottom: 10px;">
               <img src="${book.image}" alt="${book.title}" 
                    style="max-width: 100%; height: 150px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
           </div>`
        : '';

    card.innerHTML = `
        ${thumbnailHTML}
        <h3><a href="#" class="book-title-link" data-book-id="${book.id}">📖 ${book.title}</a></h3>
        <p><strong>التصنيف:</strong> ${book.category || 'غير محدد'}</p>
        <p><strong>نوع التبادل:</strong> <span class="${exchangeClass}">${book.exchange_type}</span></p>
        ${priceHTML}
        ${canDelete ? '<button class="delete-button">🗑️ حذف الكتاب</button>' : ''}
    `;

    card.querySelector('.book-title-link').addEventListener('click', (e) => {
        e.preventDefault();
        showBookDetails(book);
    });

    if (canDelete) {
        card.querySelector('.delete-button').addEventListener('click', () => handleDeleteBook(book.id));
    }

    return card;
};

const showBookDetails = (book) => {
    const exchangeClass = book.exchange_type === 'تبرع' ? 'exchange-type-donate' : 'exchange-type-exchange';
    
    // إضافة عرض السعر في تفاصيل الكتاب
    const priceDetailHTML = (book.exchange_type === 'بيع' && book.price) 
        ? `<p><span class="detail-label">💰 السعر المطلوب:</span> <span style="color: #FFC300; font-size: 1.2em;">${book.price} ج.م</span></p>` 
        : '';

    const imageHTML = book.image 
        ? `<div class="image-container">
               <img src="${book.image}" alt="${book.title}" 
                    style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
           </div>`
        : '';

    bookDetailsContent.innerHTML = `
        ${imageHTML}
        <h2>📖 ${book.title}</h2>
        <p><span class="detail-label">الوصف:</span> ${book.description || 'لا يوجد وصف'}</p>
        <p><span class="detail-label">الحالة:</span> ${book.condition || 'غير محددة'}</p>
        <p><span class="detail-label">التصنيف:</span> ${book.category || 'غير محدد'}</p>
        <p><span class="detail-label">نوع التبادل:</span> <span class="${exchangeClass}">${book.exchange_type}</span></p>
        ${priceDetailHTML}
    `;
    openBookDetailsModal();
};

const renderBooks = (keyword = '') => {
    let books = getBooks().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    if (keyword) {
        const k = keyword.toLowerCase();
        books = books.filter(book =>
            (book.title || '').toLowerCase().includes(k) ||
            (book.description || '').toLowerCase().includes(k) ||
            (book.category || '').toLowerCase().includes(k)
        );
    }

    if (!booksList) return;
    booksList.innerHTML = books.length === 0 ? '<p class="no-results">📚 لا توجد كتب متاحة حاليًا.</p>' : '';
    books.forEach(book => booksList.appendChild(createBookCard(book)));
};

const handleDeleteBook = (bookId) => {
    Swal.fire({
        ...swalConfig,
        title: 'هل أنت متأكد؟',
        text: "لا يمكنك التراجع عن حذف هذا الكتاب!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذفه!',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            let books = getBooks();
            const index = books.findIndex(b => b.id === bookId);
            if (index !== -1) {
                books.splice(index, 1);
                saveBooks(books);
                Swal.fire({ ...swalConfig, icon: 'success', title: 'تم الحذف', text: 'تم حذف الكتاب بنجاح.' });
                renderBooks(searchInput?.value || '');
            }
        }
    });
};

if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        renderBooks(searchInput.value.trim());
    });
}

const exchangeRadios = document.querySelectorAll('input[name="exchange_type"]');
const priceContainer = document.getElementById('price-container');

exchangeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        priceContainer.style.display = e.target.value === 'بيع' ? 'block' : 'none';
        if (e.target.value !== 'بيع') document.getElementById('book-price').value = '';
    });
});

document.addEventListener('DOMContentLoaded', updateUI);