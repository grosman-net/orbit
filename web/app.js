// Global state
let currentUser = null;
let refreshInterval = null;
let cpuMemChart = null;
let networkChart = null;
let metricsHistory = [];
let currentConfig = null;
let refreshRate = 5000;

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
    initCharts();
    loadMonitoring();
    startAutoRefresh();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            // Reload page to clear state and start fresh
            window.location.reload();
        } else {
            errorDiv.textContent = 'Invalid username or password';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Invalid username or password';
        errorDiv.style.display = 'block';
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        // Clear local state
        currentUser = null;
        metricsHistory = [];
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
        // Reload page to clear session
        window.location.reload();
    } catch (e) {
        window.location.reload();
    }
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
    }, refreshRate);
}

// Refresh interval control
document.getElementById('refreshInterval')?.addEventListener('change', (e) => {
    refreshRate = parseInt(e.target.value);
    startAutoRefresh();
});

// Export data
document.getElementById('exportData')?.addEventListener('click', () => {
    const lines = ['Orbit Server Metrics Export', `Generated: ${new Date().toLocaleString()}`, '=' .repeat(80), ''];
    
    metricsHistory.forEach((snapshot, idx) => {
        lines.push(`[${idx + 1}] ${new Date(snapshot.timestamp).toLocaleString()}`);
        lines.push(`  Hostname: ${snapshot.hostname}`);
        lines.push(`  Uptime: ${formatUptime(snapshot.uptime)}`);
        lines.push(`  CPU Usage: ${snapshot.cpuUsage.toFixed(1)}%`);
        lines.push(`  Memory Usage: ${snapshot.memUsage.toFixed(1)}% (${formatBytes(snapshot.memUsed)} / ${formatBytes(snapshot.memTotal)})`);
        lines.push(`  Swap Usage: ${snapshot.swapUsage.toFixed(1)}% (${formatBytes(snapshot.swapUsed)} / ${formatBytes(snapshot.swapTotal)})`);
        lines.push(`  Disk Usage: ${snapshot.diskUsage.toFixed(1)}% (${formatBytes(snapshot.diskUsed)} / ${formatBytes(snapshot.diskTotal)})`);
        lines.push(`  Network RX: ${formatBytes(snapshot.networkRxBps)}/s | TX: ${formatBytes(snapshot.networkTxBps)}/s`);
        lines.push(`  Disk I/O Read: ${formatBytes(snapshot.diskReadBps)}/s | Write: ${formatBytes(snapshot.diskWriteBps)}/s`);
        lines.push(`  Processes: ${snapshot.processes}`);
        lines.push(`  Load Average: ${snapshot.loadAverage.map(l => l.toFixed(2)).join(', ')}`);
        lines.push('');
    });
    
    const data = lines.join('\n');
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-metrics-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
});

// Initialize charts
function initCharts() {
    const ctx1 = document.getElementById('cpuMemChart');
    const ctx2 = document.getElementById('networkChart');
    
    if (!ctx1 || !ctx2) return;

    cpuMemChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'CPU %',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Memory %',
                    data: [],
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 100 }
            },
            plugins: {
                legend: { labels: { color: '#fafafa' } }
            }
        }
    });

    networkChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'RX (MB/s)',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'TX (MB/s)',
                    data: [],
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { labels: { color: '#fafafa' } }
            }
        }
    });
}

// Monitoring
async function loadMonitoring() {
    try {
        const summary = await api('/system/summary');
        displaySystemSummary(summary);
        updateCharts(summary);
        
        // Store in history
        metricsHistory.push({
            timestamp: new Date().toISOString(),
            ...summary
        });
        if (metricsHistory.length > 100) metricsHistory.shift();
    } catch (error) {
        console.error('Failed to load monitoring:', error);
    }
}

function updateCharts(data) {
    if (!cpuMemChart || !networkChart) return;

    const time = new Date().toLocaleTimeString();

    // CPU/Memory chart
    cpuMemChart.data.labels.push(time);
    cpuMemChart.data.datasets[0].data.push(data.cpuUsage.toFixed(1));
    cpuMemChart.data.datasets[1].data.push(data.memUsage.toFixed(1));
    if (cpuMemChart.data.labels.length > 20) {
        cpuMemChart.data.labels.shift();
        cpuMemChart.data.datasets[0].data.shift();
        cpuMemChart.data.datasets[1].data.shift();
    }
    cpuMemChart.update('none');

    // Network chart
    networkChart.data.labels.push(time);
    networkChart.data.datasets[0].data.push((data.networkRxBps / 1024 / 1024).toFixed(2));
    networkChart.data.datasets[1].data.push((data.networkTxBps / 1024 / 1024).toFixed(2));
    if (networkChart.data.labels.length > 20) {
        networkChart.data.labels.shift();
        networkChart.data.datasets[0].data.shift();
        networkChart.data.datasets[1].data.shift();
    }
    networkChart.update('none');
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
                    <th style="text-align: right;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${packages.slice(0, 100).map(pkg => `
                    <tr>
                        <td><strong>${pkg.name}</strong></td>
                        <td>${pkg.version}</td>
                        <td>${pkg.description || '-'}</td>
                        <td>
                            <div class="package-actions">
                                <button class="btn-danger" onclick="removePackage('${pkg.name}')">Remove</button>
                                <button class="btn-danger" onclick="purgePackage('${pkg.name}')">Purge</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

window.removePackage = async function(name) {
    if (!confirm(`Remove package ${name}?`)) return;
    try {
        await api('/packages/remove', {
            method: 'POST',
            body: JSON.stringify({ package: name, purge: false }),
        });
        loadPackages();
    } catch (error) {
        alert('Failed to remove package: ' + error.message);
    }
};

window.purgePackage = async function(name) {
    if (!confirm(`Purge package ${name} (including config files)?`)) return;
    try {
        await api('/packages/remove', {
            method: 'POST',
            body: JSON.stringify({ package: name, purge: true }),
        });
        loadPackages();
    } catch (error) {
        alert('Failed to purge package: ' + error.message);
    }
};

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

document.getElementById('btnInstallPackage')?.addEventListener('click', async () => {
    const pkg = prompt('Enter package name to install:');
    if (!pkg) return;
    try {
        await api('/packages/install', {
            method: 'POST',
            body: JSON.stringify({ package: pkg }),
        });
        alert('Package installed successfully');
        loadPackages();
    } catch (error) {
        alert('Failed to install: ' + error.message);
    }
});

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
                    <th style="text-align: right;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${services.map(svc => `
                    <tr>
                        <td><strong>${svc.unit}</strong></td>
                        <td><span class="status status-${getStatusClass(svc.active)}">${svc.active}</span></td>
                        <td>${svc.description}</td>
                        <td>
                            <div class="service-actions">
                                <button class="btn-success" onclick="serviceAction('${svc.unit}', 'start')">Start</button>
                                <button class="btn-danger" onclick="serviceAction('${svc.unit}', 'stop')">Stop</button>
                                <button class="btn-secondary" onclick="serviceAction('${svc.unit}', 'restart')">Restart</button>
                            </div>
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

document.getElementById('btnRefreshServices')?.addEventListener('click', loadServices);

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
    // Display interfaces
    const interfacesContainer = document.getElementById('networkInterfaces');
    interfacesContainer.innerHTML = data.interfaces.map(iface => `
        <div class="interface-card">
            <div class="interface-header">
                <div class="interface-name">
                    ${iface.name}
                    <span class="status status-${iface.state === 'UP' ? 'active' : 'inactive'}">${iface.state}</span>
                </div>
                <div class="interface-controls">
                    <button class="btn-success" onclick="interfaceUp('${iface.name}')">Up</button>
                    <button class="btn-danger" onclick="interfaceDown('${iface.name}')">Down</button>
                </div>
            </div>
            <div class="interface-info">
                <span class="interface-info-label">MAC:</span>
                <span class="interface-info-value">${iface.mac || 'N/A'}</span>
                <span class="interface-info-label">Addresses:</span>
                <span class="interface-info-value">${iface.addresses.join(', ') || 'None'}</span>
                ${iface.mtu ? `<span class="interface-info-label">MTU:</span><span class="interface-info-value">${iface.mtu}</span>` : ''}
            </div>
            <div class="interface-config-form">
                <div class="form-row">
                    <label>IP/Mask:</label>
                    <input type="text" id="ip-${iface.name}" placeholder="10.0.0.10/24" />
                    <button class="btn-secondary" onclick="setInterfaceIP('${iface.name}', false)">Apply</button>
                </div>
                <div class="form-row">
                    <label>Gateway:</label>
                    <input type="text" id="gw-${iface.name}" placeholder="10.0.0.1" />
                    <button class="btn-primary" onclick="setInterfaceIP('${iface.name}', true)">Apply & Save</button>
                </div>
            </div>
        </div>
    `).join('');

    // Display firewall
    const firewallControl = document.getElementById('firewallControl');
    firewallControl.innerHTML = `
        <div class="firewall-status">
            <div class="firewall-status-text">
                Firewall: <span class="status status-${data.firewallStatus === 'active' ? 'active' : 'inactive'}">${data.firewallStatus}</span>
            </div>
            <div class="firewall-buttons">
                <button class="btn-success" onclick="firewallAction('enable')">Enable</button>
                <button class="btn-danger" onclick="firewallAction('disable')">Disable</button>
            </div>
        </div>
    `;

    const rulesContainer = document.getElementById('firewallRules');
    rulesContainer.innerHTML = `
        <div class="firewall-add">
            <button class="btn-success" onclick="addFirewallRule()">Add Rule</button>
        </div>
        ${data.firewallRules.map((rule, idx) => `
            <div class="firewall-rule-item">
                <code>${rule}</code>
                <button class="btn-danger" onclick="deleteFirewallRule('${idx + 1}')">Delete</button>
            </div>
        `).join('')}
    `;

    // Display routes
    const routingTable = document.getElementById('routingTable');
    routingTable.innerHTML = `
        <div class="route-add-form">
            <h4>Add Route</h4>
            <div class="form-row">
                <label>Destination:</label>
                <input type="text" id="route-dest" placeholder="0.0.0.0/0 or 10.0.0.0/24" />
            </div>
            <div class="form-row">
                <label>Gateway:</label>
                <input type="text" id="route-gw" placeholder="10.0.0.1" />
            </div>
            <div class="form-row">
                <label>Interface:</label>
                <input type="text" id="route-iface" placeholder="eth0" />
                <button class="btn-primary" onclick="addRoute()">Add Route</button>
            </div>
        </div>
        <div class="route-table">
            ${data.routes && data.routes.length > 0 ? data.routes.map(route => `
                <div class="route-item">
                    <div>
                        <div class="route-label">Destination</div>
                        <div class="route-value">${route.destination}</div>
                    </div>
                    <div>
                        <div class="route-label">Gateway</div>
                        <div class="route-value">${route.gateway || '-'}</div>
                    </div>
                    <div>
                        <div class="route-label">Interface</div>
                        <div class="route-value">${route.interface || '-'}</div>
                    </div>
                    <div class="route-actions">
                        <button class="btn-danger" onclick="deleteRoute('${route.destination}')">Delete</button>
                    </div>
                </div>
            `).join('') : '<p style="padding: 12px; text-align: center; color: var(--muted-foreground);">No routes configured</p>'}
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

window.addFirewallRule = async function() {
    const port = prompt('Enter port:');
    if (!port) return;
    const protocol = prompt('Enter protocol (tcp/udp):', 'tcp');
    try {
        await api('/network/firewall/allow', {
            method: 'POST',
            body: JSON.stringify({ port, protocol }),
        });
        loadNetwork();
    } catch (error) {
        alert('Failed to add rule: ' + error.message);
    }
};

window.deleteFirewallRule = async function(ruleNum) {
    if (!confirm('Delete this rule?')) return;
    try {
        await api('/network/firewall/delete', {
            method: 'POST',
            body: JSON.stringify({ rule: ruleNum }),
        });
        loadNetwork();
    } catch (error) {
        alert('Failed to delete rule: ' + error.message);
    }
};

window.interfaceUp = async function(iface) {
    try {
        await api('/network/interface/up', {
            method: 'POST',
            body: JSON.stringify({ interface: iface }),
        });
        setTimeout(loadNetwork, 500);
    } catch (error) {
        alert('Failed to bring interface up: ' + error.message);
    }
};

window.interfaceDown = async function(iface) {
    if (!confirm(`Bring ${iface} down?`)) return;
    try {
        await api('/network/interface/down', {
            method: 'POST',
            body: JSON.stringify({ interface: iface }),
        });
        setTimeout(loadNetwork, 500);
    } catch (error) {
        alert('Failed to bring interface down: ' + error.message);
    }
};

window.setInterfaceIP = async function(iface, persistent) {
    const address = document.getElementById(`ip-${iface}`).value.trim();
    const gateway = document.getElementById(`gw-${iface}`).value.trim();
    
    if (!address) {
        alert('Please enter an IP address with mask (e.g., 10.0.0.10/24)');
        return;
    }
    
    try {
        await api('/network/interface/setip', {
            method: 'POST',
            body: JSON.stringify({ 
                interface: iface, 
                address, 
                gateway,
                persistent 
            }),
        });
        alert(persistent ? 'IP address set and saved to netplan' : 'IP address applied');
        setTimeout(loadNetwork, 500);
    } catch (error) {
        alert('Failed to set IP: ' + error.message);
    }
};

window.addRoute = async function() {
    const destination = document.getElementById('route-dest').value.trim();
    const gateway = document.getElementById('route-gw').value.trim();
    const iface = document.getElementById('route-iface').value.trim();
    
    if (!destination) {
        alert('Please enter a destination');
        return;
    }
    
    try {
        await api('/network/route/add', {
            method: 'POST',
            body: JSON.stringify({ destination, gateway, interface: iface }),
        });
        document.getElementById('route-dest').value = '';
        document.getElementById('route-gw').value = '';
        document.getElementById('route-iface').value = '';
        loadNetwork();
    } catch (error) {
        alert('Failed to add route: ' + error.message);
    }
};

window.deleteRoute = async function(destination) {
    if (!confirm(`Delete route to ${destination}?`)) return;
    try {
        await api('/network/route/delete', {
            method: 'POST',
            body: JSON.stringify({ destination }),
        });
        loadNetwork();
    } catch (error) {
        alert('Failed to delete route: ' + error.message);
    }
};

document.getElementById('btnRefreshNetwork')?.addEventListener('click', loadNetwork);

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
                    <th style="text-align: right;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td><strong>${user.username}</strong></td>
                        <td>${user.uid}</td>
                        <td>${user.home}</td>
                        <td>${user.shell}</td>
                        <td><span class="status ${user.locked ? 'status-inactive' : 'status-active'}">${user.locked ? 'Locked' : 'Active'}</span></td>
                        <td>
                            <div class="service-actions">
                                ${!user.locked ? `<button class="btn-danger" onclick="userAction('${user.username}', 'lock')">Lock</button>` : `<button class="btn-success" onclick="userAction('${user.username}', 'unlock')">Unlock</button>`}
                                <button class="btn-danger" onclick="userAction('${user.username}', 'delete')">Delete</button>
                            </div>
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
    container.innerHTML = configs.map(cfg => `
        <div class="config-item" onclick="loadConfigContent('${cfg.id}', this)">
            <h3>${cfg.name}</h3>
            <p>${cfg.description}</p>
        </div>
    `).join('');
}

window.loadConfigContent = async function(id, element) {
    try {
        const data = await api(`/config/${id}`);
        currentConfig = { id, content: data.content };
        
        document.querySelectorAll('.config-item').forEach(el => el.classList.remove('active'));
        if (element) {
            element.classList.add('active');
        }
        
        const editor = document.getElementById('configEditor');
        editor.innerHTML = `<textarea id="configTextarea">${data.content}</textarea>`;
        document.getElementById('btnSaveConfig').style.display = 'block';
    } catch (error) {
        alert('Failed to load config: ' + error.message);
    }
};

document.getElementById('btnSaveConfig')?.addEventListener('click', async () => {
    if (!currentConfig) return;
    
    const textarea = document.getElementById('configTextarea');
    const newContent = textarea.value;
    
    try {
        await api(`/config/${currentConfig.id}`, {
            method: 'POST',
            body: JSON.stringify({ content: newContent }),
        });
        alert('Configuration saved successfully');
        currentConfig.content = newContent;
    } catch (error) {
        alert('Failed to save config: ' + error.message);
    }
});

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
