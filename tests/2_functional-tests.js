/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
var should = chai.should();
var bcrypt = require('bcrypt');
chai.use(chaiHttp);

let Thread = require('../models/Thread');
let Reply = require('../models/Reply');
let Board = require('../models/Board');
// before((done) => {
//   setTimeout(function () {
//     Board.create({ name: 'test' }, (err, newBoard) => {
//       err ? console.log('by') : console.log('hi')
//     });
//     done();
//   }, 100)
// })
// after(done => {
//   setTimeout(function () {
//     Board.collection.drop();
//     Thread.collection.drop();
//     Reply.collection.drop();
//     done();
//   }, 100)
// })

suite('Functional Tests', function() {

  let threadId,replyId;

  suite('API ROUTING FOR /api/threads/:board', function() {
    suite('POST', function() {
      test('POST new thread', function (done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({
            board: 'test',
            text: 'This is a test thread for test.',
            delete_password: 'partyhard',
            replies:['hi']
          })

          .end((err, res) => {
            assert.equal(res.status, 200);
            res.text.should.include('<h4 id="thread-title">This is a test thread for test.</h4>');
            assert.include(res.redirects[0],'/b/test','Should redirect to /b/test');

            done();
          })
      });
    });
    
    suite('GET', function() {
      test('GET Thread', (done) => {
        chai.request(server)
          .get('/api/threads/test')
          .end((err, res) => {
            
            assert.equal(res.status, 200);
            // Should only show at most 10 threads
            assert.isTrue(res.body.threads.length <=10)
            // Board association
            assert.property(res.body.threads[0], 'board')
            assert.equal(res.body.threads[0].board, 'test')
            // Text
            assert.property(res.body.threads[0], 'text')
            assert.equal(res.body.threads[0].text, 'This is a test thread for test.')
            // Dates
            assert.property(res.body.threads[0], 'created_on')
            assert.property(res.body.threads[0], 'bumped_on')
            // Reported
            assert.property(res.body.threads[0], 'reported')
            assert.isBoolean(res.body.threads[0].reported)
            // Replies
            assert.property(res.body.threads[0], 'replies')
            assert.isArray(res.body.threads[0].replies)
            assert.isTrue(res.body.threads[0].replies.length < 3) // Only show 3 replies
            assert.property(res.body.threads[0], 'id')
            threadId = res.body.threads[0].id; // Used in /api/replies
            
            // Password
            assert.property(res.body.threads[0], 'delete_password')
            // Check the hashed password matches the one given
            bcrypt.compare('partyhard', res.body.threads[0].delete_password, (err, res)=> {
              assert.isTrue(res)
            });
            done();
          })
      })
    });
    suite('PUT', function () {
      test('Report thread', (done) => {
        chai.request(server)
          .put('/api/threads/test')
          .send({ id: threadId })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success')
            done();
          });
      });
    });
    suite('DELETE', function() {
      test('No _id', (done) => {
        chai.request(server)
          .delete('/api/threads/test')
          .send({id:''})
          .end((err, res) => {
            assert.equal(res.status, 200);
            console.log(res.body)
            assert.equal(res.body, 'No Thread ID passed.')
            done();
          });
      });

      test('Valid _id', (done) => {
        // issueId
        chai.request(server)
          .delete('/api/threads/test')
          .send({
            id: threadId,
            delete_password: 'partyhard'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success')
            done();
          });
      });
    });
  }).timeout(10000);

  suite('API ROUTING FOR /api/replies/:board', function() {
    let threadID;
    let replyID;
    before(done => {
      setTimeout(function () {
        Thread.create({
          board: 'test',
          text: 'This is a test thread for test.',
          delete_password: 'partyhard'
        }, (err, newThread) => {
          err ? console.log(err) : threadID=newThread._id
        });
        done();
      }, 100)
    })
    suite('POST', function() {
      test('POST new thread', function (done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({
            board: 'test',
            id: threadID,
            text:'this is a reply test',
            delete_password:'partyhard'
          })

          .end((err, res) => {
            // console.log(res.body)
            assert.equal(res.status, 200);
            // Board association
            assert.property(res.body, 'reply');
            assert.property(res.body.reply, 'thread');
           // Text
            assert.property(res.body.thread, 'text')
            assert.equal(res.body.reply.text, 'this is a reply test')

            // Dates
            assert.property(res.body.reply, 'created_on')
            // When add a reply, update the bumped on in the thread
            assert.isTrue(res.body.thread.created_on != res.body.thread.bumped_on)

            // Reported
            assert.property(res.body.reply, 'reported')
            assert.isBoolean(res.body.reply.reported)

            // ID
            assert.property(res.body.reply, '_id')
            replyID = res.body.reply._id; 

            // Password
            assert.property(res.body.reply, 'delete_password')
            // Check the hashed password matches the one given
            bcrypt.compare('partyhard', res.body.reply.delete_password, (err, res) => {
              assert.isTrue(res)
            });
            threadID = res.body.thread._id;
            done();
          })
        })
    });
    
    suite('GET', function() {
      // non-query
      test('GET Thread', (done) => {
        chai.request(server)
          .get('/api/replies/test')
          .query({thread_id:threadID})
          .end((err, res) => {
            // console.log(res.body)
            assert.equal(res.status, 200);
            // Board association
            assert.property(res.body, 'replies');
            assert.isArray(res.body.replies);

            // Thread Association
            assert.property(res.body.replies[0], 'thread');

            // Text
            assert.property(res.body.replies[0], 'text')
            assert.equal(res.body.replies[0].text, 'this is a reply test')

            // Dates
            assert.property(res.body.replies[0], 'created_on')
            // When add a reply, update the bumped on in the thread
            assert.isTrue(res.body.thread.created_on != res.body.thread.bumped_on)

            // Reported
            assert.property(res.body.replies[0], 'reported')
            assert.isBoolean(res.body.replies[0].reported)

            // ID
            assert.property(res.body.replies[0], '_id')
            // replyId = res.body.replies[0]._id; 
            console.log(replyID)

            // Password
            assert.property(res.body.replies[0], 'delete_password')
            // Check the hashed password matches the one given
            bcrypt.compare('partyhard', res.body.replies[0].delete_password, (err, res) => {
              assert.isTrue(res)
            });
            // console.log(res.body.replies)
            done();

          })
        })
    });

    suite('PUT', function() {
      test('Report reply', (done) => {
        chai.request(server)
          .put('/api/replies/test')
          .send({ reply_id: replyID })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success')
            done();
          });
      });
    });
    
    suite('DELETE', function() {
      test('Valid id and Invalid password', (done) => {
        chai.request(server)
          .delete('/api/replies/test')
          .send({ 
            reply_id:replyID,
            delete_password: 'dds' })
          .end((err, res) => {
            assert.equal(res.status, 200);
            console.log(res.body)
            assert.equal(res.body, 'incorrect password')
            done();
          });
      });

      test('Valid _id and delete_password', (done) => {
        // issueId
        chai.request(server)
          .delete('/api/replies/test')
          .send({
            reply_id: replyID,
            delete_password: 'partyhard'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success')
            done();
          });
      });
    });
    
  });

});
