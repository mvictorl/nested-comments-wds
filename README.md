## Source are Web Dev Simplified YouTube [video](https://www.youtube.com/watch?v=lyNetvEfvT0)

1. Server
   1. `npm init -y`
   2. `npm i prisma nodemon -D`
   3. `npm i @prisma/client`
   4. `npx prisma init`
      1. `set NODE_TLS_REJECT_UNAUTHORIZED=0`
      
      (ignore SSL certificate)

      2. Open PowerShell as administrator (npm global warning):
      
          ```cmd
          Set-ExecutionPolicy Unrestricted -Scope CurrentUser -Force
          npm install --global --production npm-windows-upgrade
          npm-windows-upgrade --npm-version latest
          Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
          ```

   5. Edit `prisma/schema.prisma` file, add models
   6. npx prisma migrate dev (create DB & sql file, repeat after any changes in prisma schema)
   7. To add the mocke data
      1. Create `seed.js` file
      2. Add to `package.json`
          ```json
          "prisma": {
            "seed": "node prisma/seed.js"
          }
          ```
      
      3. And add `"type": "module"` for use import into `seed.js` file
      4. `npx prisma db seed`
      
      DB seeding also by `prisma migrate db` & `prisma migrate reset`

      1. Add next packages:
         1. `fastify` - web-server (the analog of express)
         2. `dotenv` - read `.env` file
         3. `@fastify/cookie` - parse and set cookie headers (for authorization)
         4. `@fastify/cors` - enables the use of CORS 
         5. `@fastify/sensible` - adds some useful decorators such as HTTP errors and assertions
      2. Create `server.js` file
         1. Ctrl-Shift-P -> "TypeScript: Restart TS server"
2. Client
   1. `npx create-react-app@5.0.1 client`
   2. Remove unnecessary files and code
   3. `npm i axios`
   4. ...
   5. Add packages: `react-router-dom` & `react-icons`

3. Warning in `create-react-app` while start:
```bash
(node:5296) [DEP_WEBPACK_DEV_SERVER_ON_AFTER_SETUP_MIDDLEWARE] DeprecationWarnin
g: 'onAfterSetupMiddleware' option is deprecated. Please use the 'setupMiddlewar
es' option.
(Use `node --trace-deprecation ...` to show where the warning was created)      
(node:5296) [DEP_WEBPACK_DEV_SERVER_ON_BEFORE_SETUP_MIDDLEWARE] DeprecationWarni
ng: 'onBeforeSetupMiddleware' option is deprecated. Please use the 'setupMiddlew
ares' option.
```

Goto `node_modules/react-scripts/config/webpackDevServer.config.js` and change `onBeforeSetupMiddleware(devServer)` and `onAfterSetupMiddleware(devServer)` on next code:
```js
setupMiddlewares: (middlewares, devServer) => {
    if (!devServer) {
        throw new Error('webpack-dev-server is not defined')
    }

    if (fs.existsSync(paths.proxySetup)) {
        require(paths.proxySetup)(devServer.app)
    }

    middlewares.push(
        evalSourceMapMiddleware(devServer),
        redirectServedPath(paths.publicUrlOrPath),
        noopServiceWorkerMiddleware(paths.publicUrlOrPath)
    )

    return middlewares;
},
```