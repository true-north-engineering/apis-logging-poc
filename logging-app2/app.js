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
    critical: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4
};

const logger = createLogger({
    format: format.combine(format.timestamp({format: "YYYY-MM-DD HH:mm:ss.SSS"}), format.json()),
    levels: logLevels,
    transports: [new transports.Console()],
    level: "info",
    defaultMeta: {
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
    const source = req.headers.source;
    const destination = req.headers.destination;

    logger.defaultMeta["trace_id"] = traceId;
    logger.defaultMeta["span_id"] = spanId;

    const correlation = crypto.randomBytes(8).toString("hex");

    logger.info(getRequestInfo(req, correlation));

    logger.info("A request was made to second application");  
    logger.info("Sending a POST request to second application");

    const thirdAppRequest = http.request({...thirdAppOptions, headers: {...thirdAppOptions.headers, "Content-Length": Buffer.byteLength(JSON.stringify(req.body)), "X-B3-TraceId": traceId, "X-B3-SpanId": crypto.randomBytes(8).toString("hex"), "X-B3-ParentSpanId": spanId, "source": source, "destination": destination}}, thirdAppResponse => {
      thirdAppResponse.on('data', chunk => {
      })

      logger.info(getResponseInfo(thirdAppResponse.statusCode, thirdAppResponse.headers.connection, correlation));
    });
    
    thirdAppRequest.write(JSON.stringify(req.body));
    thirdAppRequest.end();

    res.send();
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
          ],
          "source": [
            req.headers.source
          ],
          "destination": [
            req.headers.destination
          ]
        },
        "body": req.body
      }

    return JSON.stringify(message);
}

function getResponseInfo(status, connection, correlation) {
    const message = {
        "origin": "local",
        "type": "response",
        "correlation": correlation,
        "duration": "undefined",
        "protocol": "HTTP/1.1",
        "status": status,
        "headers": {
          "Connection": [
            connection
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
