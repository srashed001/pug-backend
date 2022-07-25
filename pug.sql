\echo 'Delete and recreate pug db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE pugdb;
CREATE DATABASE pugdb;
\connect pugdb

\i pug-schema.sql
\i pugData.sql


\echo 'Delete and recreate pugdb_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE pugdb_test;
CREATE DATABASE pugdb_test;
\connect pugdb_test

\i pug-schema.sql
