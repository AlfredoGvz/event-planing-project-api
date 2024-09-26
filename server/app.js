const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

const {
  getUser,
  userSignUp,
  userSignIn,
  userSignOut,
  userDelete,
  getEvents,
  getEventById,
  getHostedEvents,
  getBookedEvents,
  newEvent,
  eventDel,
  registerToEvent,
  completePayment,
  getAttendees,
  addCalendar,
  sendToken,
  addEventToCalendar,
} = require("./mvc/controllers.js");
const { customErrorHandler } = require("./customErrors.js");

// ========== PING SIGNAL ==========//
app.get("/api/ping", (req, res) => {
  res.sendStatus(200);
});

// ========== FIREBASE ==========//
app.get("/api/current_user", getUser);
app.post("/api/new_user", userSignUp);
app.post("/api/sign_in", userSignIn);
app.post("/api/sign_out", userSignOut);
app.delete("/api/delete_user", userDelete);

// ========== EVENTS ==========//
app.get("/api/get_events", getEvents);
app.get("/api/get_events/:event_id", getEventById);
app.get("/api/get_hosted_events", getHostedEvents);
app.get("/api/get_booked_events", getBookedEvents);
app.post("/api/new_event", newEvent);
app.delete("/api/:event_id/delete_event", eventDel);
// ========== ATTENDEES ==========//
app.get("/api/:event_id/get_attendees_by_event_id", getAttendees);
app.post("/api/:event_id/register", registerToEvent);
app.post("/api/webhooks/complete_payment", completePayment);

// ========== GOOGLE CALENDAR ==========//
app.get("/api/google_auth/add_calendar", addCalendar);
app.get("/api/google_auth/authenticated", sendToken);
app.get("/api/google_calendar/:event_id/add_event", addEventToCalendar);

app.use(customErrorHandler);
module.exports = app;
