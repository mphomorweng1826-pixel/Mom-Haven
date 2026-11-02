const sql = require('msnodesqlv8');

const connectionString =
    'Driver={ODBC Driver 17 for SQL Server};' +
    'Server=LAPTOP-P7EFMV11\\SQLEXPRESS01;' +
    'Database=MomsHavenDB;' +
    'Trusted_Connection=Yes;' +
    'TrustServerCertificate=Yes;';

function query(queryText, params = []) {
    return new Promise((resolve, reject) => {

        const callback = (error, rows) => {
            if (error) {
                reject(error);
            } else {
                resolve(rows);
            }
        };

        if (params.length === 0) {
            sql.query(connectionString, queryText, callback);
        } else {
            sql.query(connectionString, queryText, params, callback);
        }
    });
}

module.exports = { query };
