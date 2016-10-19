function f (n, callback) {
  setTimeout(() => {
    if (n < 0) return callback(new Error('Negative number'));
    return callback(null, n);
  }, 500)
}

function Worker (name, tasks = []) {
  this.name = name;
  this.tasks = tasks;
}

Worker.prototype.task = function (gen) {
  this.tasks.push(gen);
};

Worker.prototype.run = function (ctx, callback) {
  const tasks = this.tasks[ Symbol.iterator ]();

  const iretators = [];

  function next () {
    let job = tasks.next();
    if (job.done) {
      return prev();
    }
    var iterator = job.value.call(ctx, next);
    iretators.unshift(iterator);
    var task = iterator.next();
    return task.done ? prev() : task.value(step.bind(null, iterator));
  }

  function prev () {
    let iterator = iretators.shift();
    if (!iterator) {
      return callback(null, ctx);
    }
    let task = iterator.next();
    return task.done ? prev() : task.value(step.bind(null, iterator));
  }

  function step (iterator, err, value) {
    if (err) {
      return callback(err);
    }
    let task = iterator.next(value);
    return task.done ? prev() : task.value.call(ctx, step.bind(null, iterator));
  }

  next();

};

var worker = new Worker('foo', [

  function* (next) {
    console.log(yield f.bind(null, this[ 0 ] = 0));
    yield next;
    console.log(yield f.bind(null, this[ 4 ] = 4));
  },


  function* (next) {
    console.log(yield f.bind(null, this[ 1 ] = 1));
    yield next;
    console.log(yield f.bind(null, this[ 3 ] = 3));
  },

  function* () {
    console.log(yield f.bind(null, this[ 2 ] = 2));
  }

]);

worker.run({}, function (err, ctx) {
  if(err) {
    return console.log(err);
  }
  console.log(ctx);
});
