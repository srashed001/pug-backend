const { BadRequestError } = require("../expressError");

/**
 * Helper for making selective update queries.
 *
 * The calling function can use it to make the SET clause of an SQL UPDATE
 * statement.
 *
 * @param dataToUpdate {Object} {field1: newVal, field2: newVal, ...}

 * @returns {Object} {sqlSetCols, dataToUpdate}
 *
 * @example {firstName: 'Aliya', lastName: 'Jones'} =>
 *   { setCols: '"first_name"=$1, "last_name"=$2',
 *     values: ['Aliya', 'Jones] }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) => {
    const value = jsToSql[colName];
    if (!value) throw new BadRequestError("Invalid data");
    return `"${value}"=$${idx + 1}`;
  });

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/**
 * Helper for making selective game search queries
 * 
 * The calling function can use it to make a game SQL SELECT
 * statement.
 * 
 * @param {string} query preliminary query detailing columns selected
 * @param {object} searchFilters (optional filter on searchFilters
 *  - date 
 *  = city 
 *  - state 
 *  - host {username} (WHERE created_by = host)
 *  - joined {username} (returns all games a user has joined)
 * @param {boolean} isActive 
 *  - true (WHERE is_active = true)
 *  = false (WHERE is_active = false)
 * @param {string} gameStatus 
 *  - 'pending' returns games whose game_date has not passed 
 *  - 'resolved' returns games whose game_date has passed 
 *  - undefined returns all games regardless of game_date
 *  Throw bad request if any other value is passed
 * 
 * @returns {array} [query, queryValues]
 *  - query  = SELECT STATEMENT
 *  - queryValues = [SQL statement parameters]
 * 
 * @example {SELECT g.id FROM games..., {date: '2022-04-01}, true, 'pending'} => 
 *  {[`SELECT g.id FROM games...WHERE g.is_active = $1 AND daysDiff > -1 AND g.gameDate = $2,
 *      [true, '2022-04-01']]}
 */
function sqlForGameFilters(query, searchFilters = {}, isActive, gameStatus) {

  let whereExpressions = [];
  let queryValues = [];

  const { date, city, state, host, joined } = searchFilters ? searchFilters : {};

  if (isActive === true || isActive === false) {
    queryValues.push(isActive);
    whereExpressions.push(`g.is_active = $${queryValues.length}`);
  }

  if (gameStatus !== undefined) {
    if (gameStatus !== "pending" && gameStatus !== "resolved")
      throw new BadRequestError(`Invalid gameStatus parameter`);

    const operator = gameStatus === "pending" ? ">" : "<=";
    whereExpressions.push(
      `(g.game_date::date - current_date::date) ${operator} -1`
    );
  }

  if (host) {
    queryValues.push(`${host}`);
    whereExpressions.push(`g.created_by = $${queryValues.length}`);
  }

  if (joined) {
    queryValues.push(`${joined}`);
    whereExpressions.push(`ug.username = $${queryValues.length}`);
  }

  if (date) {
    queryValues.push(`${date}`);
    whereExpressions.push(`g.game_date = $${queryValues.length}`);
  }

  if (city) {
    queryValues.push(`%${city}%`);
    whereExpressions.push(`g.game_city ILIKE $${queryValues.length}`);
  }

  if (state) {
    queryValues.push(state);
    whereExpressions.push(`g.game_state = $${queryValues.length}`);
  }

  if (whereExpressions.length > 0) {
    query += " WHERE " + whereExpressions.join(" AND ");
  }

  query += " GROUP BY g.id ORDER BY (g.game_date::date - current_date::date) DESC, g.game_time DESC, g.id";

  return [query, queryValues];
}


function sqlForGameComments(query, gameId, isGameCommentsActive, isUsersActive) {

  let whereExpressions = [`gc.game_id = $1`];
  let queryValues = [gameId];

  if (isGameCommentsActive === true || isGameCommentsActive === false) {
    queryValues.push(isGameCommentsActive);
    whereExpressions.push(`gc.is_active = $${queryValues.length}`);
  }
  if (isUsersActive === true || isUsersActive === false) {
    queryValues.push(isUsersActive);
    whereExpressions.push(`u.is_active = $${queryValues.length}`);
  }

  query += " WHERE " + whereExpressions.join(" AND ") + " ORDER BY gc.created_on DESC"

  return [query, queryValues];
}

module.exports = { sqlForPartialUpdate, sqlForGameFilters, sqlForGameComments };
