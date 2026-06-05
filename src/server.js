const app = require('./app');
const { assertDatabaseConnection, hasDatabaseEnv } = require('./config/database');

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

async function startServer() {
  const server = app.listen(port, host, () => {
    console.log(`Cashflow Harian API berjalan di port ${port}`);

    if (!hasDatabaseEnv()) {
      console.warn('Env database belum ditemukan. Set MYSQL_URL atau MYSQLHOST/MYSQLPORT/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE di Railway service.');
    }

    assertDatabaseConnection()
      .then(() => {
        console.log('Database berhasil terhubung.');
      })
      .catch((error) => {
        console.error('Database belum terhubung:', error.message);
      });
  });

  server.on('error', (error) => {
    console.error('Gagal menjalankan API:', error.message);
    process.exit(1);
  });
}

startServer();
