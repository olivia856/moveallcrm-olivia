// MoveHome CRM – Users Module (API-connected)

let currentUsersPage = 1;
const USERS_PER_PAGE = 10;
let usersContractorsCache = [];

// Helper: get/set form values by element ID
function getUserVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setUserVal(id, v) { const el = document.getElementById(id); if (el) el.value = v || ''; }

async function loadContractorsForUsers() {
    try {
        const res = await api.get('/contractors', { limit: 200 });
        if (res.success) {
            usersContractorsCache = res.data || [];
            populateUserContractorDropdown();
        }
    } catch(e) { console.warn('Could not load contractors for users', e); }
}

function populateUserContractorDropdown() {
    const sel = document.getElementById('user-contractor-input');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">— None (Admin / No filter) —</option>' +
        usersContractorsCache.map(c =>
            `<option value="${escapeHtml(c.company)}">${escapeHtml(c.company)}</option>`
        ).join('');
    if (current) sel.value = current;
}

async function loadUsersData() {
    await loadContractorsForUsers();
    try {
        const res = await api.get('/users', { limit: 200 });
        if (!res.success) { showToast('Error', res.error || 'Failed to load users', 'error'); return; }

        let data = res.data || [];

        // Apply global search
        const q = (document.getElementById('global-search')?.value || '').toLowerCase().trim();
        if (q) {
            data = data.filter(u =>
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.phone || '').toLowerCase().includes(q) ||
                (u.role || '').toLowerCase().includes(q)
            );
        }

        renderUsersTable(data);
    } catch (err) {
        console.error('Load users error:', err);
        showToast('Error', 'Failed to load users', 'error');
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) { console.error('users-tbody not found'); return; }
    const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
    const start = (currentUsersPage - 1) * USERS_PER_PAGE;
    const page = users.slice(start, start + USERS_PER_PAGE);

    // Update count
    const countEl = document.getElementById('users-count');
    if (countEl) countEl.textContent = users.length;

    if (page.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users found.</td></tr>';
        renderPagination('users-pagination', 1, 0, () => { });
        return;
    }

    tbody.innerHTML = page.map(u => `
        <tr data-id="${u.id}">
            <td>${escapeHtml(u.name || '—')}</td>
            <td>${escapeHtml(u.phone || '—')}</td>
            <td>${escapeHtml(u.email || '—')}</td>
            <td><span class="role-badge role-${u.role}">${u.role ? u.role.toUpperCase() : '—'}</span></td>
            <td>${u.contractor_name ? `<span style="background:rgba(99,102,241,.15);color:#a5b4fc;padding:3px 10px;border-radius:6px;font-size:0.78rem;font-weight:600;">${escapeHtml(u.contractor_name)}</span>` : '<span style="color:var(--text-muted);font-size:0.8rem;">—</span>'}</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-outline" onclick="editUser(${u.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">Delete</button>
            </td>
        </tr>
    `).join('');

    renderPagination('users-pagination', currentUsersPage, totalPages, (p) => { currentUsersPage = p; loadUsersData(); });
}

async function editUser(id) {
    try {
        await loadContractorsForUsers();
        const res = await api.get(`/users/${id}`);
        if (!res.success) { showToast('Error', 'User not found', 'error'); return; }
        const u = res.data;
        document.getElementById('user-modal-title').textContent = 'Edit User';
        document.getElementById('user-id').value = id;
        setUserVal('user-name-input', u.name);
        setUserVal('user-phone-input', u.phone);
        setUserVal('user-email-input', u.email);
        setUserVal('user-password-input', '');
        // Set role
        const roleSel = document.getElementById('user-role-input');
        if (roleSel) roleSel.value = u.role || 'staff';
        // Set linked contractor (after dropdown is populated)
        setTimeout(() => {
            const cSel = document.getElementById('user-contractor-input');
            if (cSel) cSel.value = u.contractor_name || '';
        }, 50);
        openModal('user-modal');
    } catch (err) {
        showToast('Error', 'Failed to load user', 'error');
    }
}

async function openAddUserModal() {
    await loadContractorsForUsers();
    document.getElementById('user-modal-title').textContent = 'Add New App User';
    document.getElementById('user-id').value = '';
    document.getElementById('user-form').reset();
    const roleSel = document.getElementById('user-role-input');
    if (roleSel) roleSel.value = 'staff';
    const cSel = document.getElementById('user-contractor-input');
    if (cSel) cSel.value = '';
    openModal('user-modal');
}

async function saveUser(e) {
    e.preventDefault();
    const editId = getUserVal('user-id');
    const data = {
        name:            getUserVal('user-name-input'),
        phone:           getUserVal('user-phone-input'),
        email:           getUserVal('user-email-input'),
        role:            getUserVal('user-role-input') || 'staff',
        contractor_name: getUserVal('user-contractor-input') || null
    };
    const password = getUserVal('user-password-input');
    if (password) data.password = password;
    if (!editId && !password) {
        showToast('Error', 'Password is required for new users', 'error');
        return;
    }

    try {
        // Route through backend so bcrypt hashing happens server-side
        const url    = editId ? `/api/users/${editId}` : '/api/users';
        const method = editId ? 'PUT' : 'POST';
        const res    = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            showToast('Success', editId ? 'User updated' : 'User created', 'success');
            closeModal('user-modal');
            loadUsersData();
        } else {
            showToast('Error', result.error || 'Failed to save', 'error');
        }
    } catch (err) {
        showToast('Error', 'Failed to save user', 'error');
    }
}

async function deleteUser(id) {
    if (!await appConfirm('Delete this user?')) return;
    try {
        const res    = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) { showToast('Deleted', 'User removed', 'success'); loadUsersData(); }
        else showToast('Error', result.error || 'Delete failed', 'error');
    } catch (err) {
        showToast('Error', 'Failed to delete user', 'error');
    }
}

