
CREATE TABLE users (
    username VARCHAR(25) PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    current_city TEXT NOT NULL,
    current_state TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    profile_img TEXT DEFAULT 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDhweCIgaGVpZ2h0PSI0OHB4IiB2aWV3Qm94PSIwIDAgNDggNDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQo8cGF0aCBkPSJNMzIgMTZDMzQuNzYxNCAxNiAzNyAxMy43NjE0IDM3IDExQzM3IDguMjM4NTggMzQuNzYxNCA2IDMyIDZDMjkuMjM4NiA2IDI3IDguMjM4NTggMjcgMTFDMjcgMTMuNzYxNCAyOS4yMzg2IDE2IDMyIDE2WiIgZmlsbD0iIzJGODhGRiIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbWl0ZXJsaW1pdD0iMiIvPg0KPHBhdGggZD0iTTIzIDQwTDMxLjExIDM3Ljk0QzMxLjg5IDM3Ljc1IDMyLjEzIDM2Ljc1IDMxLjUzIDM2LjIyTDIzIDI5TDI3IDIxTDE2LjU5IDE3LjI2QzE2LjA5IDE3LjA4IDE1LjY5IDE2LjcyIDE1LjQ2IDE2LjI0TDExIDgiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLW1pdGVybGltaXQ9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPg0KPHBhdGggZD0iTTIzIDI5TDE2LjAzMDEgMzcuNzlDMTUuODIwMSAzOC4wNCAxNS41NjAxIDM4LjI0IDE1LjI2MDEgMzguMzZMNSA0MiIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbWl0ZXJsaW1pdD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+DQo8cGF0aCBkPSJNMjcgMjFMMzYuOSAyMy43OUMzNy4zNyAyMy45MyAzNy43OCAyNC4yMyAzOC4wNCAyNC42NEw0MiAzMSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbWl0ZXJsaW1pdD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+DQo8cGF0aCBkPSJNMTggOEMxOS42NTY5IDggMjEgNi42NTY4NSAyMSA1QzIxIDMuMzQzMTUgMTkuNjU2OSAyIDE4IDJDMTYuMzQzMSAyIDE1IDMuMzQzMTUgMTUgNUMxNSA2LjY1Njg1IDE2LjM0MzEgOCAxOCA4WiIgZmlsbD0iYmxhY2siLz4NCjwvc3ZnPg0K',
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    game_date TEXT NOT NULL,
    game_time TEXT NOT NULL,
    game_address TEXT NOT NULL,
    game_city TEXT NOT NULL,
    game_state TEXT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT REFERENCES users ON UPDATE CASCADE ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE games_activity(
    primaryUser TEXT NOT NULL REFERENCES users, 
    secondaryUser TEXT REFERENCES users,
    data JSON,
    game INTEGER NOT NULL REFERENCES games,
    operation CHAR(1) NOT NULL,
    stamp TIMESTAMP NOT NULL
);

Table games_activity {
    primaryUser text
    secondaryUser text
    data json
    game int
    operation text
    stamp timestamp
}

CREATE TABLE users_games_activity(
    primaryUser TEXT NOT NULL REFERENCES users, 
    secondaryUser TEXT REFERENCES users,
    data JSON,
    game INTEGER NOT NULL REFERENCES games,
    operation CHAR(1) NOT NULL,
    stamp TIMESTAMP NOT NULL
);


CREATE TABLE games_comments (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games ON DELETE CASCADE,
    username TEXT REFERENCES users ON UPDATE CASCADE ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

    id SERIAL PRIMARY KEY,
    game_id int
    username text
    comment text
    created_on timestamp
    is_active boolean

CREATE TABLE games_comments_activity (
    primaryUser TEXT NOT NULL REFERENCES users, 
    secondaryUser TEXT REFERENCES users,
    data JSON NOT NULL,
    game INTEGER NOT NULL REFERENCES games, 
    operation CHAR(3) NOT NULL,
    stamp TIMESTAMP NOT NULL
);



CREATE TABLE users_threads (
    id TEXT NOT NULL,
    username TEXT REFERENCES users ON UPDATE CASCADE ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (id, username)
);



CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    party_id TEXT NOT NULL,
    message_from TEXT NOT NULL,
    message TEXT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (party_id, message_from) REFERENCES users_threads ON UPDATE CASCADE ON DELETE CASCADE
);




CREATE TABLE inactive_messages (
    message_id INTEGER REFERENCES messages ON UPDATE CASCADE ON DELETE CASCADE,
    username TEXT REFERENCES users ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE is_following (
    following_user TEXT REFERENCES users ON UPDATE CASCADE ON DELETE CASCADE,
    followed_user TEXT REFERENCES users ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (followed_user, following_user)
);


CREATE TABLE is_following_activity (
    primaryUser TEXT NOT NULL REFERENCES users, 
    secondaryUser TEXT NOT NULL REFERENCES users,
    data JSON,
    game INTEGER REFERENCES games,
    operation CHAR(2),
    stamp TIMESTAMP NOT NULL
);


CREATE TABLE users_invites (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games ON DELETE CASCADE,
    from_user TEXT REFERENCES users ON UPDATE CASCADE ON DELETE CASCADE,
    to_user TEXT REFERENCES users ON UPDATE CASCADE ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE users_invites_activity(
    primaryUser TEXT NOT NULL REFERENCES users, 
    secondaryUser TEXT NOT NULL REFERENCES users, 
    data JSON,
    game INTEGER NOT NULL REFERENCES games,
    operation CHAR(2) NOT NULL,
    stamp TIMESTAMP NOT NULL
); 







