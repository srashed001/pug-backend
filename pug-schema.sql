CREATE EXTENSION pg_trgm;

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
    primaryUser TEXT NOT NULL, 
    secondaryUser TEXT,
    data JSON,
    game INTEGER NOT NULL,
    operation CHAR(1) NOT NULL,
    stamp TIMESTAMP NOT NULL
);

CREATE FUNCTION process_games_activity() RETURNS TRIGGER AS $games_activity$
    BEGIN

        IF (TG_OP = 'UPDATE') THEN
            IF NEW.is_active IS FALSE THEN INSERT INTO games_activity SELECT NEW.created_by, NULL, NULL, NEW.id, 'D', now();
            ELSE INSERT INTO games_activity SELECT NEW.created_by, NULL, NULL, NEW.id, 'U', now();
            END IF;
        ELSIF (TG_OP = 'INSERT') THEN
            INSERT INTO games_activity SELECT NEW.created_by, NULL, NULL, NEW.id, 'C', now();
        END IF;
        RETURN NULL;
    END;
$games_activity$ LANGUAGE plpgsql;

CREATE TRIGGER games_activity
AFTER INSERT OR UPDATE OR DELETE ON games
    FOR EACH ROW EXECUTE FUNCTION process_games_activity();

CREATE TABLE users_games (
    game_id INTEGER REFERENCES games ON DELETE CASCADE,
    username TEXT REFERENCES users ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (game_id, username)
);

CREATE TABLE users_games_activity(
    primaryUser TEXT NOT NULL, 
    secondaryUser TEXT,
    data JSON,
    game INTEGER NOT NULL,
    operation CHAR(1) NOT NULL,
    stamp TIMESTAMP NOT NULL
);

CREATE FUNCTION process_users_games_activity() RETURNS TRIGGER AS $users_games_activity$
    BEGIN
        IF (TG_OP = 'DELETE') THEN
            INSERT INTO users_games_activity SELECT OLD.username, NULL, NULL, OLD.game_id, 'L', now();
        ELSIF (TG_OP = 'INSERT') THEN
            INSERT INTO users_games_activity SELECT NEW.username, NULL, NULL, NEW.game_id, 'J', now();
        END IF;
        RETURN NULL; -- result is ignored since this is an AFTER trigger
    END;
$users_games_activity$ LANGUAGE plpgsql;

CREATE TRIGGER users_games_activity
AFTER INSERT OR UPDATE OR DELETE ON users_games
    FOR EACH ROW EXECUTE FUNCTION process_users_games_activity();

CREATE TABLE games_comments (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games ON DELETE CASCADE,
    username TEXT REFERENCES users ON UPDATE CASCADE ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE games_comments_activity (
    primaryUser TEXT NOT NULL, 
    secondaryUser TEXT,
    data JSON NOT NULL,
    game INTEGER NOT NULL, 
    operation CHAR(3) NOT NULL,
    stamp TIMESTAMP NOT NULL
);

CREATE FUNCTION process_games_comments_activity() RETURNS TRIGGER AS $games_comments_activity$
    BEGIN
        IF (TG_OP = 'UPDATE') THEN
            INSERT INTO games_comments_activity SELECT OLD.username, NULL, jsonb_build_object('commentId', OLD.id, 'comment', OLD.comment), OLD.game_id, 'GCX', now();
        ELSIF (TG_OP = 'INSERT') THEN
            INSERT INTO games_comments_activity SELECT NEW.username, NULL, jsonb_build_object('commentId', NEW.id, 'comment', NEW.comment), NEW.game_id, 'GCC', now();
        END IF;
        RETURN NULL; -- result is ignored since this is an AFTER trigger
    END;
$games_comments_activity$ LANGUAGE plpgsql;

CREATE TRIGGER games_comments_activity
AFTER INSERT OR UPDATE OR DELETE ON games_comments
    FOR EACH ROW EXECUTE FUNCTION process_games_comments_activity();

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
    primaryUser TEXT NOT NULL, 
    secondaryUser TEXT NOT NULL,
    data JSON,
    game INTEGER,
    operation CHAR(2),
    stamp TIMESTAMP NOT NULL
);

CREATE FUNCTION process_is_following_activity() RETURNS TRIGGER AS $is_following_activity$
    BEGIN
        IF (TG_OP = 'DELETE') THEN
            INSERT INTO is_following_activity SELECT OLD.following_user, OLD.followed_user, NULL, NULL, 'UF', now();
        ELSIF (TG_OP = 'INSERT') THEN
            INSERT INTO is_following_activity SELECT NEW.following_user, NEW.followed_user, NULL, NULL, 'FF', now();
        END IF;
        RETURN NULL; -- result is ignored since this is an AFTER trigger
    END;
$is_following_activity$ LANGUAGE plpgsql;

CREATE TRIGGER is_following_activity
AFTER INSERT OR UPDATE OR DELETE ON is_following
    FOR EACH ROW EXECUTE FUNCTION process_is_following_activity();


CREATE TABLE users_invites (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games ON DELETE CASCADE,
    from_user TEXT REFERENCES users ON UPDATE CASCADE ON DELETE CASCADE,
    to_user TEXT REFERENCES users ON UPDATE CASCADE ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users_invites_activity(
    primaryUser TEXT NOT NULL, 
    secondaryUser TEXT NOT NULL, 
    data JSON,
    game INTEGER NOT NULL,
    operation CHAR(2) NOT NULL,
    stamp TIMESTAMP NOT NULL
); 

CREATE FUNCTION process_users_invites_activity() RETURNS TRIGGER AS $users_invites_activity$
    BEGIN
        IF (TG_OP = 'UPDATE') THEN
            IF NEW.status = 'accepted' THEN INSERT INTO users_invites_activity SELECT NEW.to_user, NEW.from_user, NULL, NEW.game_id, 'IA', now();
            ELSIF NEW.status = 'denied' THEN INSERT INTO users_invites_activity SELECT NEW.to_user, NEW.from_user, NULL, NEW.game_id, 'ID', now();
            ELSIF NEW.status = 'cancelled' THEN INSERT INTO users_invites_activity SELECT NEW.from_user, NEW.to_user, NULL, NEW.game_id, 'IX', now();
            END IF;
        ELSIF (TG_OP = 'INSERT') THEN
            INSERT INTO users_invites_activity SELECT NEW.from_user, NEW.to_user, NULL, NEW.game_id, 'IC', now();
        END IF;
        RETURN NULL; -- result is ignored since this is an AFTER trigger
    END;
$users_invites_activity$ LANGUAGE plpgsql;

CREATE TRIGGER users_invites_activity
AFTER INSERT OR UPDATE OR DELETE ON users_invites
    FOR EACH ROW EXECUTE FUNCTION process_users_invites_activity();




