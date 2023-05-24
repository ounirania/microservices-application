const sqlite3 = require('sqlite3').verbose();


const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const movieProtoPath = 'movie.proto';
const movieProtoDefinition = protoLoader.loadSync(movieProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const movieProto = grpc.loadPackageDefinition(movieProtoDefinition).movie;
const db = new sqlite3.Database('./database.db'); 

db.run(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT
  )
`);

const movieService = {
  getMovie: (call, callback) => {
    const { movie_id } = call.request;
    
    db.get('SELECT * FROM movies WHERE id = ?', [movie_id], (err, row) => {
      if (err) {
        callback(err);
      } else if (row) {
        const movie = {
          id: row.id,
          title: row.title,
          description: row.description,
        };
        callback(null, { movie });
      } else {
        callback(new Error('Movienot found'));
      }
    });
  },
  searchMovies: (call, callback) => {
    db.all('SELECT * FROM movies', (err, rows) => {
      if (err) {
        callback(err);
      } else {
        const movies = rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
        }));
        callback(null, { movies });
      }
    });
  },
  CreateMovie: (call, callback) => {
    const { movie_id, title, description } = call.request;
    db.run(
      'INSERT INTO movies (id, title, description) VALUES (?, ?, ?)',
      [movie_id, title, description],
      function (err) {
        if (err) {
          callback(err);
        } else {
          const movie = {
            id: movie_id,
            title,
            description,
          };
          callback(null, { movie });
        }
      }
    );
  },
};



const server = new grpc.Server();
server.addService(movieProto.MovieService.service, movieService);
const port = 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Failed to bind server:', err);
      return;
    }
  
    console.log(`Server is running on port ${port}`);
    server.start();
  });
console.log(`Movie microservice running on port ${port}`);
