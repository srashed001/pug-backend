/** Find all games a user is associated with
   *
   *
   * Returns {gamesCreatedUpcoming, gamesCreatedPassed, gamesJoinedUpcoming, gameJoinedPassed}
   *    where gamesCreatedUpcoming, gamesCreatedPassed, gamesJoinedUpcoming, gamesJoinedPassed = [{id, title, city, state, date}]
   *
   *
   **/
 async function userGameHistory(username) {
    const userRes = await db.query(
      `SELECT username FROM users WHERE username = $1`,
      [username]
    );
    if (!userRes.rows[0])
      throw new NotFoundError(`No active user: ${username}`);

    const gamesCreatedUpcomingRes = await db.query(
      `SELECT id,
                title,
                game_date AS "date", 
                game_city AS "city", 
                game_state AS "state"
        FROM games
        WHERE is_active = true AND (g.game_date::date - current_date::date) > -1 AND created_by = $1
        ORDER BY (game_date::date - current_date::date)`,
      [username]
    );
    const gamesCreatedUpcoming = gamesCreatedUpcomingRes.rows;

    const gamesCreatedPassedRes = await db.query(
      `SELECT id,
                title,
                game_date AS "date", 
                game_city AS "city", 
                game_state AS "state"
        FROM games
        WHERE is_active = true AND (g.game_date::date - current_date::date) <= -1 AND created_by = $1
        ORDER BY (game_date::date - current_date::date)`,
      [username]
    );
    const gamesCreatedPassed = gamesCreatedPassedRes.rows

    const gamesJoinedUpcomingRes = await db.query(
      `SELECT g.id,
                g.title,
                g.game_date AS "date", 
                g.game_city AS "city", 
                g.game_state AS "state", 
        FROM games AS g
        LEFT JOIN users_games AS ug
        ON g.id = ug.game_id
        WHERE is_active = true AND (g.game_date::date - current_date::date) > -1 AND ug.username = $1
        ORDER BY (g.game_date::date - current_date::date)`, [username]
    );
    const gamesJoinedUpcoming = gamesJoinedUpcomingRes.rows

    const gamesJoinedPassedRes = await db.query(
      `SELECT g.id,
                g.title,
                g.game_date AS "date", 
                g.game_city AS "city", 
                g.game_state AS "state", 
        FROM games AS g
        LEFT JOIN users_games AS ug
        ON g.id = ug.game_id
        WHERE is_active = true AND (g.game_date::date - current_date::date) <= -1 AND ug.username = $1
        ORDER BY (g.game_date::date - current_date::date)`, [username]
    );
    const gamesJoinedPassed = gamesJoinedPassedRes.rows

   const gameHistory = {
       gamesCreatedUpcoming,
       gamesCreatedPassed,
       gamesJoinedUpcoming,
       gamesJoinedPassed
   }

    return gameHistory
  }