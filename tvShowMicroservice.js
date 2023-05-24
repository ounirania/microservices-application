const sqlite3 = require('sqlite3').verbose();

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');


const tvShowProtoPath = 'tvShow.proto';
const tvShowProtoDefinition = protoLoader.loadSync(tvShowProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const tvShowProto = grpc.loadPackageDefinition(tvShowProtoDefinition).tvShow;
const db = new sqlite3.Database('./database.db'); 

db.run(`
  CREATE TABLE IF NOT EXISTS tvShows (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT
  )
`);


const tvShowService = {
  getTvShow: (call, callback) => {
    const { tvShow_id } = call.request;
    
    db.get('SELECT * FROM tvShows WHERE id = ?', [tvShow_id], (err, row) => {
      if (err) {
        callback(err);
      } else if (row) {
        const tvShow = {
          id: row.id,
          title: row.title,
          description: row.description,
        };
        callback(null, { tvShow });
      } else {
        callback(new Error('TvShow not found'));
      }
    });
  },
  searchTvShows: (call, callback) => {
    db.all('SELECT * FROM tvShows', (err, rows) => {
      if (err) {
        callback(err);
      } else {
        const tvShows = rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
        }));
        callback(null, { tvShows });
      }
    });
  },
  CreateTvShow: (call, callback) => {
    const { tvShow_id, title, description } = call.request;
    db.run(
      'INSERT INTO tvShows (id, title, description) VALUES (?, ?, ?)',
      [tvShow_id, title, description],
      function (err) {
        if (err) {
          callback(err);
        } else {
          const tvShow = {
            id: tvShow_id,
            title,
            description,
          };
          callback(null, { tvShow });
        }
      }
    );
  },
};



const server = new grpc.Server();
server.addService(tvShowProto.TVShowService.service, tvShowService);
const port = 50052;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Failed to bind server:', err);
      return;
    }
  
    console.log(`Server is running on port ${port}`);
    server.start();
  });
console.log(`TV show microservice running on port ${port}`);
