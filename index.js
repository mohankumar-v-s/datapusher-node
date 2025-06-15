const express = require('express');
const bodyParser = require('body-parser');
const accountRoute = require('./src/routes/account.route')
const dataRoute = require('./src/routes/dataHandler.route')
const userRoute = require('./src/routes/user.route')
const db = require('./src/models');

const app = express();
app.use(bodyParser.json());


app.use('/api/user', userRoute)
app.use('/api/accounts', accountRoute);
app.use('/api/server', dataRoute);

db.sequelize.sync();

app.listen(8000, () => {
    console.log('Server started on http://localhost:8000');
});

module.exports = app;
