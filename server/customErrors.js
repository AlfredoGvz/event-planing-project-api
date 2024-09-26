function customErrorHandler(error, request, response, next) {
  console.log(error, "custom errors line 2");
  if (error.status === 400) {
    //Sign Up - Authentication
    if (error.msg === "Looks like some details are missing") {
      response.status(400).send({ msg: "Looks like some details are missing" });
    } else if (error.msg === "Invalid email address") {
      response.status(400).send({ msg: "Invalid email address" });
    }
  }
  if (error.status === 409) {
    //Sign Up - Authentication
    if (error.msg === "Email is already in use") {
      response.status(400).send({ msg: "Email is already in use" });
    }
  }
}

module.exports = customErrorHandler;
