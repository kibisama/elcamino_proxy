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

app.use(
  "/api/main",
  createProxyMiddleware({
    target: process.env.MAIN_API_ADDRESS,
    changeOrigin: true,
    ws: true,
  })
);
app.use(
  "/api/client",
  createProxyMiddleware({
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
  })
);

app.listen(app.get("port"), () =>
  console.log(`Listening on port ${app.get("port")}`)
);
