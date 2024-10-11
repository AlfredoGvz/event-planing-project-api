const {
  userById,
  signUpUser,
  signInUser,
  logOutUser,
  delUser,
  getAllEvents,
  myHostedEvetns,
  bookedEvents,
  getEvent,
  addNewEvent,
  delEvent,
  allAttendees,
  attendEvent,
  makePayment,
  addAndRedirect,
  storeToken,
  eventAdded,
} = require("./models");

// ========== Authentication ==========//
async function getUser(req, res) {
  try {
    const response = await userById();
    res.status(200).send({ data: response });
  } catch (error) {
    console.log(error);
    res.send({ error: error });
  }
}

async function userSignUp(req, res, next) {
  try {
    const { user_name, user_email, password, user_role } = req.body;
    console.log(req.body);

    // Call the signUpUser function
    const newUser = await signUpUser(
      user_name,
      user_email,
      password,
      user_role
    );

    // If successful, send a success response
    res.status(200).send({ msg: newUser.msg });
  } catch (error) {
    console.log(error, "line 48 controllers");
    next(error);
    // Log the error for debugging
  }
}

async function userSignIn(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).send({ msg: "Email and password are required" });
    }

    const logIn = await signInUser(email, password);
    res.status(200).send({ user: logIn });
  } catch (error) {
    // Log the error for debugging
    console.log("Sign In error:", error);

    // Send an appropriate error response
    res
      .status(error.status || 500)
      .send({ msg: error.msg || "Internal Server Error" });
  }
}

async function userSignOut(req, res) {
  try {
    const signedOut = await logOutUser();
    res.status(200).send({ msg: signedOut.msg });
  } catch (error) {
    console.log(error);
  }
}

async function userDelete(req, res) {
  try {
    const data = await delUser();
    res.status(200).send({ msg: data });
  } catch (error) {
    console.log(error);
  }
}

// ========== EVENTS ==========//

async function getEvents(req, res) {
  try {
    const {
      organizer_id,
      organizer_name,
      start_time,
      end_time,
      date,
      price,
      post_code,
      city,
      page,
      orderBy,
      sortDirection,
    } = req.query;
    const allEvents = await getAllEvents(
      organizer_id,
      organizer_name,
      start_time,
      end_time,
      date,
      price,
      post_code,
      city,
      page,
      orderBy,
      sortDirection
    );
    console.log("events go here");
    res.status(200).send(allEvents);
  } catch (error) {
    res.send({ events: error });
  }
}

async function getEventById(req, res) {
  try {
    const { event_id } = req.params;
    const event = await getEvent(event_id);

    res.status(200).send({ event: event });
  } catch (error) {
    res.send({ events: error });
  }
}

async function getHostedEvents(req, res) {
  try {
    const hostedEvents = await myHostedEvetns();
    res.status(200).send({ myEvents: hostedEvents });
  } catch (error) {}
}

async function getBookedEvents(req, res) {
  try {
    const myBookedEvents = await bookedEvents();
    console.log(myBookedEvents);
    res.status(200).send({ userBookedEvents: myBookedEvents });
  } catch (error) {
    console.log(error);
  }
}

async function newEvent(req, res) {
  try {
    const {
      title,
      description,
      start_time,
      end_time,
      date,
      venue,
      price,
      address,
      post_code,
      city,
    } = req.body;

    const data = await addNewEvent(
      title,
      description,
      start_time,
      end_time,
      date,
      venue,
      price,
      address,
      post_code,
      city
    );
    res.status(data.status).send(data.data);
  } catch (error) {
    res.status(data.status).send(data.data);
  }
}

async function eventDel(req, res) {
  try {
    const { event_id } = req.params;
    const data = await delEvent(event_id);
    res.status(200).send({ msg: data.msg });
  } catch (error) {
    res.status(error.status).send({ msg: error.msg });
  }
}

// ========== ATTENDEES ==========//
async function getAttendees(req, res) {
  try {
    const { event_id } = req.params;
    const attendees = await allAttendees(event_id);
    res.status(200).send({ allAattendees: attendees });
  } catch (error) {
    // res.status(error.status).send(error.result);
    console.log(error);
  }
}

async function registerToEvent(req, res) {
  try {
    const { event_id } = req.params;
    const data = await attendEvent(event_id);
    console.log(data.toSendBack);
    res.status(200).send({ attendee: data.toSendBack });
  } catch (error) {
    res.status(400).send({ msg: error.msg });
  }
}

async function completePayment(req, res) {
  try {
    const data = await makePayment();
  } catch (error) {
    res.status(400).send({ msg: error.msg });
  }
}

// ========== GOOGLE CALENDAR ==========//

async function addCalendar(req, res) {
  try {
    console.log();
    const add = await addAndRedirect();
    res.status(200).send({ calendarURL: add });
  } catch (error) {
    console.log(error);
  }
}

async function sendToken(req, res) {
  try {
    console.log(req.query);
    const code = req.query.code;
    const sendTokenDb = await storeToken(code);
    res.redirect(sendTokenDb);
  } catch (error) {
    console.log(error);
  }
}

async function addEventToCalendar(req, res) {
  try {
    const { event_id } = req.params;
    const data = await eventAdded(res, event_id);
    res.status(200).send(data);
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
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
  getAttendees,
  registerToEvent,
  completePayment,
  addCalendar,
  sendToken,
  addEventToCalendar,
};
