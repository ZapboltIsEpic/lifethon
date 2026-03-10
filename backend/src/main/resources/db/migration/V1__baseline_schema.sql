CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    first_name    VARCHAR(50),
    last_name     VARCHAR(50),
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER',
    is_active     BOOLEAN,
    created_at    TIMESTAMP,
    updated_at    TIMESTAMP
);