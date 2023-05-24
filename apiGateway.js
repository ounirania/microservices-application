const sqlite3 = require('sqlite3').verbose();

const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require ('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');


const movieProtoPath = 'movie.proto';
const tvShowProtoPath = 'tvShow.proto';

const resolvers = require('./resolvers');
const typeDefs = require('./schema');

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


const app = express();
app.use(bodyParser.json());

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

  


const server = new ApolloServer({ typeDefs, resolvers });

server.start().then(() => {
    app.use(
        cors(),
        bodyParser.json(),
        expressMiddleware(server),
      );
  });


app.get('/movies', (req, res) => {
  db.all('SELECT * FROM movies', (err, rows)=> {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(rows);
      }
    });
  });

  app.post('/movie', (req, res) => {
    const { id, title, description } = req.body;
    db.run(
      'INSERT INTO movies (id, title, description) VALUES (?, ?, ?)',
      [id, title, description],
      function (err) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({ id, title, description });
        }
    });
  })
  
  app.get('/movies/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM movies WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).send(err);
      } else if (row) {
        res.json(row);
      } else {
        res.status(404).send('movie not found.');
      }
    });
  });


  
  app.get('/tvshows', (req, res) => {
    db.all('SELECT * FROM tvShows', (err, rows) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(rows);
      }
    });
  });
  
  app.get('/tvshows/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM tvShows WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).send(err);
      } else if (row) {
        res.json(row);
      } else {
        res.status(404).send('TvShow not found.');
      }
    });
  });


const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
