const {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} = require("../../firebase/fb_connection");
const db = require("../../database/connection");
const format = require("pg-format");
const validator = require("validator");
const { isLoggedIn, oauth2Client } = require("../utilities");
const stripe = require("stripe")(process.env.STRIPE_STR);
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const moment = require("moment");

// ========== Authentication ==========//
async function userById(params) {
  try {
    await isLoggedIn(auth); //Verify that user is logged in
    const currentUser = auth.currentUser;
    const user_fb_local_id = currentUser.uid;
    const sqlQuery = "SELECT * FROM users WHERE user_fb_local_id = $1;";
    const queryValue = [user_fb_local_id];
    const user = await db.query(sqlQuery, queryValue);
    console.log(user, "model line 26");
    return user.rows;
  } catch (error) {
    return error;
  }
}

async function signUpUser(user_name, user_email, password, user_role) {
  try {
    if (!user_name || !user_email || !password || !user_role) {
      return Promise.reject({
        status: 400,
        msg: "Looks like some details are missing",
      });
    }

    if (!validator.isEmail(user_email)) {
      return Promise.reject({
        status: 400,
        msg: "Invalid email address",
      });
    }
    if (!validator.isLength(user_name, { min: 1, max: 30 })) {
      return Promise.reject({
        status: 400,
        msg: "User name must be between 1 and 30 characters",
      });
    }
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      user_email,
      password
    );
    const user = userCredential.user;

    // Send the verification email
    await sendEmailVerification(user);
    console.log("Verification email sent. Please check your inbox.");
    const currentUser = auth.currentUser;
    const user_fb_local_id = currentUser.uid;
    // Sign out the user so they cannot proceed until they verify their email
    await auth.signOut();
    const values = [user_name, user_email, user_fb_local_id, user_role];
    const sql = format(
      `INSERT INTO users (user_name, user_email,user_fb_local_id, user_role) VALUES (%L, %L, %L, %L)`,
      ...values
    );

    await db.query(sql);

    return { msg: "Verification email sent" };
  } catch (error) {
    // Handle specific Firebase authentication errors
    console.log(error, "line 79 models");

    if (error.code === "auth/missing-password") {
      return Promise.reject({
        status: 400,
        msg: "Missing password",
      });
    } else if (error.code === "auth/email-already-in-use") {
      return Promise.reject({
        status: 409,
        msg: "Email is already in use",
      });
    } else {
      console.log(error);
      // Handle other errors
      return Promise.reject({
        status: 500,
        msg: "An unexpected error occurred",
      });
    }
  }
}

async function signInUser(email, password) {
  try {
    if (!validator.isEmail(email)) {
      return Promise.reject({
        status: 400,
        msg: "Invalid email address",
      });
    }
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    if (user.emailVerified) {
      // Allow access to the app
      console.log("User email is verified.");
      // You could return user data or a success message here
      const usrDBQuery = "SELECT * FROM users WHERE user_fb_local_id = $1;";
      const userInDB = await db.query(usrDBQuery, [user.uid]);
      const dataTosend = {
        user: user,
        userInDB: userInDB.rows,
      };
      return { dataTosend };
    } else {
      await auth.signOut(); // Sign out the user if not verified
      throw new Error("Please verify your email."); // This will be caught below
    }
  } catch (error) {
    // Handle specific Firebase authentication errors
    console.error("Error during sign-in:", error);

    if (error.code === "auth/missing-password") {
      return Promise.reject({
        status: 400,
        msg: "Missing password",
      });
    } else if (error.message === "Please verify your email.") {
      // Handling custom error for unverified email
      return Promise.reject({
        status: 403,
        msg: error.message,
      });
    } else {
      // Handle other unexpected errors
      return Promise.reject({
        status: 500,
        msg: error,
      });
    }
  }
}

async function logOutUser() {
  try {
    await signOut(auth);
    return { msg: "User signed out" };
  } catch (error) {
    console.log(error);
  }
}

async function delUser() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No user is currently logged in.");
    }
    const user_fb_local_id = currentUser.uid;
    console.log(user_fb_local_id, "line 164");
    // Access 'uid' directly from 'currentUser'
    const sql = `DELETE FROM users WHERE user_fb_local_id = $1`;
    await db.query(sql, [user_fb_local_id]);
    await currentUser.delete();
    return { msg: "User deleted successfully." };
  } catch (error) {
    console.error("Error during user deletion:", error);
  }
}

// ========== EVENTS ==========//
async function getAllEvents(
  organizer_id,
  organizer_name,
  start_time,
  end_time,
  date,
  price,
  post_code,
  city,
  page,
  orderBy, // Default to sorting by date
  sortDirection // Default to ascending order
) {
  try {
    // Initialize whereClauses and queryParams
    let whereClauses = [];
    let queryParams = [];
    let paramIndex = 1;
    console.log(orderBy.split(","), sortDirection, "model");

    // Append conditions to whereClauses and queryParams
    if (organizer_id) {
      whereClauses.push(`organizer_id = $${paramIndex++}`);
      queryParams.push(organizer_id);
    }

    if (organizer_name) {
      whereClauses.push(`organizer_name = $${paramIndex++}`);
      queryParams.push(organizer_name);
    }

    if (start_time) {
      whereClauses.push(`start_time = $${paramIndex++}`);
      queryParams.push(start_time);
    }

    if (end_time) {
      whereClauses.push(`end_time = $${paramIndex++}`);
      queryParams.push(end_time);
    }

    if (date) {
      whereClauses.push(`date = $${paramIndex++}`);
      queryParams.push(date);
    }

    if (price) {
      whereClauses.push(`price = $${paramIndex++}`);
      queryParams.push(price);
    }

    if (post_code) {
      whereClauses.push(`post_code = $${paramIndex++}`);
      queryParams.push(post_code);
    }

    if (city) {
      whereClauses.push(`city = $${paramIndex++}`);
      queryParams.push(city);
    }

    // Combine WHERE clauses
    let whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Initialize orderByFields and process the orderBy parameter
    let orderByFields = [];

    orderBy.split(",").forEach((field) => {
      switch (field.trim()) {
        case "city":
          orderByFields.push("city");
          break;
        case "price":
          orderByFields.push("price");
          break;
        case "organizer_name":
          orderByFields.push("organizer_name");
          break;
        case "date":
          // Add date sorting based on year, month, and day
          orderByFields.push(
            `EXTRACT(YEAR FROM TO_DATE(date, 'DD-MM-YYYY'))`,
            `EXTRACT(MONTH FROM TO_DATE(date, 'DD-MM-YYYY'))`,
            `EXTRACT(DAY FROM TO_DATE(date, 'DD-MM-YYYY'))`
          );
          break;
        default:
          console.warn(`Unsupported orderBy field: ${field}`);
      }
    });

    // If no valid fields provided, default to sorting by date
    if (orderByFields.length === 0) {
      orderByFields.push(
        `EXTRACT(YEAR FROM TO_DATE(date, 'DD-MM-YYYY'))`,
        `EXTRACT(MONTH FROM TO_DATE(date, 'DD-MM-YYYY'))`,
        `EXTRACT(DAY FROM TO_DATE(date, 'DD-MM-YYYY'))`
      );
    }

    // Join the fields into a valid SQL ORDER BY clause
    let orderByClause = `ORDER BY ${orderByFields.join(", ")} ${sortDirection}`;

    // Calculate OFFSET based on the page number
    const offset = (page - 1) * 10;
    queryParams.push(offset); // Push offset to queryParams

    // Construct the final SQL query with LIMIT and OFFSET
    const sqlGetAllEvents = `
      SELECT * FROM events
      ${whereClause}
      ${orderByClause}
      LIMIT 10
      OFFSET $${paramIndex} -- paramIndex points to the offset parameter
    `;

    // Execute the query
    const events = await db.query(sqlGetAllEvents, queryParams);

    // Optional: Execute another query without limit/offset to get all events
    const sqlGetAllWithoutLimit = `
      SELECT * FROM events
      ${whereClause}
      ${orderByClause}
    `;
    const allEvents = await db.query(sqlGetAllWithoutLimit);

    return { events: events.rows, allEvenst: allEvents.rows };
  } catch (error) {
    console.error("Error during fetching events:", error.message);
    return { error: error.message }; // Sending a meaningful error message
  }
}

async function getEvent(event_id) {
  try {
    if (validator.isAlphanumeric(event_id)) {
      const sqlGetEvent = format(
        `SELECT * FROM events WHERE event_id = ${event_id}`
      );
      const events = await db.query(sqlGetEvent);
      return events.rows;
    } else {
      // Handle invalid or potentially malicious input
      res.status(400).send("Invalid event ID");
    }

    // Execute the query and return results
  } catch (error) {
    console.error("Error during fetching events:", error.message);
    return { error: error.message }; // Sending a meaningful error message
  }
}

async function myHostedEvetns() {
  try {
    await isLoggedIn(auth); //Verify that user is logged in
    const currentUser = auth.currentUser;
    const user_fb_local_id = currentUser.uid;
    // Get user in database and get their user_id
    const queryText = `SELECT user_id FROM users WHERE user_fb_local_id = $1;`;
    const queryValues = [user_fb_local_id];
    const user_id_db = await db.query(queryText, queryValues);
    const user_id = user_id_db.rows[0].user_id;
    //Get events where organizer_id is equal to user_id in db
    const queryTextHostedEvents = `SELECT * FROM events WHERE organizer_id = $1;`;
    const queryValue = [user_id];
    const hosted_events = await db.query(queryTextHostedEvents, queryValue);
    return hosted_events.rows;
  } catch (error) {
    console.log(error);
  }
}

async function bookedEvents() {
  try {
    await isLoggedIn(auth); //Verify that user is logged in
    const currentUser = auth.currentUser;
    const user_fb_local_id = currentUser.uid;
    // Get user in database and get their user_id
    const queryText = `SELECT user_id FROM users WHERE user_fb_local_id = $1;`;
    const queryValues = [user_fb_local_id];
    const user_id_db = await db.query(queryText, queryValues);
    const user_id = user_id_db.rows[0].user_id;
    //Get event ids from attendees table
    const queryEventIdText = `SELECT * FROM attendees WHERE user_id = $1;`;
    const queryValueUserID = [user_id];
    const attendeeInfo = await db.query(queryEventIdText, queryValueUserID);
    // Extract unique event IDs from the attendeeInfo
    const eventIds = [
      ...new Set(attendeeInfo.rows.map((event) => event.event_id)),
    ];

    const queryEventDetails = `SELECT * FROM events WHERE event_id = ANY($1::int[]);`; //ANY($1::int[]) in the query allows you to match multiple event IDs from the eventIds array.
    const eventDetails = await db.query(queryEventDetails, [eventIds]);
    return eventDetails.rows;
  } catch (error) {
    console.log(error);
  }
}

async function addNewEvent(
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
) {
  try {
    if (
      !title ||
      !description ||
      !start_time ||
      !end_time ||
      !date ||
      !venue ||
      !price ||
      !address ||
      !post_code ||
      !city
    )
      return {
        status: 400,
        message: "Missing information.",
      };
    //data sanitation
    title = validator.trim(validator.escape(title));
    description = validator.trim(validator.escape(description));
    start_time = validator.trim(validator.escape(start_time));
    end_time = validator.trim(validator.escape(end_time));
    date = validator.trim(validator.escape(date));
    venue = validator.trim(validator.escape(venue));
    price = validator.trim(price); // Since it's text, but it should represent a numeric value
    address = validator.trim(validator.escape(address));
    post_code = validator.trim(validator.escape(post_code));
    city = validator.trim(validator.escape(city));
    const currentUser = auth.currentUser;
    const currentUserId = currentUser.uid;
    // First query to get the organizer name
    const queryText = `SELECT user_name, user_id FROM users WHERE user_fb_local_id = $1;`;
    const queryValues = [currentUserId];

    const dataToGet = await db.query(queryText, queryValues);

    if (dataToGet.rows.length === 0) {
      return {
        status: 404,
        message: "No user found with the provided user_fb_local_id.",
      };
    }
    const organizer_name = dataToGet.rows[0].user_name;
    const organizer_id = dataToGet.rows[0].user_id;

    // Second query to insert event data
    const eventValues = [
      organizer_id,
      organizer_name, // $1
      title, // $2
      description, // $3
      start_time, // $4
      end_time, // $5
      date, // $6
      venue, // $7
      price, // $8
      address, // $9
      post_code, // $10
      city, // $11
    ];
    console.log(eventValues, "values line 312 models");
    const queryInfo = `
    INSERT INTO events (
         organizer_id,
         organizer_name, 
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *;`; // Add RETURNING * if you want to get the inserted row back

    const result = await db.query(queryInfo, eventValues);
    console.log(result.rows[0], "values line 331 models");

    return { status: 201, data: result.rows[0] };
  } catch (error) {
    console.error("Error executing query:", error.message);
    return {
      status: 500,
      message: "Internal Server Error. Could not add new event.",
    };
  }
}

async function delEvent(event_id) {
  try {
    await isLoggedIn(auth); //Verify that user is logged in
    const currentUser = auth.currentUser;
    const user_fb_local_id = currentUser.uid;
    console.log(user_fb_local_id, "uid");

    const sqlForId = format(
      `SELECT user_id FROM users WHERE user_fb_local_id = %L`,
      user_fb_local_id
    );

    const dataToDel = await db.query(sqlForId);
    const organizer_id = dataToDel.rows[0].user_id;
    if (!event_id || !organizer_id) {
      return Promise.reject({
        status: 400,
        msg: "Missing parameters in order to delete event.",
      });
    }
    const sqlChecking = format(
      `SELECT * FROM events WHERE event_id = %L;`,
      event_id
    );
    const eventExists = await db.query(sqlChecking);

    if (eventExists.rows.length === 0) {
      return Promise.reject({
        status: 400,
        msg: "Event does not exist.",
      });
    }
    const sqlForDel = format(
      ` DELETE FROM events WHERE organizer_id = %LAND event_id = %L`,
      organizer_id,
      event_id
    );
    const deleted = await db.query(sqlForDel);

    return { msg: "Event deleted successfully." };
  } catch (error) {
    console.error("Error during user deletion:", error.message);
  }
}

// ========== ATTENDEES ==========//
async function allAttendees(event_id) {
  try {
    await isLoggedIn(auth);
    const sqlAttendees = format(
      `SELECT * FROM attendees WHERE event_id = %L`,
      event_id
    );
    const query = await db.query(sqlAttendees);
    console.log(query);
    return query.rows;
  } catch (error) {
    console.log(error);
  }
}
async function attendEvent(event_id) {
  try {
    await isLoggedIn(auth);
    const currenUser = auth.currentUser;
    const uid = currenUser.uid;

    // Fetch event details
    const sqlForEvent = format(
      `SELECT * FROM events WHERE event_id = %L`,
      event_id
    );
    const eventRows = await db.query(sqlForEvent);
    const event = eventRows.rows[0];

    let eventPrice;
    const dataInsert = [];

    // Fetch user details
    const sqlUser = format(
      `SELECT user_id, user_name, user_email FROM users WHERE user_fb_local_id = %L;`,
      uid
    );
    const userData = await db.query(sqlUser);
    const userDataRow = userData.rows[0];

    if (event.price === "Free") {
      dataInsert.push(userDataRow.user_id);
      dataInsert.push(userDataRow.user_name);
      dataInsert.push(userDataRow.user_email);
      dataInsert.push(event_id);
      dataInsert.push(0);
      dataInsert.push("Completed");
      eventPrice = 0;
    } else {
      dataInsert.push(userDataRow.user_id);
      dataInsert.push(userDataRow.user_name);
      dataInsert.push(userDataRow.user_email);
      dataInsert.push(event_id);
      dataInsert.push(0);
      dataInsert.push("Incompleted");
      eventPrice = Number(event.price) * 100; // Convert to smallest currency unit (cents)
    }

    const sqlInsert = `
      INSERT INTO attendees(user_id, user_name, user_email, event_id, ticket_number, payment_status)
      VALUES($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    // Create the Stripe price object
    const price = await stripe.prices.create({
      currency: "gbp",
      unit_amount: eventPrice,
      product_data: {
        name: event.title,
      },
    });

    const price_id = price.id;

    // Insert attendee into the database
    const addedAttendee = await db.query(sqlInsert, dataInsert);
    const attendeeData = addedAttendee.rows[0];

    // Create the Stripe checkout session with metadata
    const checkoutSession = await stripe.checkout.sessions.create({
      success_url: "https://plan-me-lp.netlify.app/dashboard",
      cancel_url: "https://plan-me-lp.netlify.app/",
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        attendee_id: attendeeData.attendee_id,
        user_id: attendeeData.user_id,
        user_name: attendeeData.user_name,
        event_id: event_id,
        payment_status: "Incompleted",
      },
    });
    const toSendBack = {
      attendeeAdata: attendeeData,
      checkoutSession: checkoutSession,
    };
    console.log(toSendBack);
    return { toSendBack };
  } catch (error) {
    return Promise.reject({ status: 400, msg: error.msg });
  }
}

async function makePayment() {
  try {
    await isLoggedIn(auth);
    const sessions = await stripe.checkout.sessions.list({
      limit: 3,
    });
    const session = sessions.data[0].metadata;
    console.log(session);
    const userId = session.user_id;
    const attendee_id = session.attendee_id;
    const eventId = session.event_id;
    const paymentStatus = "Completed"; // Update payment status
    const sqlUpdate = format(
      `
        UPDATE attendees
        SET payment_status = %L
        WHERE attendee_id = %L AND user_id = %L AND event_id = %L 
        RETURNING *;
      `,
      ...[paymentStatus, attendee_id, userId, eventId]
    );
    const updated = await db.query(sqlUpdate);
    console.log(updated);
  } catch (error) {
    console.log(error);
  }
}

// ========== GOOGLE CALENDAR ==========//

/*
addAndRedirect()
Purpose: Generates an authentication URL where users can sign in with their Google accounts and grant permission for the app to access their Google Calendar and user profile data.
How: It initializes an OAuth2 client using Google credentials, then creates a URL with the required scopes (calendar access, email, and profile) and redirects the user to Google for authentication.
*/

async function addAndRedirect() {
  try {
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
    });
    console.log(url);
    return url;
  } catch (error) {
    console.log(error, "error adding calendar");
  }
}

/*
storeToken()
Purpose: After the user authenticates, this function stores the authentication tokens (access and refresh tokens) in the database for future use. It associates these tokens with the current user in your app.
How:
It retrieves the current user's unique identifier (user_fb_local_id) and queries the database for the associated user ID.
It exchanges the authorization code (received after the user authenticates) for access and refresh tokens from Google.
If tokens already exist in the database, it skips adding them; otherwise, it inserts them and updates the user’s calendar activation status.
Finally, it redirects the user to the events page.
*/
async function storeToken(code) {
  console.log(code, "line 700");
  try {
    await isLoggedIn(auth);
    const currentUser = auth.currentUser;
    const currentUserId = currentUser.uid;
    console.log(currentUser);
    // Get user_id from the database
    const queryText = `SELECT user_id FROM users WHERE user_fb_local_id = $1;`;
    const queryValues = [currentUserId];
    const dataToGet = await db.query(queryText, queryValues);
    const user_id = dataToGet.rows[0].user_id;

    // Set up OAuth client and get tokens using authorization code
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    const { tokens } = await oauth2Client.getToken(code);
    console.log(tokens, "line 719 storeToken");

    oauth2Client.setCredentials(tokens);
    console.log(tokens, "line 722 storeToken");

    // Get user info from Google API
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    // Check if the refresh token is available
    if (!tokens.refresh_token) {
      console.log("Warning: No refresh token received.");
    }

    // Prepare and execute the query to insert tokens into the database
    const sqlQuery = `
      INSERT INTO google_tokens 
      (user_id, google_account_email, access_token, refresh_token, scope, token_type, expiry_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const insert = await db.query(sqlQuery, [
      user_id,
      email,
      tokens.access_token,
      tokens.refresh_token || null, // Handle missing refresh token
      tokens.scope,
      tokens.token_type,
      tokens.expiry_date,
    ]);

    // Update the user's calendar_activated status
    const queryUpdateCal = `
      UPDATE users
      SET calendar_activated = $1
      WHERE user_fb_local_id = $2
      RETURNING *;
    `;
    const activateCalendar = true;
    const updatedUser = await db.query(queryUpdateCal, [
      activateCalendar,
      currentUserId,
    ]);

    console.log("Authenticated user's email line 767:", insert.rows[0]);
    return "http://localhost:5173/";
  } catch (error) {
    console.log("Error storing token:", error);
  }
}

/*
eventAdded()
Purpose: Adds an event from your app to the user's Google Calendar, using previously stored tokens for authentication.
How:
It retrieves the event details and the current user's ID from the database.
It fetches the stored Google tokens for the user. If no tokens are found, it initiates the OAuth2 process to get new ones.
If valid tokens are found, it creates an OAuth2 client, uses it to authenticate with Google, and formats the event details (title, location, date, time) to match Google Calendar’s format.
The event is then added to the user's Google Calendar via the Google Calendar API.
*/
async function eventAdded(res, event_id) {
  try {
    const currentUser = auth.currentUser;
    const currentUserId = currentUser.uid;

    // Get event by id
    const sqlGetQuery = format(
      `SELECT * FROM events WHERE event_id = %L;`,
      event_id
    );
    const selectedEvent = await db.query(sqlGetQuery);
    const event = selectedEvent.rows[0];

    // Get user id
    const sqlUserQuery = format(
      `SELECT user_id FROM users WHERE user_fb_local_id = %L;`,
      currentUserId
    );
    const user = await db.query(sqlUserQuery);
    const uid = user.rows[0].user_id;

    // Log to check if the user ID is correct
    console.log("Database User ID line 802:", uid);

    // Get google tokens
    const sqlTokens = format(
      `SELECT * FROM google_tokens WHERE user_id = %L;`,
      uid
    );
    const tokens = await db.query(sqlTokens);
    console.log(tokens.rows, "line 810");

    if (tokens.rows.length === 0) {
      // If no tokens found, redirect to Google OAuth
      const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
      );

      const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent", // Force user to re-consent
        scope: [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
        ],
      });
      console.log("Redirecting to Google OAuth URL:", url);
      return url;
    }

    // If tokens are present, create an OAuth2 client
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: tokens.rows[0].access_token,
      refresh_token: tokens.rows[0].refresh_token,
      scope: tokens.rows[0].scope,
      token_type: tokens.rows[0].token_type,
      expiry_date: tokens.rows[0].expiry_date,
    });

    // Build event object for Google Calendar
    const calendarEvent = {
      summary: event.title,
      location: event.location,
      description: event.description,
      start: {
        dateTime: moment(
          `${event.date} ${event.start_time}`,
          "DD-MM-YYYY HH:mm"
        ).toISOString(),
        timeZone: "Europe/London",
      },
      end: {
        dateTime: moment(
          `${event.date} ${event.end_time}`,
          "DD-MM-YYYY HH:mm"
        ).toISOString(),
        timeZone: "Europe/London",
      },
    };

    // Insert event into Google Calendar
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const addedEvent = await calendar.events.insert({
      calendarId: "primary",
      resource: calendarEvent,
    });
    console.log(addedEvent, "line 875");

    // console.log("Event added to Google Calendar:", addedEvent.data.htmlLink);
    return {
      msg: "Event added to Google Calendar",
      eventLink: addedEvent.data.htmlLink,
    };
  } catch (error) {
    console.log("Error in eventAdded:", error);
    res.status(500).send({ msg: "Error adding event to Google Calendar" });
  }
}

module.exports = {
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
};
