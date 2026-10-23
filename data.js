const resources = [
  {
    id: 'res-1',
    name: 'Meeting Room A',
    capacity: 2,
    services: [
      {
        id: 'srv-1',
        name: 'Conference & Meeting',
        firstHourPrice: 30,
        additionalHourPrice: 10
      }
    ]
  },
  {
    id: 'res-2',
    name: 'Gym Treadmill',
    capacity: 1,
    services: [
      {
        id: 'srv-2',
        name: 'Cardio Fitness Session',
        firstHourPrice: 30,
        additionalHourPrice: 10
      }
    ]
  },
  {
    id: 'res-3',
    name: 'Workstation Desk',
    capacity: 3,
    services: [
      {
        id: 'srv-3',
        name: 'Dedicated Workspace',
        firstHourPrice: 30,
        additionalHourPrice: 10
      }
    ]
  }
];

const activeSessions = [];

const completedSessions = [];

let sessionCounter = 1;

function generateSessionId() {
  return `SES-${sessionCounter++}`;
}

module.exports = {
  resources,
  activeSessions,
  completedSessions,
  generateSessionId
};

