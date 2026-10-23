# Shared Resources Use & Billing System

## 1. About the Project

A miniature web app created for the W3Villa coding assignment. Usage sessions can be initiated and halted and bills generated according to the time spent on the resources.

## 2. Technologies Used

- Backend: Node.js built-in modules
- Frontend: HTML, CSS, JavaScript
- Storage: In-memory JavaScript arrays

## 3. Data Structures

- Resources: Stores resource details, capacity, and services.
- Active Sessions: Stores ongoing sessions.
- Complete Sessions: Stores completed sessions and billing information.
- Objects: Represent resources, services, and sessions.

## 4. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/resources` | Get resources and availability |
| GET | `/api/usage/active` | Retrieve active sessions |
| GET | `/api/usage/history` | Get the history of completed sessions and bills |
| POST | `/api/usage/start` | Start a usage session |
| POST | `/api/usage/stop` | To stop a session and add its bill |

### Sample Request Bodies

**Start a session - POST `/api/usage/start`**

```json
{
  "userId": "user1",
  "resourceId": "resource1",
  "serviceId": "service1"
}
```

**Stop a session - POST `/api/usage/stop`**

```json
{
  "sessionId": "session-id"
}
```

POST requests send JSON in the body of the request.

## 5. Logic and Billing

- Validates user, resource, and service details.
- Verifies capacity and disallows multiple live sessions for the same user against the same resource.
- Records session start and end times.
- Rounds partial hours up to the next hour billed.

Eg. 80 minutes of usage incurs ₹40 with first hour paid for at ₹30 and remaining hour paid for at ₹10.

## 6. Project Structure

```text
W3Villa/
├── server.js
├── data.js
├── usage.js
├── billing.js
├── index.html
├── style.css
├── app.js
└── README.md
```

## 7. How to Run

1. Install Node.js.
2. Open a terminal in the project folder.
3. Run `node server.js`.
4. Visit [http://localhost:3000](http://localhost:3000).

## 8. How to Test

- Begin and finish a session; check the bill.
- Attempt it on a fly.
- Submit an invalid service.
- Try starting a duplicate active session.
- Try stopping the same session twice.
- Check billing for partial-hour usage.

Try out the API endpoints with Postman.

## 9. Technical Assumptions

- Every resource offers a limited capacity and available services.
- The resource used must be the resource selected.
- Partial hours will be billed as full hours.
- The backend validates incoming requests.
- The data lives in the memory and when the server restarts the data is lost.
- No database or authentication is included.