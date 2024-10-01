const express=require('express');
const body_parser= require('body-parser');
const schoolRouter = require('./routers/school.router');

const app=express();

app.use(body_parser.json());
app.use('/',schoolRouter);

module.exports=app;