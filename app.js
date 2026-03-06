(() => {
  const STORAGE_KEY = 'contacts';

  // --- Data Layer ---
  function getContacts() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveContacts(contacts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }

  function addContact(contact) {
    const contacts = getContacts();
    contact.id = crypto.randomUUID();
    contact.createdAt = new Date().toISOString();
    contacts.push(contact);
    saveContacts(contacts);
    return contact;
  }

  function updateContact(id, data) {
    const contacts = getContacts();
    const idx = contacts.findIndex(c => c.id === id);
    if (idx === -1) return null;
    contacts[idx] = { ...contacts[idx], ...data };
    saveContacts(contacts);
    return contacts[idx];
  }

  function deleteContact(id) {
    const contacts = getContacts().filter(c => c.id !== id);
    saveContacts(contacts);
  }

  // --- DOM References ---
  const searchInput = document.getElementById('search');
  const sortField = document.getElementById('sort-field');
  const sortOrder = document.getElementById('sort-order');
  const addBtn = document.getElementById('add-btn');
  const contactList = document.getElementById('contact-list');
  const emptyMsg = document.getElementById('empty-msg');

  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const contactForm = document.getElementById('contact-form');
  const contactIdInput = document.getElementById('contact-id');
  const cancelBtn = document.getElementById('cancel-btn');

  const confirmOverlay = document.getElementById('confirm-overlay');
  const confirmCancel = document.getElementById('confirm-cancel');
  const confirmDelete = document.getElementById('confirm-delete');

  const photoInput = document.getElementById('photo');
  const photoPreview = document.getElementById('photo-preview');
  const photoPlaceholder = document.getElementById('photo-placeholder');
  const removePhotoBtn = document.getElementById('remove-photo');

  const fields = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    address: document.getElementById('address'),
    notes: document.getElementById('notes'),
  };

  const errors = {
    name: document.getElementById('name-error'),
    email: document.getElementById('email-error'),
    phone: document.getElementById('phone-error'),
    photo: document.getElementById('photo-error'),
  };

  let currentPhotoData = null; // base64 data URL

  let pendingDeleteId = null;

  // --- Photo helpers ---
  const MAX_PHOTO_SIZE = 1 * 1024 * 1024; // 1 MB

  function showPhotoPreview(dataUrl) {
    photoPreview.src = dataUrl;
    photoPreview.hidden = false;
    photoPlaceholder.hidden = true;
    removePhotoBtn.hidden = false;
  }

  function clearPhotoPreview() {
    currentPhotoData = null;
    photoPreview.src = '';
    photoPreview.hidden = true;
    photoPlaceholder.hidden = false;
    removePhotoBtn.hidden = true;
    photoInput.value = '';
    errors.photo.textContent = '';
  }

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    errors.photo.textContent = '';
    if (!file) return;

    if (file.size > MAX_PHOTO_SIZE) {
      errors.photo.textContent = 'File exceeds 1 MB limit.';
      photoInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      currentPhotoData = e.target.result;
      showPhotoPreview(currentPhotoData);
    };
    reader.readAsDataURL(file);
  });

  removePhotoBtn.addEventListener('click', clearPhotoPreview);

  // --- Validation ---
  function validateForm() {
    let valid = true;
    errors.name.textContent = '';
    errors.email.textContent = '';
    errors.phone.textContent = '';
    errors.photo.textContent = '';

    if (!fields.name.value.trim()) {
      errors.name.textContent = 'Name is required.';
      valid = false;
    }

    const email = fields.email.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email.textContent = 'Invalid email format.';
      valid = false;
    }

    const phone = fields.phone.value.trim();
    if (phone && !/^[\d\s\-()+.]+$/.test(phone)) {
      errors.phone.textContent = 'Invalid phone format.';
      valid = false;
    }

    return valid;
  }

  // --- Rendering ---
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    const query = searchInput.value.toLowerCase().trim();
    const field = sortField.value;
    const order = sortOrder.value;

    let contacts = getContacts();

    // Filter
    if (query) {
      contacts = contacts.filter(c =>
        (c.name || '').toLowerCase().includes(query) ||
        (c.email || '').toLowerCase().includes(query) ||
        (c.phone || '').toLowerCase().includes(query)
      );
    }

    // Sort
    contacts.sort((a, b) => {
      let valA = (a[field] || '').toLowerCase();
      let valB = (b[field] || '').toLowerCase();
      if (field === 'createdAt') {
        valA = a.createdAt || '';
        valB = b.createdAt || '';
      }
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    // Render
    if (contacts.length === 0) {
      contactList.innerHTML = '';
      emptyMsg.hidden = false;
      return;
    }

    emptyMsg.hidden = true;
    contactList.innerHTML = contacts.map(c => {
      const initial = (c.name || '?')[0].toUpperCase();
      const avatarHtml = c.photo
        ? `<img class="contact-photo" src="${c.photo}" alt="">`
        : `<div class="contact-avatar">${escapeHtml(initial)}</div>`;
      return `
      <div class="contact-card" data-id="${c.id}">
        ${avatarHtml}
        <div class="contact-info">
          <div class="contact-name">${escapeHtml(c.name)}</div>
          ${c.email ? `<div class="contact-detail">${escapeHtml(c.email)}</div>` : ''}
          ${c.phone ? `<div class="contact-detail">${escapeHtml(c.phone)}</div>` : ''}
          ${c.address ? `<div class="contact-detail">${escapeHtml(c.address)}</div>` : ''}
          ${c.notes ? `<div class="contact-detail"><em>${escapeHtml(c.notes)}</em></div>` : ''}
        </div>
        <div class="contact-actions">
          <button class="btn btn-secondary btn-icon edit-btn" data-id="${c.id}" title="Edit">Edit</button>
          <button class="btn btn-danger btn-icon delete-btn" data-id="${c.id}" title="Delete">Delete</button>
        </div>
      </div>`;
    }).join('');
  }

  // --- Modal Helpers ---
  function openModal(title, contact) {
    modalTitle.textContent = title;
    contactIdInput.value = contact ? contact.id : '';
    fields.name.value = contact ? contact.name : '';
    fields.email.value = contact ? contact.email || '' : '';
    fields.phone.value = contact ? contact.phone || '' : '';
    fields.address.value = contact ? contact.address || '' : '';
    fields.notes.value = contact ? contact.notes || '' : '';
    errors.name.textContent = '';
    errors.email.textContent = '';
    errors.phone.textContent = '';
    errors.photo.textContent = '';

    if (contact && contact.photo) {
      currentPhotoData = contact.photo;
      showPhotoPreview(contact.photo);
    } else {
      clearPhotoPreview();
    }

    modalOverlay.hidden = false;
    fields.name.focus();
  }

  function closeModal() {
    modalOverlay.hidden = true;
    contactForm.reset();
    clearPhotoPreview();
  }

  // --- Event Listeners ---
  addBtn.addEventListener('click', () => openModal('Add Contact', null));
  cancelBtn.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      phone: fields.phone.value.trim(),
      address: fields.address.value.trim(),
      notes: fields.notes.value.trim(),
      photo: currentPhotoData || '',
    };

    const id = contactIdInput.value;
    if (id) {
      updateContact(id, data);
    } else {
      addContact(data);
    }

    closeModal();
    render();
  });

  contactList.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains('edit-btn')) {
      const contact = getContacts().find(c => c.id === id);
      if (contact) openModal('Edit Contact', contact);
    }

    if (e.target.classList.contains('delete-btn')) {
      pendingDeleteId = id;
      confirmOverlay.hidden = false;
    }
  });

  confirmCancel.addEventListener('click', () => {
    pendingDeleteId = null;
    confirmOverlay.hidden = true;
  });

  confirmOverlay.addEventListener('click', (e) => {
    if (e.target === confirmOverlay) {
      pendingDeleteId = null;
      confirmOverlay.hidden = true;
    }
  });

  confirmDelete.addEventListener('click', () => {
    if (pendingDeleteId) {
      deleteContact(pendingDeleteId);
      pendingDeleteId = null;
      confirmOverlay.hidden = true;
      render();
    }
  });

  searchInput.addEventListener('input', render);
  sortField.addEventListener('change', render);
  sortOrder.addEventListener('change', render);

  // --- Keyboard: Escape closes modals ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!modalOverlay.hidden) closeModal();
      if (!confirmOverlay.hidden) {
        pendingDeleteId = null;
        confirmOverlay.hidden = true;
      }
    }
  });

  // --- Initial render ---
  render();
})();
