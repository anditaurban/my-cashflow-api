function todayInJakarta() {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Jakarta',
    year: 'numeric'
  }).format(new Date());
}

module.exports = {
  todayInJakarta
};
