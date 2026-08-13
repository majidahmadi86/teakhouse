/**
 * Remove every suite-generated row from the database, by hand.
 *
 * The acceptance suites now clean up after themselves (see scripts/lib/qa.js),
 * so this exists for the two cases that outlive them: clearing a backlog left
 * by older runs, and checking before a demo that the data is the seeded set.
 *
 *   node scripts/qa-purge.js
 */

const { purgeQaData } = require("./lib/qa");

purgeQaData().then(({ total }) => {
  if (total === 0) console.log("database holds seeded data only");
});
