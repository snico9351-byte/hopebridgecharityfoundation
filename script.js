// ===== Public Site =====
document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('open');
            toggle.textContent = nav.classList.contains('open') ? '✕' : '☰';
        });
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
                toggle.textContent = '☰';
            });
        });
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const id = this.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                const offset = 70;
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // Donation form → save to localStorage
    const form = document.getElementById('donationForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('donorName').value.trim();
            const phone = document.getElementById('donorPhone').value.trim();
            const amount = document.getElementById('donorAmount').value.trim();
            const message = document.getElementById('donorMessage').value.trim();

            if (!name || !phone) {
                alert('Please enter your name and phone number.');
                return;
            }

            const donation = {
                id: Date.now(),
                name,
                phone,
                amount: amount || 'Not specified',
                message: message || '',
                date: new Date().toLocaleString(),
                status: 'pending' // pending | confirmed | thanked
            };

            let donations = JSON.parse(localStorage.getItem('hopebridge_donations') || '[]');
            donations.unshift(donation);
            localStorage.setItem('hopebridge_donations', JSON.stringify(donations));

            form.style.display = 'none';
            document.getElementById('formSuccess').style.display = 'block';

            // Optional: also open WhatsApp to the admin number with a pre-filled message
            // so the donor can immediately request account details
            const adminMsg = encodeURIComponent(
                `Hello HopeBridge,\n\nMy name is ${name}.\nPhone: ${phone}\nI would like to donate${amount ? ' ' + amount : ''}.\nPlease share the official bank account details.\n\nThank you.`
            );
            // Uncomment the next line if you want the form to also open WhatsApp automatically:
            // window.open(`https://wa.me/15184168768?text=${adminMsg}`, '_blank');
        });
    }
});

// ===== Admin Functions (used by admin.html) =====
const ADMIN_PASSWORD = 'hope2026'; // Change this to your own secret password

function loginAdmin() {
    const pw = document.getElementById('adminPassword').value;
    if (pw === ADMIN_PASSWORD) {
        sessionStorage.setItem('hopebridge_admin', '1');
        document.getElementById('loginBox').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadDonors();
    } else {
        alert('Incorrect password. Please try again.');
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('hopebridge_admin');
    location.reload();
}

function loadDonors() {
    const donations = JSON.parse(localStorage.getItem('hopebridge_donations') || '[]');
    const tbody = document.getElementById('donorsBody');
    const empty = document.getElementById('emptyState');
    const countEl = document.getElementById('totalCount');
    const pendingEl = document.getElementById('pendingCount');

    if (countEl) countEl.textContent = donations.length;
    if (pendingEl) pendingEl.textContent = donations.filter(d => d.status !== 'thanked').length;

    if (!donations.length) {
        if (tbody) tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    const defaultMsg = document.getElementById('appreciationMsg')?.value || getDefaultMessage();

    tbody.innerHTML = donations.map(d => {
        const cleanPhone = d.phone.replace(/[^0-9+]/g, '');
        const msg = encodeURIComponent(
            defaultMsg
                .replace(/\{name\}/gi, d.name)
                .replace(/\{amount\}/gi, d.amount)
        );
        const waLink = `https://wa.me/${cleanPhone.replace('+', '')}?text=${msg}`;
        const isThanked = d.status === 'thanked';

        return `
            <tr>
                <td><strong>${escapeHtml(d.name)}</strong></td>
                <td>${escapeHtml(d.phone)}</td>
                <td>${escapeHtml(d.amount)}</td>
                <td>${escapeHtml(d.date)}</td>
                <td><span class="msg-preview">${escapeHtml(d.message || '—')}</span></td>
                <td>
                    ${isThanked
                        ? '<button class="send-btn sent" disabled>Thanked ✓</button>'
                        : `<a href="${waLink}" target="_blank" class="send-btn" onclick="markThanked(${d.id})">Send Thank You</a>`
                    }
                </td>
            </tr>
        `;
    }).join('');
}

function markThanked(id) {
    let donations = JSON.parse(localStorage.getItem('hopebridge_donations') || '[]');
    donations = donations.map(d => d.id === id ? { ...d, status: 'thanked' } : d);
    localStorage.setItem('hopebridge_donations', JSON.stringify(donations));
    // small delay so the WhatsApp window can open first
    setTimeout(loadDonors, 400);
}

function getDefaultMessage() {
    return `Dear {name},

Thank you from the bottom of our hearts for your generous donation of {amount} to HopeBridge Foundation.

Your kindness is helping orphans, widows and families affected by war — especially in India and other places of need. Because of you, a child will eat today, a widow will feel less alone, and hope will shine a little brighter.

We are truly grateful. May God bless you and your family abundantly.

With deep appreciation,
HopeBridge Foundation Team
WhatsApp: +1 518 416 8768`;
}

function updateMessagePreview() {
    // just for live feel; the actual message is read when Send is clicked
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-login check on admin page
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('adminPanel')) {
        if (sessionStorage.getItem('hopebridge_admin') === '1') {
            document.getElementById('loginBox').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            loadDonors();
        }
        // set default message
        const ta = document.getElementById('appreciationMsg');
        if (ta && !ta.value) ta.value = getDefaultMessage();
    }
});
