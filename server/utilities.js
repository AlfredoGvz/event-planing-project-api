const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

async function isLoggedIn(auth) {
  if (!auth.currentUser) {
    // Throw a custom error object with a status code and message
    return Promise.reject({ status: 400, msg: "User not logged in." });
  }
  return true; // If the user is logged in
}
//Refactor OAuth
async function oauth2Client() {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  });
  return { oauth2Client, url };
}

module.exports = { isLoggedIn, oauth2Client };
