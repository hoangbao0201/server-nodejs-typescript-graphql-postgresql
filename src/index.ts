require("dotenv").config();
import "reflect-metadata";
import express from "express";
import { createConnection } from "typeorm";
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import { ApolloServer } from "apollo-server-express/dist/ApolloServer";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { UserResolver } from "./resolvers/user";
import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import session from "express-session";
import { COOKIE_NAME, __prod__ } from "./constants";
import { Context } from "./types/Context";
import { PostResolver } from "./resolvers/post";

const main = async () => {
    await createConnection({
        type: "postgres",
        database: "reddit",
        username: process.env.DB_USERNAME_DEV,
        password: process.env.DB_PASSWORD_DEV,
        logging: true,
        synchronize: true, // Check database
        entities: [User, Post],
    });

    const app = express();

    // Session/Cookie store
    const mongoUrl = `mongodb+srv://${process.env.SESSION_DB_USERNAME_PROD}:${process.env.SESSION_DB_PASSWORD_PROD}@cluster0.xrgqjzx.mongodb.net/?retryWrites=true&w=majority`;
    await mongoose.connect(mongoUrl);

    console.log("MongoDB connected");
    app.use(
        session({
            name: COOKIE_NAME,
            store: MongoStore.create({ mongoUrl }),
            cookie: {
                maxAge: 1000 * 60 * 60, // One hour
                httpOnly: true, // JS front end cannot access the
                secure: __prod__, // Cookie only work in https
                sameSite: "lax", // Protection againt CSRF
            },
            secret: process.env.SESSION_SECRET_DEV_PROD as string,
            saveUninitialized: false, // Don't save emty session, right from the start
            resave: false,
        })
    );

    const apoloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, UserResolver, PostResolver],
            validate: false,
        }),
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
        context: ({ req, res } : Context ) => ({ req, res })
    });

    await apoloServer.start();

    // Cho apoloServer ngồi trên app
    apoloServer.applyMiddleware({ app, cors: false });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(
            `Server started on port ${PORT}. GraphQL server  started on localhost:${PORT}${apoloServer.graphqlPath}`
        );
    });
};

main().catch((error) => console.log(error));
