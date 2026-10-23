const { resources, activeSessions, completedSessions, generateSessionId } = require('./data');
const { calculateBill } = require('./billing');


function getOccupiedCount(resourceId) {
  return activeSessions.filter(session => session.resourceId === resourceId).length;
}

function getResourcesWithAvailability() {
  return resources.map(resource => {
    const occupied = getOccupiedCount(resource.id);
    return {
      id: resource.id,
      name: resource.name,
      capacity: resource.capacity,
      occupied: occupied,
      available: resource.capacity - occupied,
      isFull: occupied >= resource.capacity,
      services: resource.services
    };
  });
}

function startUsage(userId, resourceId, serviceId) {
  if (!userId || !userId.trim()) {
    return { success: false, statusCode: 400, message: 'User ID is required.' };
  }
  if (!resourceId) {
    return { success: false, statusCode: 400, message: 'Resource ID is required.' };
  }

  const resource = resources.find(r => r.id === resourceId);
  if (!resource) {
    return { success: false, statusCode: 404, message: 'Resource not found.' };
  }

  if (!serviceId) {
    return { success: false, statusCode: 400, message: 'Service ID is required.' };
  }
  const service = resource.services.find(s => s.id === serviceId);
  if (!service) {
    return { success: false, statusCode: 400, message: 'Service not found for this resource.' };
  }

  const currentOccupied = getOccupiedCount(resourceId);
  if (currentOccupied >= resource.capacity) {
    return {
      success: false,
      statusCode: 409,
      message: `Capacity full! "${resource.name}" has reached its maximum limit of ${resource.capacity} user(s).`
    };
  }

  const existingActive = activeSessions.find(
    s => s.userId.toLowerCase() === userId.trim().toLowerCase() && s.resourceId === resourceId
  );
  if (existingActive) {
    return {
      success: false,
      statusCode: 400,
      message: `User "${userId}" is already actively using "${resource.name}".`
    };
  }

  const now = new Date();
  const newSession = {
    sessionId: generateSessionId(),
    userId: userId.trim(),
    resourceId: resource.id,
    resourceName: resource.name,
    serviceId: service.id,
    serviceName: service.name,
    firstHourPrice: service.firstHourPrice,
    additionalHourPrice: service.additionalHourPrice,
    startTime: now.toISOString(),
    startTimeMs: now.getTime(),
    status: 'ACTIVE'
  };

  activeSessions.push(newSession);

  return {
    success: true,
    statusCode: 201,
    message: `Usage started successfully for ${resource.name}.`,
    session: newSession,
    remainingCapacity: resource.capacity - getOccupiedCount(resource.id)
  };
}


function stopUsage(sessionId) {
  if (!sessionId) {
    return { success: false, statusCode: 400, message: 'Session ID is required.' };
  }

  const sessionIndex = activeSessions.findIndex(s => s.sessionId === sessionId);
  if (sessionIndex === -1) {
    return {
      success: false,
      statusCode: 404,
      message: 'Active session not found or already completed.'
    };
  }

  const session = activeSessions[sessionIndex];

  const endTimeMs = Date.now();
  const endTime = new Date(endTimeMs);

  const bill = calculateBill(
    session.startTimeMs,
    endTimeMs,
    session.firstHourPrice,
    session.additionalHourPrice
  );

  const completedRecord = {
    sessionId: session.sessionId,
    userId: session.userId,
    resourceId: session.resourceId,
    resourceName: session.resourceName,
    serviceName: session.serviceName,
    startTime: session.startTime,
    endTime: endTime.toISOString(),
    durationMinutes: bill.totalMinutes,
    billedHours: bill.billedHours,
    firstHourPrice: session.firstHourPrice,
    additionalHourPrice: session.additionalHourPrice,
    firstHourCharge: bill.firstHourCharge,
    additionalHours: bill.additionalHours,
    additionalHoursCharge: bill.additionalHoursCharge,
    totalAmount: bill.totalAmount,
    status: 'COMPLETED'
  };

  activeSessions.splice(sessionIndex, 1);

  completedSessions.unshift(completedRecord);

  return {
    success: true,
    statusCode: 200,
    message: `Usage stopped. Total bill: ₹${bill.totalAmount}. Capacity freed.`,
    bill: completedRecord
  };
}

function getActiveSessions() {
  return activeSessions;
}

function getCompletedSessions() {
  return completedSessions;
}

module.exports = {
  getOccupiedCount,
  getResourcesWithAvailability,
  startUsage,
  stopUsage,
  getActiveSessions,
  getCompletedSessions
};

