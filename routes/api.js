/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var bcrypt = require('bcrypt');
let Thread = require('../models/Thread');
let Reply = require('../models/Reply');
let Board = require('../models/Board');

module.exports = function (app) {
  // Create new board route, posted from index.ejs
  app.post('/api/board', (req, res) => {
    Board.findOne({ name: req.body.name }, (err, board) => {
      // If board already exists, dont remake it
      if (board) res.json('Board Exists Already')
      else {
        // Create the board if new board
        Board.create({ name: req.body.name }, (err, newBoard) => {
          err ? res.json(err) : res.redirect('/b/' + newBoard.name)
        });
      }
    });
  });;

  app.route('/api/threads/:board')
    .get((req, res) => {
      // Get ten most recently bumped threads
      // Get three most recent replies to each thread
      // Reported and delete passwords not shown

      Board
        .findOne({ name: req.params.board })
        // Populate threads and populate them with replies
        // https://mongoosejs.com/docs/populate.html#deep-populate
        .populate({ path: 'threads', populate: { path: 'replies' } })
        .exec((err, foundBoard) => {
          // Find the selected board, and populate its threads
          if (err) res.json(err)
          else {
            let getThreads;

            // Only get the first 10 threads
            if (foundBoard.threads) getThreads = foundBoard.threads.reverse().slice(0, 10);
            
            // Only get the first three replies for each thread
            let threads = getThreads.map(thread => {
              // Map so only have the first 3 replies
              return {
                id: thread.id,
                board: thread.board,
                text: thread.text,
                created_on: thread.created_on,
                bumped_on: thread.bumped_on,
                reported: thread.reported,
                delete_password: thread.delete_password,
                replies: thread.replies.reverse().slice(0, 3)
              }
            })

          // TESTING
            res.json({board:foundBoard, threads})

            // ACTUAL ROUTE
            // Load only recent threads associated with the board
            // res.render('recentThreads', { board: foundBoard, threads })
          }
        })
    })

    .post((req, res) => {
      // Create new board 
      Board.findOne({ name: req.params.board }, (err, foundBoard) => {
        if (err) res.json(err)
        else {
          // Create a new thread
          Thread.create({
            board: req.params.board,
            text: req.body.text,
            delete_password: bcrypt.hashSync(req.body.delete_password, 12) // Hash password
          }, (err, newThread) => {
            // console.log(foundBoard)
            // Add the newThread to the new board
            foundBoard.threads.push(newThread);
            foundBoard.save();
            // Redirect to the new thread page
            err ? res.json(err) : res.redirect('/b/' + foundBoard.name);
          });
        }
      })
    
    })
    .delete((req, res) => {
      Thread.findById(req.body.id, (err, foundThread) => {
        if (err) res.json('No Thread ID passed.')
        else {
          let board = foundThread.board;
          // Compare the password input from user to that of the reply
          bcrypt.compare(req.body.delete_password, foundThread.delete_password, (err, response) => {
            if (response) {
              Thread.findByIdAndRemove(req.body.id, (err, removedThread) => {
                err ? res.json('could not delete ' + removedThread._id) : res.json('success');
              })
            }
            else res.json('incorrect password')
          })
        }
      })

    }) 
    .put((req, res) => {
      Thread.findById(req.body.id, (err, foundThread) => {
        foundThread.reported = true;
        foundThread.save();
        err ? res.json(err) : res.json('success')
      })
    });// End of the /api/threads/:board
  
    
  app.route('/api/replies/:board')
    .post((req, res) => {
      Thread.findById(req.body.id, (err, thread) => {
        let delete_password = bcrypt.hashSync(req.body.delete_password, 12);
        // Pass the thread id to the reply to use to select certain replies
        Reply.create({ text: req.body.text, delete_password, thread: req.body.id + '' }, (err, createdReply) => {
          // Find the board which reply is being posted to
          thread.replies.push(createdReply); // Store replies
          thread.bumped_on = createdReply.created_on; // Change date to current
          thread.save()

          // TESTING
          res.json({ thread,reply:createdReply })

          // AACTUAL ROUTING
          // res.redirect('/b/' + req.params.board + '/' + thread._id)
        });
      });
    })

    .get((req, res) => {
      // If query thread with its id
      let deletions;

      if (req.query.thread_id) {
        Thread.findById(req.query.thread_id).populate('replies').exec((err, foundThread) => {
          if (req.query.delete === 'allowed') { deletions = true }

          // TESTING
          // console.log(foundThread.replies)
          err ? res.json('Couldnt load thread.') : res.json({ thread: foundThread, replies: foundThread.replies ,query: req.query!='', deletions })

          // err ? res.json('Couldnt load thread.') : res.render('thread', { thread: foundThread,replies: foundThread.replies, query: true, deletions })
        })
      }
    })
    .delete((req, res) => {
      Reply.findById(req.body.reply_id, (err, foundReply) => {
        // console.log(foundReply)
        bcrypt.compare(req.body.delete_password, foundReply.delete_password, (err, response) => {
          if (response) {
            console.log('Deleted')
            Reply.findById(req.body.reply_id, (err, removedReply) => {
              foundReply.text = '[deleted]';
              foundReply.save();
              err ? res.json('could not delete ' + removedReply._id) : res.json('success');
            })
          } else {
            res.json('incorrect password')
          }

        })
      })
    })

    .put((req, res) => {
      Reply.findById(req.body.reply_id, (err, foundReply) => {
        foundReply.reported = true;
        foundReply.save();
        err ? res.json('Couldnt report') : res.json('success')
      })
    })

};
