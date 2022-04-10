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

function sqlForPartialUpdate(dataToUpdate) {
  const jsToSql = {
    username: "username",
    firstName: "first_name",
    lastName: "last_name",
    birthDate: "birth_date",
    currentCity: "current_city",
    currentState: "current_state",
    phoneNumber: "phone_number",
    profileImg: "profile_img",
    email: "email",
    isPrivate: "is_private",
  };
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");  

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) => {
      const value = jsToSql[colName];
      if(!value) throw new BadRequestError("Invalid data")
      return `"${value}"=$${idx + 1}`
    });

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
