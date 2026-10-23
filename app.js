
let cachedResources = [];
const notificationEl = document.getElementById('notification');
const resourcesGridEl = document.getElementById('resources-grid');
const resourceSelectEl = document.getElementById('resource-select');
const serviceSelectEl = document.getElementById('service-select');
const startFormEl = document.getElementById('start-usage-form');
const userIdInputEl = document.getElementById('user-id');
const activeSessionsBodyEl = document.getElementById('active-sessions-body');
const historySessionsBodyEl = document.getElementById('history-sessions-body');

function showNotification(message, type = 'success') {
  notificationEl.textContent = message;
  notificationEl.className = `notification ${type}`;
  notificationEl.classList.remove('hidden');

  setTimeout(() => {
    notificationEl.classList.add('hidden');
  }, 5000);
}

function formatDateTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

async function fetchData() {
  try {
    const resourcesResponse = await fetch('/api/resources');
    const activeResponse = await fetch('/api/usage/active');
    const historyResponse = await fetch('/api/usage/history');

    const resourcesData = await resourcesResponse.json();
    const activeData = await activeResponse.json();
    const historyData = await historyResponse.json();

    if (resourcesData.success) {
      cachedResources = resourcesData.resources;
      renderResources(cachedResources);
      populateResourceDropdown(cachedResources);
    }

    if (activeData.success) {
      renderActiveSessions(activeData.activeSessions);
    }

    if (historyData.success) {
      renderHistory(historyData.history);
    }
  } catch (error) {
    showNotification('Error fetching data: ' + error.message, 'error');
  }
}

function renderResources(resources) {
  if (!resources || resources.length === 0) {
    resourcesGridEl.innerHTML = '<p class="empty-state">No resources configured.</p>';
    return;
  }

  resourcesGridEl.innerHTML = resources.map(resource => {
    const isFull = resource.available <= 0;
    const badgeClass = isFull ? 'badge-full' : 'badge-available';
    const badgeText = isFull ? 'Full' : `${resource.available} Available`;
    const service = resource.services[0];

    let pricingText = 'Pricing not configured';
    if (service) {
      pricingText = `1st hr: ₹${service.firstHourPrice} | Add'l hr: ₹${service.additionalHourPrice}`;
    }
    return `
      <div class="resource-card">
        <div class="resource-card-header">
          <span class="resource-name">${escapeHtml(resource.name)}</span>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="capacity-stats">
          Capacity: <strong>${resource.capacity}</strong> |
          Occupied: <strong>${resource.occupied}</strong> |
          Free: <strong>${resource.available}</strong>
        </div>
        <div class="service-pricing">
          <strong>${escapeHtml(service ? service.name : 'Service')}:</strong>
          ${pricingText}
        </div>
      </div>
    `;
  }).join('');
}

function populateResourceDropdown(resources) {
  const selectedId = resourceSelectEl.value;
  resourceSelectEl.innerHTML = '<option value="">-- Choose a Resource --</option>';
  resources.forEach(resource => {
    const option = document.createElement('option');
    option.value = resource.id;
    option.textContent = `${resource.name} (${resource.available > 0 ? resource.available + ' free' : 'FULL'})`;
    resourceSelectEl.appendChild(option);
  });
  if (resources.some(resource => resource.id === selectedId)) {
    resourceSelectEl.value = selectedId;
  }
}

resourceSelectEl.addEventListener('change', () => {
  const resourceId = resourceSelectEl.value;
  serviceSelectEl.innerHTML = '<option value="">-- Select Service --</option>';
  const resource = cachedResources.find(item => item.id === resourceId);
  if (!resource) return;
  resource.services.forEach(service => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = `${service.name} (1st hr: ₹${service.firstHourPrice}, Add'l hr: ₹${service.additionalHourPrice})`;
    serviceSelectEl.appendChild(option);
  });
  if (resource.services.length > 0) {
    serviceSelectEl.value = resource.services[0].id;
  }
});

startFormEl.addEventListener('submit', async event => {
  event.preventDefault();
  const userId = userIdInputEl.value.trim();
  const resourceId = resourceSelectEl.value;
  const serviceId = serviceSelectEl.value;
  if (!userId) {
    showNotification('Please enter a User ID.', 'error');
    return;
  }
  if (!resourceId) {
    showNotification('Please select a Resource.', 'error');
    return;
  }
  if (!serviceId) {
    showNotification('Please select a Service.', 'error');
    return;
  }
  try {
    const response = await fetch('/api/usage/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, resourceId, serviceId })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showNotification(data.message || 'Failed to start usage.', 'error');
      return;
    }
    showNotification(data.message, 'success');
    userIdInputEl.value = '';
    fetchData();
  } catch (error) {
    showNotification('Network error: ' + error.message, 'error');
  }
});

function renderActiveSessions(sessions) {
  if (!sessions || sessions.length === 0) {
    activeSessionsBodyEl.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">No active sessions. Start one above!</td>
      </tr>
    `;
    return;
  }

  activeSessionsBodyEl.innerHTML = sessions.map(session => `
    <tr>
      <td><strong>${escapeHtml(session.sessionId)}</strong></td>
      <td>${escapeHtml(session.userId)}</td>
      <td>${escapeHtml(session.resourceName)}</td>
      <td>${escapeHtml(session.serviceName)}</td>
      <td>${formatDateTime(session.startTime)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="stopSession('${escapeHtml(session.sessionId)}')">
          Stop Usage
        </button>
      </td>
    </tr>
  `).join('');
}

async function stopSession(sessionId) {
  try {
    const response = await fetch('/api/usage/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showNotification(data.message || 'Failed to stop session.', 'error');
      return;
    }

    const bill = data.bill;
    const message = `Stopped ${bill.sessionId} for ${bill.userId}! Duration: ${bill.durationMinutes} min (${bill.billedHours} hr billed). Total Bill: ₹${bill.totalAmount}`;

    showNotification(message, 'success');
    fetchData();
  } catch (error) {
    showNotification('Network error: ' + error.message, 'error');
  }
}

function renderHistory(history) {
  if (!history || history.length === 0) {
    historySessionsBodyEl.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">No completed sessions yet.</td>
      </tr>
    `;
    return;
  }

  historySessionsBodyEl.innerHTML = history.map(item => {
    let formula = `₹${item.firstHourCharge} (1st hr)`;
    if (item.billedHours > 1) {
      formula = `₹${item.firstHourCharge} + (${item.additionalHours} × ₹${item.additionalHourPrice})`;
    }
    return `
      <tr>
        <td><strong>${escapeHtml(item.sessionId)}</strong></td>
        <td>${escapeHtml(item.userId)}</td>
        <td>${escapeHtml(item.resourceName)}</td>
        <td>${item.durationMinutes} min</td>
        <td>${item.billedHours} hr(s)</td>
        <td><code>${formula}</code></td>
        <td class="bill-amount">₹${item.totalAmount}</td>
        <td>${formatDateTime(item.endTime)}</td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(value) {
  if (!value) return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  fetchData();
});
