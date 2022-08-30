# PUG Back-end (Client-side Rendering)

PUG is a communication platform that allows users to find basketball courts in their area, create games, and share the details of these games with other users.

This serves the backend for PUG

Development Tools:

- Node
- Express
- PostgreSQL
- Node - postgres

## Installation

### Setup Database

- [Download PostreSQL](https://www.postgresql.org/download/) on your device to setup database

- [Pull from repository](https://www.postgresql.org/download/). You can run following command in project directory. 

```bash
git init 
git pull https://github.com/srashed001/pug-backend
```

- Install dependencies

```bash
npm i
```

- Setup and seed database by running following command. This will set up your your production and test databases and provide some sample data into your production database 

```bash
psql < pug.sql
```

### Start your server

 - Download [nodemon](https://www.npmjs.com/package/nodemon) to start server. Nodemon is a tool that helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected.

```bash
npm install -g nodemon
```

- Start server

```bash
nodemon
```

- Your can also start server without downloading nodemon on your device 

```bash
node server.js
```

### Download front-end

[PUG Front-end](https://github.com/srashed001/pug-frontend) - https://github.com/srashed001/pug-frontend

