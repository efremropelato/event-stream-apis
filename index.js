const express = require('express');
const session = require('express-session')
const fs = require('fs');
const sessionStore = new session.MemoryStore();

let gobalCount = 0;
let sessions = 0;
const run = async () => {
  const app = express();
  app.set('trust proxy', 1) // trust first proxy
  app.use(session({
    store: sessionStore,
    secret: 'ev3nts',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }))
  app.use(express.static('public'));
  app.get('/events', async function(req, res) {
    console.log('Got /events for session = '+req.sessionID);
    res.set({
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive'
    });
    res.flushHeaders();

    // Tell the client to retry every 10 seconds if connectivity is lost
    res.write('retry: 10000\n\n');
    let sessionCount = 0;
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      sessions = await (Object.keys(sessionStore.sessions).length)
      /*sessionStore.length((error, len)=>{
        sessions = len
      });*/
      const payload = { 
                        gobalCount: ++gobalCount, 
                        sessionCount: ++sessionCount, 
                        sessionID: req.sessionID,
                        sessions: sessions, 
                        t: new Date().getTime()
                      };
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  });

  const index = fs.readFileSync('./index.html', 'utf8');
  app.get('/', (req, res) => res.send(index));

  await app.listen(3000);
  console.log('open http://localhost:3000');
  console.log('open http://localhost:3000/events');
  console.log('use \'curl http://localhost:3000/events\'');
}
run().catch(err => console.log(err));