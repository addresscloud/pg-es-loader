const pg = require('pg')
const Chain = require('stream-chain')
const QueryStream = require('pg-query-stream')
const WritableBulk = require('elasticsearch-streams').WritableBulk
const TransformToBulk = require('elasticsearch-streams').TransformToBulk
const deepcompact = require('deep-compact')

// Tell pg how to handle numbers
pg.types.setTypeParser(20, parseInt)
pg.types.setTypeParser(1700, parseFloat)

// Establish ES connection
const es = new require('elasticsearch').Client()

// Job constants
const { ES_INDEX, PGQUERY } = process.env
const LOG_EVERY = process.env.LOG_EVERY || 100000

// Setup counter
let counter = 0

// Filter out nulls
const filter = new Chain([ obj => deepcompact(obj) ])

// Configure ES bulk operation
const bulkExec = (bulkCmds, callback) => {
  es.bulk({
    index : ES_INDEX,
    type  : '_doc',
    body  : bulkCmds
  }, callback)
}
const ws = new WritableBulk(bulkExec)
const toBulk = new TransformToBulk(doc => {
  if (++counter % LOG_EVERY === 0) console.log(`${counter.toLocaleString()} documents indexed`)
  let id = { '_id': doc.id } // Tell ES what to use as the document id
  delete doc.id // Delete the id so it doesn't end up in the doc body
  return id
})

// Setup connection
const client = new pg.Client()

// Query and stream!
const run = async () => {
  try {
    await client.connect()
    const stream = client.query(new QueryStream(PGQUERY))
    stream.on('end', () => {
      console.log('Done!')
      client.end()
    })
    stream.pipe(filter).pipe(toBulk).pipe(ws)
  } catch (err) {
    console.log(err.stack)
  }
}
run()
