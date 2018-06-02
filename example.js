
'use strict';

const instances = 2;
const taskCnt = 5000;

const port = 60000;
const argv = require('argv');
const options = [{
  name: 'worker',
  type: 'boolean',
  description: 'Flag to figure if it is executed as worker',
},{
  name: 'verbose',
  type: 'boolean',
  description: 'Show the details',
  example: "node index.js --verbose"
},{
  name: 'example',
  type: 'int',
  description: 'Example parameter',
  example: "node index.js --example=123"
}];
options.map(o => argv.option(o));
const args = argv.run();

const Pm2RepReq = require('./index');

async function main() {

  if (args.options.worker) {

    // Worker

    const worker = new Pm2RepReq({
      verbose: true,
      worker: true,
      port: port,
      cb: (args, sock) => {
        function request(args, sock) {
          sock.send('request', [], res => {
            if (res !== null) {
              console.log(`Received ${res.task}: ${res.data.sql}, ${res.data.value}`);
              //console.log('example', args.options.example);
              sock.send('resolved', res, () => {});
              request(args, sock);
            }
          });
        }
        request(args, sock);
      },
      args: options,
    });

    worker.run();

  } else {

    // Master

    let tasks = [];
    for (let i = 0; i < taskCnt; i++) tasks.push(`${i + 1}`);
    let taskReceived = 0;

    const master = new Pm2RepReq({
      verbose: true,
      worker: false,
      port: port,
      cb: (task, data, reply) => {

        let res = {
          task: null,
          data: {},
        };

        switch (task) {
          case 'request':
            if (tasks.length === 0) {
              reply(null);
            } else {
              const value = tasks.shift();
              res.task = 'exec-sql';
              res.data.sql = `SELECT * FROM example WHERE field = ?`;
              res.data.value = value;
              reply(res);
            }
            break;
          case 'resolved':
            taskReceived++;
            console.log('Resolved', `${taskReceived}/${taskCnt}`);
            reply(1);
            break;
          //case 'failed':
          //  tasks.push(data);
          //  console.log('Failed', `${taskReceived}/${taskCnt}`);
          //  reply(1);
          //  break;
          default:
            console.log(`Unknown task ${task}`);
        }

        return (taskReceived === taskCnt);

      },
      name: 'example',
      script: __filename,
      instances: instances,
      args: '--worker --example=777',
    });

    await master.run();
    process.exit(0);
  }
}

main();
