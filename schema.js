const { gql } = require('@apollo/server');

const typeDefs = `#graphql
  type Movie {
    id: String!
    title: String!
    description: String!
  }

  type TVShow {
    id: String!
    title: String!
    description: String!
  }

  type Query {
    movie(id: String!): Movie
    movies: [Movie]
    tvShow(id: String!): TVShow
    tvShows: [TVShow]
  }
  type Mutation {
    addMovie(id: String!, title: String!, description:String!): Movie
    addTVShow(id: String!, title: String!, description:String!): TVShow
    
  }
`;

module.exports = typeDefs