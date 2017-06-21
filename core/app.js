#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var marked = require("marked");
var fs = require("fs");
var chalk = require("chalk");
var ejs_1 = require("ejs");
var posts = [];
var blog = JSON.parse(fs.readFileSync(__dirname + "/../_config.json", "utf-8"));
try {
    fs.readdir(__dirname + "/../mdposts", function (err, files) {
        if (err) {
            console.error(err);
            return;
        }
        files.forEach(function (file, index) {
            setTimeout(function () {
                fs.stat(__dirname + "/../mdposts/" + file, function (err, stat) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    var created = stat.ctime.toDateString();
                    var lastupdate = stat.mtime.toDateString();
                    var foldername = created.replace(/\s+/g, '-').toLowerCase();
                    var subject = file.substr(0, file.length - 3);
                    var filename = subject.replace(/\s+/g, '-').toLowerCase();
                    var outFile = __dirname + "/../posts/" + foldername + "/" + filename + ".html";
                    var context = marked(fs.readFileSync(__dirname + "/../mdposts/" + file, "utf-8"), { gfm: true });
                    if (!fs.existsSync(__dirname + "/../posts/" + foldername)) {
                        fs.mkdirSync(__dirname + "/../posts/" + foldername, "0777");
                    }
                    fs.writeFile(outFile, ejs_1.render(fs.readFileSync(__dirname + "/../_template/post.ejs", 'utf-8'), {
                        post: {
                            subject: subject,
                            created: created,
                            lastupdate: lastupdate,
                            context: context,
                            link: "posts/" + foldername + "/" + filename + ".html"
                        },
                        blog: blog
                    }, {
                        filename: __dirname + "/../_template/post.ejs"
                    }), {
                        encoding: "utf-8"
                    }, function (err) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        posts.push({
                            subject: subject,
                            created: created,
                            lastupdate: lastupdate,
                            link: "posts/" + foldername + "/" + filename + ".html"
                        });
                        console.log(chalk.cyan("[info]") + " " + chalk.magenta("\"" + file + "\"") + " " + chalk.blue('converted to') + " " + chalk.magenta("\"" + foldername + "/" + filename + ".html\"") + ".");
                    });
                });
            }, 100 * index);
        });
    });
}
catch (e) {
    console.error("" + chalk.red("[error] " + e.message));
}
finally {
    setTimeout(function () {
        fs.writeFile(__dirname + "/../index.html", ejs_1.render(fs.readFileSync(__dirname + "/../_template/index.ejs", 'utf-8'), {
            posts: posts.reverse(),
            blog: blog
        }, {
            filename: __dirname + "/../_template/index.ejs"
        }), function (err) {
            if (err) {
                console.error(err);
                return;
            }
            console.log("" + chalk.cyan("[Done] " + chalk.magenta("\"index.ejs\"") + " " + chalk.blue('converted to') + " " + chalk.magenta("\"index.html\"") + "."));
        });
    }, 5000);
}
