
const sql = require('msnodesqlv8');

const connectionString =
    'Driver={ODBC Driver 17 for SQL Server};' +
    'Server=LAPTOP-P7EFMV11\\SQLEXPRESS01;' +
    'Database=MomsHavenDB;' +
    'Trusted_Connection=Yes;' +
    'TrustServerCertificate=Yes;';

sql.query(
    connectionString,
    'SELECT DB_NAME() AS DatabaseName, SYSTEM_USER AS ConnectedUser',
    (error, rows) => {
        if (error) {
            console.error('ODBC connection failed:');
            console.error(error);
            return;
        }

        console.log('ODBC connection successful!');
        console.log(rows);
    }
);
