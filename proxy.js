const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
app.set("port", process.env.PORT || 8080);

const morgan = require("morgan");
app.use(morgan("combined"));

const cors = require("cors");
app.use(cors({ origin: "*" }));

const jwt = require("jsonwebtoken");
const { createProxyMiddleware } = require("http-proxy-middleware");

const mainProxy = createProxyMiddleware({
  target: process.env.MAIN_API_ADDRESS,
  changeOrigin: true,
  ws: true,
  pathRewrite: (path, req) => {
    if (req.headers["upgrade"] === "websocket") {
      return path.replace(/^\/api\/main/, "");
    }
    return path;
  },
});

app.use("/api/main", mainProxy);

const clientProxy = createProxyMiddleware({
  target: process.env.CLIENT_API_ADDRESS + "/admin",
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader(
        "Authorization",
        `Bearer ${jwt.sign(
          { sub: "admin" },
          process.env.CLIENT_ADMIN_JWT_TOKEN_SECRET,
          { expiresIn: "30s" }
        )}`
      );
    },
  },
});
app.use("/api/client", clientProxy);

const server = app.listen(app.get("port"), () =>
  console.log(`Listening on port ${app.get("port")}`)
);

server.on("upgrade", mainProxy.upgrade);
