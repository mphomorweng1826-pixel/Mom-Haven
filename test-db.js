const { query } = require('./db');

async function testDatabase() {
    try {
        const result = await query(
            'SELECT ? AS TestValue',
            ['Mom\'s Haven']
        );

        console.log('Parameter test successful!');
        console.log(result);

    } catch (error) {
        console.error('Parameter test failed:');
        console.error(error);
    }
}

testDatabase();