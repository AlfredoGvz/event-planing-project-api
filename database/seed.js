const db = require("./connection");
const fs = require("fs");
const userData = require("./usersData.json");
const eventsData = require("./eventsData.json");
const attendeesData = require("./attendeesData.json");

async function dropUsers() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS users;
    `);
    console.log("Users table dropped");
  } catch (error) {
    console.log(error);
  }
}
async function dropGoogleTokens() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS google_tokens;
    `);
    console.log("Google Tokens table dropped");
  } catch (error) {
    console.log(error);
  }
}

async function dropEvents() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS events;
    `);
    console.log("Events table dropped");
  } catch (error) {
    console.log(error);
  }
}

async function dropAttendees() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS attendees;
    `);
    console.log("Attendees table dropped");
  } catch (error) {
    console.log(error);
  }
}

async function dropPayments() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS payments;
    `);
    console.log("Payments table dropped");
  } catch (error) {
    console.log(error);
  }
}

async function dropTickets() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS tickets;
    `);
    console.log("Tickets table dropped");
  } catch (error) {
    console.log(error);
  }
}

async function createUserTable() {
  try {
    await db.query(`CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL UNIQUE, 
  user_fb_local_id TEXT NOT NULL UNIQUE, 
  user_role TEXT NOT NULL,
  calendar_activated BOOL DEFAULT FALSE, 
  created_at DATE DEFAULT CURRENT_DATE
);
`);
    console.log("Users table created");
  } catch (error) {
    console.log(error);
  }
}
async function createGoogleTokens() {
  try {
    await db.query(`CREATE TABLE google_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE, -- Add ON DELETE CASCADE
  google_account_email VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  scope TEXT,
  token_type TEXT,
  expiry_date BIGINT
);`);
    console.log("Google Tokens table created");
  } catch (error) {
    console.log(error);
  }
}

async function createEventsTable() {
  try {
    await db.query(`CREATE TABLE events(
      event_id SERIAL PRIMARY KEY,
      organizer_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      organizer_name TEXT NOT NULL, 
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      start_time TEXT NOT NULL, 
      end_time TEXT NOT NULL,
      date TEXT NOT NULL, 
      venue TEXT NOT NULL, 
      price TEXT NOT NULL,
      address TEXT NOT NULL, 
      post_code TEXT NOT NULL, 
      city TEXT NOT NULL
    );`);
    console.log("Events table created");
  } catch (error) {
    console.log(error);
  }
}

async function createAttendeesTable() {
  try {
    await db.query(`CREATE TABLE attendees(
      attendee_id SERIAL PRIMARY KEY, 
      user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      event_id INT REFERENCES events(event_id),
      ticket_number INT,
      payment_status TEXT NOT NULL,
      created_at DATE DEFAULT CURRENT_DATE
    );`);
    console.log("Attendees table created");
  } catch (error) {
    console.log(error);
  }
}

async function createPaymentsTable() {
  try {
    await db.query(`CREATE TABLE payments(
  payment_id SERIAL PRIMARY KEY, 
  attendee_id INT REFERENCES attendees(attendee_id) ON DELETE CASCADE, -- Add ON DELETE CASCADE
  amount NUMERIC NOT NULL, 
  currency TEXT NOT NULL,
  payment_status TEXT NOT NULL, 
  created_at DATE DEFAULT CURRENT_DATE
);
`);
    console.log("Payments table created");
  } catch (error) {
    console.log(error);
  }
}

async function createTicketsTable() {
  try {
    await db.query(`CREATE TABLE tickets(
  ticket_id SERIAL PRIMARY KEY,
  attendee_id INT REFERENCES attendees(attendee_id) ON DELETE CASCADE, -- Add ON DELETE CASCADE
  ticket_code TEXT NOT NULL, 
  issued_at DATE DEFAULT CURRENT_DATE
);
`);
    console.log("Tickets table created");
  } catch (error) {
    console.log(error);
  }
}

async function fillUsers() {
  for (const item of userData) {
    await db.query(
      `INSERT INTO users(user_name, user_email, user_fb_local_id, user_role) VALUES($1, $2, $3, $4);`,
      [item.user_name, item.user_email, item.user_fb_local_id, item.user_role]
    );
  }
}

async function fillEvents() {
  const result = await db.query("SELECT * FROM users;");

  // Step 2: Convert the data to JSON
  const usersData = JSON.stringify(result.rows, null, 2); // Pretty-printing with 2-space indentation

  // Step 3: Write the JSON data to a file
  fs.writeFileSync("database/usersData.json", usersData);
  for (const item of eventsData) {
    await db.query(
      `INSERT INTO events(
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
       ) VALUES($1, $2, $3, 
                $4, $5, $6, 
                $7, $8, $9, 
                $10, $11, $12);`,
      [
        item.organizer_id,
        item.organizer_name,
        item.title,
        item.description,
        item.start_time,
        item.end_time,
        item.date,
        item.venue,
        item.price,
        item.address,
        item.post_code,
        item.city,
      ]
    );
  }
}

async function fillAttendees() {
  for (const item of attendeesData) {
    await db.query(
      `INSERT INTO attendees(
       user_id,
       user_name,
       user_email,
       event_id,
       ticket_number,
       payment_status
     ) VALUES($1, $2, $3, 
                $4, $5, $6);`,
      [
        item.user_id,
        item.user_name,
        item.user_email,
        item.event_id,
        item.ticket_number,
        item.payment_status,
      ]
    );
  }
}

// Updated runSeed function to ensure correct order of operations
async function runSeed() {
  try {
    console.log("Dropping tables...");
    await dropTickets();
    await dropPayments();
    await dropAttendees();
    await dropEvents();
    await dropGoogleTokens();
    await dropUsers();

    console.log("Creating tables...");
    await createUserTable();
    await createGoogleTokens();
    await createEventsTable();
    await createAttendeesTable();
    await createPaymentsTable();
    await createTicketsTable();

    console.log("Inserting users...");
    await fillUsers();

    console.log("Inserting events...");
    await fillEvents();

    console.log("Inserting attendees...");
    await fillAttendees();

    console.log("Seeding completed successfully");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    db.end(); // Close the connection pool after all operations
  }
}

runSeed();
