const express = require('express');
const bodyParser = require("body-parser");
const http = require('http');
const {
    createLogger,
    format,
    transports
} = require("winston");
const crypto = require("crypto");
const responseTime = require('response-time');
const config = require('config');
require("dotenv").config();

const app = express();
const jsonParser = bodyParser.json();
const port = 8081;

const logLevels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
};

const logger = createLogger({
    format: format.combine(format.timestamp({format: "YYYY-MM-DD HH:mm:ss.SSS"}), format.json()),
    levels: logLevels,
    transports: [new transports.Console()],
    level: "info",
    defaultMeta: {
        environment: "local",
        domain: "logging-poc",
        app_name: "logging-app2-node"
    }
});

const thirdAppOptions = {
    host: process.env.THIRD_APP_HOST,
    port: process.env.THIRD_APP_PORT,
    path: process.env.THIRD_APP_PATH,
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(JSON.stringify({}))
    }
}

app.use(responseTime());

app.post('/v1/app2/logging', jsonParser, (req, res) => {
    const traceId = req.headers["x-b3-traceid"];
    const spanId = req.headers["x-b3-spanid"];

    logger.defaultMeta["trace_id"] = traceId;
    logger.defaultMeta["span_id"] = spanId;

    const correlation = crypto.randomBytes(8).toString("hex");
    logger.info(getRequestInfo(req, correlation));

    logger.info("A request was made to second application");  
    logger.info("Sending a POST request to second application");

    const thirdAppRequest = http.request({...thirdAppOptions, headers: {...thirdAppOptions.headers, "Content-Length": Buffer.byteLength(JSON.stringify(req.body)), "X-B3-TraceId": traceId, "X-B3-SpanId": crypto.randomBytes(8).toString("hex"), "X-B3-ParentSpanId": spanId}}, thirdAppResponse => {
        thirdAppResponse.on("data", chunk => {
          console.log(chunk);
        })
    });
    
    thirdAppRequest.write(JSON.stringify(req.body));
    thirdAppRequest.end();

    res.send();
    logger.info(getResponseInfo(res, correlation));
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

function getRequestInfo(req, correlation) {
    const hostPort = req.headers.host.split(":");

    const message = {
        "origin": "remote",
        "type": "request",
        "correlation": correlation,
        "protocol": "HTTP/1.1",
        "remote": req.ip,
        "method": req.method,
        "uri": req.protocol + "://" + hostPort[0] + ":" + hostPort[1] + req.url,
        "host": hostPort[0],
        "path": req.url,
        "scheme": "http",
        "port": hostPort[1],
        "headers": {
          "connection": [
            req.headers.connection
          ],
          "content-length": [
            req.headers["content-length"]
          ],
          "content-type": [
            req.headers["content-type"]
          ],
          "host": [
            req.headers.host
          ],
          "x-b3-parentspanid": [
            req.headers["x-b3-parentspanid"]
          ],
          "x-b3-spanid": [
            req.headers["x-b3-spanid"]
          ],
          "x-b3-traceid": [
            req.headers["x-b3-traceid"]
          ]
        },
        "body": req.body
      }

    return JSON.stringify(message);
}

function getResponseInfo(res, correlation) {
    const message = {
        "origin": "local",
        "type": "response",
        "correlation": correlation,
        "duration": Math.round(res.getHeaders()["x-response-time"].split("ms")[0]),
        "protocol": "HTTP/1.1",
        "status": res.statusCode,
        "headers": {
          "Connection": [
            res.req.headers.connection
          ],
          "Date": [
            new Date()
          ],
          "Keep-Alive": [
            "timeout=5"
          ],
          "Transfer-Encoding": [
            "chunked"
          ]
        }
    }

    return JSON.stringify(message);
}
