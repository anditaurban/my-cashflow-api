const app = require('./app');
const { assertDatabaseConnection } = require('./config/database');

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await assertDatabaseConnection();

    app.listen(port, () => {
      console.log(`Cashflow Harian API berjalan di http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Gagal menjalankan API:', error.message);
    process.exit(1);
  }
}

startServer();
