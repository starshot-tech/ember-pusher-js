import { Request, Response } from "express";

/* eslint-env node */
require('dotenv').config()

const bodyParser = require('body-parser');
const express = require('express');
const Pusher = require('pusher');

const app = express();
app.use(bodyParser.json());

const port = 3000;

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_CLUSTER
});

app.post('/chat', (req: Request, res: Response) => {
  const { body } = req;
  pusher.trigger(body.channel, body.event, body.message);
  res.json(body);
});

app.listen(port, () => console.log(`listening at ${port}`));
