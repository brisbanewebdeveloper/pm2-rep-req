
'use strict';

const instances = 2;
const initialTaskCnt = 5000;

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
            if (res === null) {
              console.log('Idling');
            } else {

              console.log(`Received - Task: ${res.task}, Value: ${res.value}`);
              //console.log('example', args.options.example);

              // To figure out the number of instances for your environment
              // (instances is also to be changed see the results)
              //const result = true;

              // To test if it finishes after all the tasks are completed
              const result = Math.floor(Math.random() * 100 % 10);

              sock.send((result > 0) ? 'resolved' : 'failed', res, () => {});
            }
            request(args, sock);
          });
        }
        request(args, sock);
      },
      args: options,
    });

    worker.run();

  } else {

    // Master

    const output = './example-out.log';
    const error = './example-error.log';

    let tasks = [];
    let taskCnt = initialTaskCnt;
    for (let i = 0; i < initialTaskCnt; i++) tasks.push({task: 'example', value: i + 1});

    let taskSucceeded = [];
    let taskFailed = [];
    let taskFinished = 0;

    const options = {
      verbose: true,
      worker: false,
      port: port,
      cb: async (task, data, reply) => {

        switch (task) {
          case 'request':
            if (tasks.length === 0) {
              reply(null);
            } else {
              const value = tasks.shift();
              reply(value);
            }
            break;
          case 'resolved':
            taskFinished++;
            taskSucceeded.push(data);
            console.log(`Resolved: ${taskFinished}/${taskCnt}`);
            reply(1);
            break;
          case 'failed':
            taskFinished++;
            taskFailed.push(data);
            console.log(`Failed: ${taskFinished}/${taskCnt}`);
            reply(1);
            break;
          default:
            console.log(`Unknown task ${task}`);
        }

      },
      name: 'example',
      script: __filename,
      instances: instances,
      args: '--worker --example=777',
      deleteOnComplete: false,
      onIdle: () => {
        return (taskFinished === taskCnt);
      },
      beforeStart: async (Pm2RepReq, pm2) => {
        //console.log('Pm2RepReq', Pm2RepReq);
        //console.log('pm2', pm2);
        const fs = require('fs');
        Promise.all([
          new Promise(resolve => { fs.unlink(output, resolve); }),
          new Promise(resolve => { fs.unlink(error, resolve); }),
        ]);
      },
      options: {
        max_memory_restart: '50M',
        mergeLogs: true,
        output: output,
        error: error,
      },
    };

    console.log(`Number of Tasks: ${tasks.length}`);

    let master = null;
    while (true) {
      if (master === null) {
        master = new Pm2RepReq(options);
        await master.run();
      } else {
        if (taskFailed.length === 0) {
          break;
        } else {
          console.log(`Number of Tasks Failed: ${taskFailed.length}`);
          tasks = taskFailed;
          taskCnt = tasks.length;
          taskFailed = [];
          taskFinished = 0;
          // await master.reload();
          await master.process();
        }
      }
    }

    await master.finish();

    console.log(`Number of Tasks Completed: ${taskSucceeded.length}`);

    process.exit(0);
  }
}

main();
