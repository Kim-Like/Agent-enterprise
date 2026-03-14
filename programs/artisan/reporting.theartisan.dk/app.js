const path = require('path');
const { loadEnv } = require('./config/loadEnv');
loadEnv();

const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/settings', require('./routes/settings'));
app.use('/labour', require('./routes/labour'));
app.use('/fixed-costs', require('./routes/fixed-costs'));
app.use('/rules', require('./routes/rules'));
app.use('/health', require('./routes/health'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Billy Business Review running on port ${PORT}`));
