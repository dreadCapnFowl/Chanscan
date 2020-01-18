// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
let request = require('request');
let fetch = require('node-fetch');

let Astoria = require('astoria')

let threadMonitor = new Astoria({
  interval: 10,
  updatesOnly: true,
})

let boardMonitor = new Astoria({
  interval: 60,
  updatesOnly: true,
})

var post_list = [];
var unsub_calls = {}
var update_div = document.getElementById("updates");
var thread_div = document.getElementById("thread_display")

function getPostHTML(board, post, op, preview)
{
  var img = '';
  var resto = '';
  if (post['resto'] == 0)
    resto = post['no']
  else
    resto = post['resto']
  if (post['tim'])
  {
    if (post['ext'] != '.webm')
    {
      img = `
      <img onload=scrolldown() class="image" src="http://is2.4chan.org/${board}/${post['tim']}${post['ext']}">
      `;
    } else {
      img = `
        a webm
      `;
    }
  }
  var ret = `
    <div class="post" >
        <div class="postInfo desktop">
          <span class="nameBlock">
            <span class="name">Anonymous</span>
          </span>
          <span class="dateTime">
            ${post['now']}
          </span>
          <span class="postNum desktop">
            No.<a href='#' onclick="display_thread('${board}', ${resto})">${post['no']}</a>
          </span>
        </div>
        <div class="postcontent">
          ${img}
          <div>
            ${post['com'] ? post['com'] : ''}
          </div>
        </div>
    </div>
  `;
  scrolldown()
  return ret;
}
function monitorBoard(board)
{
  let unsub = new Astoria({
    updatesOnly: false,
  }).board(board)
  	.listen((context, threads, err) => {
  		if (err) {
  			return console.log(err)
  		}
      console.log('thread update')
  		threads.forEach(thread =>
      {
          //update_div.scrollTop = update_div.scrollHeight;

          threadMonitor.board(board)
        	.thread(thread.no)
        	.listen((context, posts, err) => {
        		if (err) {
        			return console.log(err)
        		}

        		posts.forEach(post => {
              post['board'] = board;
              post_list.push(post)
            })
        	})
      })
      unsub();
      unsub_calls[board] = boardMonitor.board(board)
      	.listen((context, threads, err) => {
      		if (err) {
      			return console.log(err)
      		}
            threads.forEach(thread => {
              console.log('new thread')
            thread['board'] = board;
            post_list.push(thread)
          })
        })
  	})
}

function scrolldown() {
    update_div.scrollTop = update_div.scrollHeight;
}

let threadsub = function() {}
function display_thread(board, id)
{
  threadsub();
  let unsub = new Astoria({
    updatesOnly: false,
  }).board(board)
  .thread(id)
  .listen((context, posts, err) => {
    if (err) {
      return console.log(err)
    }
    thread_div.innerHTML = '';
    posts.forEach(post => {
      thread_div.innerHTML += getPostHTML(board, post, false, false)
    })
    threadsub = new Astoria({
      updatesOnly: true,
    }).board(board)
    .thread(id)
    .listen((context, posts, err) => {
      if (err) {
        return console.log(err)
      }
      posts.forEach(post => {
        thread_div.innerHTML += getPostHTML(board, post, false, false)
      })
    })
    unsub()
  })
}
monitorBoard('b')

var lastlen = 0
setInterval(function() {
  if (post_list.length != lastlen)
  {
    lastlen = post_list.length;
    update_div.innerHTML = ""
    post_list.slice(-50).forEach(post => {
        update_div.innerHTML += getPostHTML(post['board'], post, true, true)
    })
  }
}, 1000, post_list)
