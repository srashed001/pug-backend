const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate, sqlForGameFilters, sqlForGameComments, sqlForUsersFilters } = require("./sql");

/**************************************************************************** sqlForPartialUpdate*/
describe("sqlForPartialUpdate", function () {
  test("works: 1 item", function () {
    const result = sqlForPartialUpdate({ f1: "v1" }, { f1: "f1", fF2: "f2" });
    expect(result).toEqual({
      setCols: '"f1"=$1',
      values: ["v1"],
    });
  });

  test("works: 2 items", function () {
    const result = sqlForPartialUpdate(
      { f1: "v1", jsF2: "v2" },
      { jsF2: "f2", f1: "f1" }
    );
    expect(result).toEqual({
      setCols: '"f1"=$1, "f2"=$2',
      values: ["v1", "v2"],
    });
  });

  test("returns badRequest if passed colName not in jsToSql", function () {
    try {
      sqlForPartialUpdate({ f1: "v1", jsF2: "v2" }, { jsF2: "f2" });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/**************************************************************************** sqlForGameFilter*/
describe(`sqlForGameFilter`, function () {
  let query = `SELECT g.id, g.title, FROM games AS g LEFT JOIN users_games AS ug ON g.id = ug.game_id LEFT JOIN users AS u  on ug.username = u.username`;

  test(`works: 1 item`, function () {
    const searchFilters = {
      isActive: true,
    };
    const result = sqlForGameFilters(query, searchFilters);
    const [q, v] = result;
    expect(q).toEqual(
      `SELECT g.id, g.title, FROM games AS g LEFT JOIN users_games AS ug ON g.id = ug.game_id LEFT JOIN users AS u  on ug.username = u.username WHERE g.is_active = $1 GROUP BY g.id ORDER BY (g.game_date::date - current_date::date) DESC, g.game_time DESC, g.id`
    );
    expect(v).toEqual([true]);
  });

  test(`works: 2 item`, function () {
    const searchFilters = {
      isActive: true,
      gameStatus: "resolved",
    };
    const result = sqlForGameFilters(query, searchFilters);
    const [q, v] = result;
    expect(q).toEqual(
      `SELECT g.id, g.title, FROM games AS g LEFT JOIN users_games AS ug ON g.id = ug.game_id LEFT JOIN users AS u  on ug.username = u.username WHERE g.is_active = $1 AND (g.game_date::date - current_date::date) <= -1 GROUP BY g.id ORDER BY (g.game_date::date - current_date::date) DESC, g.game_time DESC, g.id`
    );
    expect(v).toEqual([true]);
  });

  test(`returns badrequest with invalid gameStatus`, function () {
    const searchFilters = {
      isActive: true,
      gameStatus: "denied",
    };
    try{
        sqlForGameFilters(query, searchFilters)
    } catch(err){
        expect(err instanceof BadRequestError).toBeTruthy()
    }
  });

  test(`works: ignores invalid fields`, function () {
    const searchFilters = {
      isActive: true,
      favColor: 'purple'
    };
    const result = sqlForGameFilters(query, searchFilters);
    const [q, v] = result;
    expect(q).toEqual(
      `SELECT g.id, g.title, FROM games AS g LEFT JOIN users_games AS ug ON g.id = ug.game_id LEFT JOIN users AS u  on ug.username = u.username WHERE g.is_active = $1 GROUP BY g.id ORDER BY (g.game_date::date - current_date::date) DESC, g.game_time DESC, g.id`
    );
    expect(v).toEqual([true]);
  });
});

/**************************************************************************** sqlForGameComments*/
describe(`sqlForGameComments`, function(){
    const query = `SELECT gc.id FROM games_comments AS gc LEFT JOIN users AS u ON gc.username = u.username`
    const gameId = 0

    test(`works: no values for isGameComments active or isUsersActive`, function(){
        const [q, v] = sqlForGameComments(query, gameId)
        expect(q).toEqual(`SELECT gc.id FROM games_comments AS gc LEFT JOIN users AS u ON gc.username = u.username WHERE gc.game_id = $1 ORDER BY gc.created_on DESC`)
        expect(v).toEqual([0])
    })

    test(`works: values for isGameComments active or isUsersActive`, function(){
        const [q, v] = sqlForGameComments(query, gameId, true, false)
        expect(q).toEqual(`SELECT gc.id FROM games_comments AS gc LEFT JOIN users AS u ON gc.username = u.username WHERE gc.game_id = $1 AND gc.is_active = $2 AND u.is_active = $3 ORDER BY gc.created_on DESC`)
        expect(v).toEqual([0, true, false])
    })
})

/**************************************************************************** sqlForUsersFilters*/
describe(`sqlForUsersFilters`, function(){
    const query = `SELECT username FROM users`

    test(`works: no searchFilters`, function(){
        const [q,v] = sqlForUsersFilters(query)
        expect(q).toEqual(`SELECT username FROM users`)
        expect(v).toEqual([])
    })

    test(`works: isActive`, function(){
        const searchFilters = {
            isActive: true
        }
        const [q, v] = sqlForUsersFilters(query, searchFilters)
        expect(q).toEqual(`SELECT username FROM users WHERE is_active = $1`)
        expect(v).toEqual([true])
    })

    test(`ignore isActive if not boolean, null, undefined`, function(){
        const searchFilters = {
            isActive: 'yes'
        }
        const [q, v] = sqlForUsersFilters(query, searchFilters)
        expect(q).toEqual(`SELECT username FROM users`)
        expect(v).toEqual([])
    })

    test(`works: 2 filters`, function(){
        const searchFilters = {
            firstName: 'bananaMan',
            city: 'Irvine',
            state: 'CA'
        }
        const [q, v] = sqlForUsersFilters(query, searchFilters)
        expect(q).toEqual(`SELECT username FROM users WHERE SIMILARITY(current_city, $2) > .4 AND current_state = $3 ORDER BY SIMILARITY(first_name, $1) DESC, SIMILARITY(current_city, $2) DESC`)
        expect(v).toEqual([ 'bananaMan', 'Irvine', 'CA' ])
    })

    test(`ignores invalid fields`, function(){
        const searchFilters = {
            occupation: 'bartender',
            girlfriend: 'Chelsea',
            favFood: 'Chicken Parm'
        }

        const [q,v] = sqlForUsersFilters(query, searchFilters)
        expect(q).toEqual(`SELECT username FROM users`)
        expect(v).toEqual([])
    })
})
