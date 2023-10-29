const http = require('http');
const fs = require('fs');
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/todo')
  .then(() => {
    console.log('DB Connected');
  })
  .catch((err) => {
    console.error('DB Connection Error:', err);
  });

const taskSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
  },
  dateTime: {
    type: Date,
    required: true,
  },
  status:{
    type: Boolean,
    default: false
  }
});

const Task = mongoose.model('Task', taskSchema);

const server = http.createServer(function (req, res) {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream('index.html').pipe(res);
  } 
  else if (req.url === '/register' && req.method === 'POST') {
    var rawdata = '';
    req.on('data', function (data) {
      rawdata += data;
    });
    req.on('end', function () {
      var formdata = new URLSearchParams(rawdata);
      res.writeHead(200, { 'Content-Type': 'text/html' });

      const task = new Task({
        task: formdata.get('task'),
        dateTime: formdata.get('dateTime'),
      });

      task.save()
        .then(() => {
          res.write('Data Saved Successfully');
          res.end();
        })
        .catch((error) => {
          res.write('Error Saving Data: ' + error);
          res.end();
        });
    });
  }

  else if (req.url.startsWith('/toggle/') && req.method === 'POST') {
    const taskId = req.url.split('/toggle/')[1];
    Task.findById(taskId).then(task => {
      task.status = !task.status; // Invert the status
      return task.save();
    }).then(() => {
      res.writeHead(302, { 'Location': '/view' }); // Redirect back to the view page
      res.end();
    }).catch(error => {
      // Handle error
    });
  }
  

  else if (req.url === '/view' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    Task.find().then(function (tasks) {
      // Sort tasks by the dateTime field in ascending order
      tasks.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  
      res.write("<h1>List Task Details</h1>");
      res.write("<table border=1 cellspacing=0 width=400>");
      res.write("<tr><th>Date And time</th><th>Task</th><th>Status</th><th>Delete</th>");
  
      const currentDate = new Date(); // Get the current date and time
  
      tasks.forEach(task => {
        res.write("<tr");
  
        // Check if the task's dateTime is in the past
        if (task.status) {
            res.write(" style='background-color: brown;'"); // Add a brown background for completed tasks
          }else if  (new Date(task.dateTime) < currentDate) {
          res.write(" style='background-color: red;'"); // Add a red background
        }
       
  
        res.write(">");
        res.write("<td>" + task.dateTime + "</td>");
        res.write("<td>" + task.task + "</td>");
  
        // Set the button label based on the task's current status
        const buttonLabel = task.status ? 'Incomplete' : 'Complete';
  
        // Apply CSS to make the button transparent
        res.write("<td><form action='/toggle/" + task._id + "' method='post'><button type='submit' style='background-color: transparent; border: none;'>" + buttonLabel + "</button></form></td>");
  
        res.write("<td><a href='/delete/" + task._id + "'>Delete</a></td>");
        res.write("</tr>");
      });
  
      res.end();
    });
  }
  
    else if (req.url.startsWith('/delete/') && req.method === "GET") {
        const taskId = req.url.split('/delete/')[1];
        Task.findByIdAndRemove(taskId)
            .then(() => {
                // Task deleted successfully
                res.write('Task deleted successfully');
                res.end();
            })
            .catch(error => {
                // Handle error
            });
        }
    });

server.listen(8000, function () {
  console.log('Server started at http://127.0.0.1:8000');
});
