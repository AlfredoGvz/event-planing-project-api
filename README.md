# PLAN ME Backend API

This repository contains the backend API for the PLAN ME project, a fullstack web application that helps users discover events in their area. With this API, users can find events, book a spot, and add their favorite events to their calendars if they choose.

## Dependencies overview

- **[cors](https://www.npmjs.com/package/cors)**: Enables cross-origin resource sharing, allowing requests from different domains.
- **[dotenv](https://www.npmjs.com/package/dotenv)**: Loads environment variables from a .env file, keeping sensitive data like API keys and database credentials secure.
- **[express](https://expressjs.com/)**: A web framework for handling HTTP requests, creating routes, and serving the API.
- **[firebase](https://firebase.google.com/docs)**: Provides Firebase services (like authentication, Firestore, etc.) for handling user data, storage, or notifications.
- **[googleapis](https://developers.google.com/workspace/guides/get-started)**: Allows access to Google services (e.g., Google Calendar, Google Drive) via API requests.
- **moment**: Helps with date manipulation and formatting, useful for dealing with event times or deadlines.
- **[node postgres](https://node-postgres.com/)**: PostgreSQL client for Node.js to interact with a PostgreSQL database.
- **pg-format**: Provides formatting for PostgreSQL queries, useful for dynamic SQL queries.
- **[stripe](https://docs.stripe.com/api)**: Integrates Stripe's payment services for processing transactions.

Some of the services integrated into the API allow you to create an account on their respective web platforms to monitor and manage activities generated by API requests. This is particularly useful for visualizing real-time data, tracking usage, and managing configurations. An example of this are firebase and stripe.

# Installation

You can obtain a copy of this repo by cloning it running the following command on your terminal:

```
git clone https://github.com/AlfredoGvz/event-planing-project-api.git
```

Once cloned, get into the root directory of the project and run the following command on the terminal to install the node modules:

```
npm install
```

# How to use

This RESTful API supports standard HTTP methods like GET and DELETE. To start the server and listen for incoming requests you need to navigate to the project's root folder and run the following command:

```
npm run server
```

This command is pre-configured in the scripts section of the package.json file and will launch the server on port 8080 by default. If you need to change the port, you can modify it in the listen.js file.

# Accessing the Endpoints

To interact with the API, you can either:

- Open an internet browser and manually enter the URL for the endpoint you want to access.
- Use specialized tools like Postman or Insomnia, which allow you to craft and manage API requests (including headers, query parameters, and payloads) and view the responses in an organized format.

Using Postman or Insomnia will give you more flexibility when testing endpoints, especially when working with POST or DELETE requests, or when managing authentication.

# Database Setup

This project uses PostgreSQL as the database for storing and retrieving data. You may choose to experiment with different database systems, but bear in mind that they will have a different set up process from PostgreSQL. You can configure the Postgres database to run locally or connect to a hosted instance. Here's how you can set up and manage the database:

## Locally

Install PostgreSQL on your machine.

1. Download and install PostgreSQL from the official website or through your package manager.
2. Follow the installation steps and set a password for the default postgres user.
3. You can manage your database using the SQL shell (psql) or a graphical tool like pgAdmin.

## Database Cloud Hosting

For deploying the database for this project, I chose Aiven, a platform that offers fully managed open-source data services in the cloud. Their [documentation](https://aiven.io/docs/get-started) is clear and easy to follow. However, you may choose a different hosting provider based on your preferences. Keep in mind that each platform will have its own setup process and pricing structure, so consider these factors when selecting your provider.
