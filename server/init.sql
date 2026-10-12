SELECT 'CREATE DATABASE tickets_test'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'tickets_test'
)\gexec
