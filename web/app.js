// Global state
let currentUser = null;
let refreshInterval = null;

// API helpers
async function api(endpoint, options = {}) {
    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (response.status === 401) {
        showLogin();
        throw new Error('Unauthorized');
    }

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// Authentication
async function checkSession() {
    try {
        const data = await api('/auth/session');
        if (data.authenticated) {
            currentUser = data.user;
            showApp();
            return true;
        }
    } catch (e) {
        // Not authenticated
    }
    showLogin();
    return false;
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    document.getElementById('currentUser').textContent = currentUser.username;
    loadMonitoring();
    startAutoRefresh();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
        await api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        await checkSession();
    } catch (error) {
        errorDiv.textContent = 'Invalid username or password';
        errorDiv.style.display = 'block';
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await api('/auth/logout', { method: 'POST' });
    } catch (e) {}
    showLogin();
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        switchSection(section);
    });
});

function switchSection(section) {
    // Update nav
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section${capitalize(section)}`).classList.add('active');

    // Load data for section
    switch (section) {
        case 'monitoring':
            loadMonitoring();
            break;
        case 'packages':
            loadPackages();
            break;
        case 'services':
            loadServices();
            break;
        case 'network':
            loadNetwork();
            break;
        case 'users':
            loadUsers();
            break;
        case 'config':
            loadConfigs();
            break;
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Auto-refresh for monitoring
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        const activeSection = document.querySelector('.section.active');
        if (activeSection && activeSection.id === 'sectionMonitoring') {
            loadMonitoring();
        }
    }, 3000);
}

// Monitoring
async function loadMonitoring() {
    try {
        const summary = await api('/system/summary');
        displaySystemSummary(summary);
    } catch (error) {
        console.error('Failed to load monitoring:', error);
    }
}

function displaySystemSummary(data) {
    const container = document.getElementById('systemSummary');
    container.innerHTML = `
        <div class="card">
            <h3>Hostname</h3>
            <div class="card-value">${data.hostname}</div>
            <div class="card-detail">${data.os}</div>
        </div>
        <div class="card">
            <h3>Uptime</h3>
            <div class="card-value">${formatUptime(data.uptime)}</div>
            <div class="card-detail">Kernel: ${data.kernel}</div>
        </div>
        <div class="card">
            <h3>CPU Usage</h3>
            <div class="card-value">${data.cpuUsage.toFixed(1)}%</div>
            <div class="card-detail">${data.cpuCores} cores | Load: ${data.loadAverage.map(l => l.toFixed(2)).join(', ')}</div>
        </div>
        <div class="card">
            <h3>Memory</h3>
            <div class="card-value">${data.memUsage.toFixed(1)}%</div>
            <div class="card-detail">${formatBytes(data.memUsed)} / ${formatBytes(data.memTotal)}</div>
        </div>
        <div class="card">
            <h3>Swap</h3>
            <div class="card-value">${data.swapUsage.toFixed(1)}%</div>
            <div class="card-detail">${formatBytes(data.swapUsed)} / ${formatBytes(data.swapTotal)}</div>
        </div>
        <div class="card">
            <h3>Disk Usage</h3>
            <div class="card-value">${data.diskUsage.toFixed(1)}%</div>
            <div class="card-detail">${formatBytes(data.diskUsed)} / ${formatBytes(data.diskTotal)}</div>
        </div>
        <div class="card">
            <h3>Disk I/O</h3>
            <div class="card-value">${formatBytes(data.diskReadBps)}/s</div>
            <div class="card-detail">Write: ${formatBytes(data.diskWriteBps)}/s</div>
        </div>
        <div class="card">
            <h3>Network</h3>
            <div class="card-value">↓ ${formatBytes(data.networkRxBps)}/s</div>
            <div class="card-detail">↑ ${formatBytes(data.networkTxBps)}/s</div>
        </div>
        <div class="card">
            <h3>Processes</h3>
            <div class="card-value">${data.processes}</div>
            <div class="card-detail">Running processes</div>
        </div>
    `;
}

// Packages
async function loadPackages() {
    try {
        const packages = await api('/packages');
        displayPackages(packages);
    } catch (error) {
        console.error('Failed to load packages:', error);
    }
}

function displayPackages(packages) {
    const container = document.getElementById('packagesList');
    if (!packages || packages.length === 0) {
        container.innerHTML = '<p style="padding: 20px;">No packages found</p>';
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Version</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                ${packages.slice(0, 100).map(pkg => `
                    <tr>
                        <td>${pkg.name}</td>
                        <td>${pkg.version}</td>
                        <td>${pkg.description || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

document.getElementById('packageSearch').addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    if (query.length < 2) {
        loadPackages();
        return;
    }
    try {
        const results = await api(`/packages/search?q=${encodeURIComponent(query)}`);
        displayPackages(results);
    } catch (error) {
        console.error('Search failed:', error);
    }
}, 500));

document.getElementById('btnUpdate').addEventListener('click', async () => {
    if (!confirm('Update package lists?')) return;
    try {
        await api('/packages/update', { method: 'POST', body: JSON.stringify({}) });
        alert('Package lists updated successfully');
    } catch (error) {
        alert('Failed to update: ' + error.message);
    }
});

document.getElementById('btnUpgrade').addEventListener('click', async () => {
    if (!confirm('Upgrade all packages? This may take a while.')) return;
    try {
        await api('/packages/update', { method: 'POST', body: JSON.stringify({ upgrade: true }) });
        alert('Packages upgraded successfully');
        loadPackages();
    } catch (error) {
        alert('Failed to upgrade: ' + error.message);
    }
});

// Services
async function loadServices() {
    try {
        const services = await api('/services');
        displayServices(services);
    } catch (error) {
        console.error('Failed to load services:', error);
    }
}

function displayServices(services) {
    const container = document.getElementById('servicesList');
    if (!services || services.length === 0) {
        container.innerHTML = '<p style="padding: 20px;">No services found</p>';
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${services.map(svc => `
                    <tr>
                        <td>${svc.unit}</td>
                        <td><span class="status status-${getStatusClass(svc.active)}">${svc.active}</span></td>
                        <td>${svc.description}</td>
                        <td>
                            <button class="btn-success" onclick="serviceAction('${svc.unit}', 'start')">Start</button>
                            <button class="btn-danger" onclick="serviceAction('${svc.unit}', 'stop')">Stop</button>
                            <button class="btn-primary" onclick="serviceAction('${svc.unit}', 'restart')">Restart</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function getStatusClass(status) {
    if (status === 'active') return 'active';
    if (status === 'failed') return 'failed';
    return 'inactive';
}

window.serviceAction = async function(unit, action) {
    try {
        await api(`/services/${unit}/${action}`, { method: 'POST' });
        setTimeout(loadServices, 500);
    } catch (error) {
        alert(`Failed to ${action} service: ` + error.message);
    }
};

// Network
async function loadNetwork() {
    try {
        const network = await api('/network');
        displayNetwork(network);
    } catch (error) {
        console.error('Failed to load network:', error);
    }
}

function displayNetwork(data) {
    const container = document.getElementById('networkInfo');
    container.innerHTML = `
        <div class="card" style="margin-bottom: 20px;">
            <h3>Firewall Status</h3>
            <div class="card-value">${data.firewallStatus}</div>
            <div style="margin-top: 12px;">
                <button class="btn-success" onclick="firewallAction('enable')">Enable</button>
                <button class="btn-danger" onclick="firewallAction('disable')">Disable</button>
            </div>
        </div>
        <div class="card">
            <h3>Network Interfaces</h3>
            ${data.interfaces.map(iface => `
                <div style="margin-bottom: 12px;">
                    <strong>${iface.name}</strong> (${iface.state})
                    <div class="card-detail">
                        ${iface.addresses.join(', ')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

window.firewallAction = async function(action) {
    try {
        await api(`/network/firewall/${action}`, { method: 'POST' });
        setTimeout(loadNetwork, 500);
    } catch (error) {
        alert(`Failed to ${action} firewall: ` + error.message);
    }
};

// Users
async function loadUsers() {
    try {
        const users = await api('/users');
        displayUsers(users);
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

function displayUsers(users) {
    const container = document.getElementById('usersList');
    if (!users || users.length === 0) {
        container.innerHTML = '<p style="padding: 20px;">No users found</p>';
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Username</th>
                    <th>UID</th>
                    <th>Home</th>
                    <th>Shell</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.username}</td>
                        <td>${user.uid}</td>
                        <td>${user.home}</td>
                        <td>${user.shell}</td>
                        <td><span class="status ${user.locked ? 'status-inactive' : 'status-active'}">${user.locked ? 'Locked' : 'Active'}</span></td>
                        <td>
                            ${!user.locked ? `<button class="btn-danger" onclick="userAction('${user.username}', 'lock')">Lock</button>` : `<button class="btn-success" onclick="userAction('${user.username}', 'unlock')">Unlock</button>`}
                            <button class="btn-danger" onclick="userAction('${user.username}', 'delete')">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

window.userAction = async function(username, action) {
    if (action === 'delete' && !confirm(`Delete user ${username}?`)) return;
    try {
        await api(`/users/${action}`, {
            method: 'POST',
            body: JSON.stringify({ username }),
        });
        loadUsers();
    } catch (error) {
        alert(`Failed to ${action} user: ` + error.message);
    }
};

document.getElementById('btnCreateUser').addEventListener('click', () => {
    const username = prompt('Enter username:');
    if (!username) return;
    const password = prompt('Enter password:');
    if (!password) return;
    
    api('/users/create', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    })
    .then(() => loadUsers())
    .catch(error => alert('Failed to create user: ' + error.message));
});

// Config files
async function loadConfigs() {
    try {
        const configs = await api('/config');
        displayConfigs(configs);
    } catch (error) {
        console.error('Failed to load configs:', error);
    }
}

function displayConfigs(configs) {
    const container = document.getElementById('configList');
    container.innerHTML = `
        <div class="config-list">
            ${configs.map(cfg => `
                <div class="config-item" onclick="editConfig('${cfg.id}')">
                    <h3>${cfg.name}</h3>
                    <p>${cfg.description}</p>
                    <div class="card-detail">${cfg.path}</div>
                </div>
            `).join('')}
        </div>
    `;
}

window.editConfig = async function(id) {
    try {
        const data = await api(`/config/${id}`);
        const newContent = prompt('Edit configuration:', data.content);
        if (newContent !== null && newContent !== data.content) {
            await api(`/config/${id}`, {
                method: 'POST',
                body: JSON.stringify({ content: newContent }),
            });
            alert('Configuration saved');
        }
    } catch (error) {
        alert('Failed to edit config: ' + error.message);
    }
};

// Logs
document.getElementById('btnLoadLogs').addEventListener('click', async () => {
    const unit = document.getElementById('logsUnit').value.trim();
    if (!unit) {
        alert('Please enter a service unit name');
        return;
    }
    try {
        const data = await api(`/logs?unit=${encodeURIComponent(unit)}&lines=100`);
        document.getElementById('logsOutput').textContent = data.logs;
    } catch (error) {
        alert('Failed to load logs: ' + error.message);
    }
});

// Utility functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Initialize
checkSession();

