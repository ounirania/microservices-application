const sqlite3 = require('sqlite3').verbose();

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');


const movieProtoPath = 'movie.proto';
const tvShowProtoPath = 'tvShow.proto';
const movieProtoDefinition = protoLoader.loadSync(movieProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const tvShowProtoDefinition = protoLoader.loadSync(tvShowProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const movieProto = grpc.loadPackageDefinition(movieProtoDefinition).movie;
const tvShowProto = grpc.loadPackageDefinition(tvShowProtoDefinition).tvShow;
const clientMovies = new movieProto.MovieService('localhost:50051', grpc.credentials.createInsecure());
const clientTVShows = new tvShowProto.TVShowService('localhost:50052', grpc.credentials.createInsecure());


const db = new sqlite3.Database('./database.db');

db.run(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS tvShows (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT
  )
`);


const resolvers = {
  Query: {
    tvShow: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM tvShows WHERE id = ?', [id], (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve(row);
          } else {
            resolve(null);
          }
        });
      });
    },
    tvShows: () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM tvShows', (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    },
    movies: () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM movies', (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    },
},
Mutation: {
    addTVShow: (_, { id,title, description }) => {
      return new Promise((resolve, reject) => {
        db.run('INSERT INTO tvShows (id,title, description) VALUES (?, ?, ?)', [id,title, description], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, title, description });
          }
        });
      });
    },
    addMovie: (_, { id,title, description }) => {
      return new Promise((resolve, reject) => {
        db.run('INSERT INTO movies (id,title, description) VALUES (?, ?, ?)', [id,title, description], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, title, description });
          }
        });
      });
    }
  },
};
module.exports = resolvers;
