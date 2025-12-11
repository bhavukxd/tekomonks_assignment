const http = require("http");
const https = require("https");

const PORT = 8000;
const site = "https://time.com";

function getTimePage(done) {
https.get(site, function (res) {
    let html = "";

    res.on("data", function (chunk) {
     html += chunk;
    });

res.on("end", function () {
    done(null, html);
     });

 }).on("error", function (err) {
     done(err);
});
}

function stripHTMLTags(str) {
 let result = "";
let insideTag = false;

for (let i = 0; i < str.length; i++) {
   if (str[i] === "<") {
    insideTag = true;
} else if (str[i] === ">") {
      insideTag = false;
  } else if (!insideTag) {
     result += str[i];
      }
    }

 return result.trim();
}

function extractStories(html) {
    let output = [];
    let parts = html.split("<a");

    for (let i = 0; i < parts.length && output.length < 6; i++) {
        let piece = parts[i];

        if (piece.includes("href=")) {
            let hrefPos = piece.indexOf("href=") + 6;
            let quoteType = piece[hrefPos - 1];
            let hrefEnd = piece.indexOf(quoteType, hrefPos);
            let link = piece.substring(hrefPos, hrefEnd);

            let textStart = piece.indexOf(">") + 1;
            let textEnd = piece.indexOf("</a>");
            if (textEnd === -1) continue;

            let title = stripHTMLTags(piece.substring(textStart, textEnd));

            if (title.length < 10) continue;

            if (link.startsWith("/")) {
                link = "https://time.com" + link;
            }

            if (link.includes("time.com")) {
                output.push({ title: title, link: link });
            }
        }
    }

    return output;
}

const server = http.createServer(function (req, res) {

    if (req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("running");
        return;
    }

    if (req.url === "/getTimeStories") {
        getTimePage(function (err, html) {
            if (err) {
                console.log("Error aya: ", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Server error" }));
                return;
            }

            let result = extractStories(html);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result));
        });

    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Route error(not right)");
    }
});

server.listen(PORT, function () {
    console.log("http://localhost:" + PORT);
});
