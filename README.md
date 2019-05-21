# Postgres to Elasticsearch Loader

This NodeJS script connects to a Postgres table and streams results into Elasticsearch.  It is proven to perform well over fairly large datasets ~50m rows without dropping connections.

### Configuration
It is configured using dotenv and the following environment variables:

- PGQUERY: The Postgres query to read from
- ES_INDEX: The Elasticsearch index to write to
- LOG_EVERY: How often to log progress (default: every 100,000) rows

### Pre-requisites:
- The only requirement for the table is that it must have a column called id.
- It is assumed that the Elasticsearch cluster is running on localhost:9200 but it would be easy to modify to connect to a remote cluster.
