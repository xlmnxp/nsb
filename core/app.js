#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var marked = require("marked");
var fs_1 = require("fs");
var chalk = require("chalk");
var path_1 = require("path");
var ejs_1 = require("ejs");
var posts = [];
var blog = JSON.parse(fs_1.readFileSync(path_1.normalize(__dirname + "/../_config.json"), "utf-8"));
var blogInfo = function () { return JSON.parse(JSON.stringify(blog)); };
function deleteFolderRecursive(path) {
    if (fs_1.existsSync(path)) {
        fs_1.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs_1.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            }
            else {
                fs_1.unlinkSync(curPath);
            }
        });
        fs_1.rmdirSync(path);
    }
}
;
function pagination(total, page) {
    var result = [];
    if (page < 1)
        page = 1;
    var pagination = blogInfo().pagination;
    var pages = pagination.size;
    var results = pagination.resultsPerPage;
    var numberOfPages = pages;
    var resultsPerPage = results;
    var numberOfRows = total;
    var totalPages = Math.ceil(numberOfRows / resultsPerPage);
    var halfPages = Math.floor(numberOfPages / 2);
    var range = { 'start': 1, 'end': totalPages };
    var isEven = (numberOfPages % 2 == 0);
    var atRangeEnd = totalPages - halfPages;
    if (isEven) {
        atRangeEnd++;
    }
    if (totalPages > numberOfPages) {
        if (page <= halfPages) {
            range['end'] = numberOfPages;
        }
        else if (page >= atRangeEnd) {
            range['start'] = totalPages - numberOfPages + 1;
        }
        else {
            range['start'] = page - halfPages;
            range['end'] = page + halfPages;
            if (isEven)
                range['end']--;
        }
    }
    if (page > 1) {
        result.push({ "page": (page - 1), "name": pagination.previous, "active": false });
    }
    for (var i = range['start']; i <= range['end']; i++) {
        if (i == page) {
            result.push({ "page": i, "name": i, "active": true });
        }
        else {
            result.push({ "page": (i), "name": i, "active": false });
        }
    }
    if (page < totalPages) {
        result.push({ "page": (page + 1), "name": pagination.next, "active": false });
    }
    return result;
}
try {
    deleteFolderRecursive(path_1.normalize(__dirname + "/../posts"));
    fs_1.mkdir(path_1.normalize(__dirname + "/../posts"), "0777", function (err) {
        if (err) {
            console.error(err);
            return;
        }
        fs_1.readdir(path_1.normalize(__dirname + "/../mdposts"), function (err, files) {
            if (err) {
                console.error(err);
                return;
            }
            files.forEach(function (file, index) {
                setTimeout(function () {
                    fs_1.stat(path_1.normalize(__dirname + "/../mdposts/" + file), function (err, stat) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        var created = stat.ctime;
                        var lastupdate = stat.mtime;
                        var foldername = created.toDateString().replace(/\s+/g, '-').toLowerCase();
                        var subject = file.substr(0, file.length - 3);
                        var filename = subject.replace(/\s+/g, '-').toLowerCase();
                        var outFile = path_1.normalize(__dirname + "/../posts/" + foldername + "/" + filename + ".html");
                        var context = marked(fs_1.readFileSync(path_1.normalize(__dirname + "/../mdposts/" + file), "utf-8"), { gfm: true });
                        if (!fs_1.existsSync(path_1.normalize(__dirname + "/../posts/" + foldername))) {
                            fs_1.mkdirSync(path_1.normalize(__dirname + "/../posts/" + foldername), "0777");
                        }
                        fs_1.writeFile(outFile, ejs_1.render(fs_1.readFileSync(path_1.normalize(__dirname + "/../_template/post.ejs"), 'utf-8'), {
                            post: {
                                subject: subject,
                                created: new Date(created),
                                lastupdate: new Date(lastupdate),
                                context: context,
                                link: path_1.normalize("posts/" + foldername + "/" + filename + ".html")
                            },
                            blog: blogInfo()
                        }, {
                            filename: path_1.normalize(__dirname + "/../_template/post.ejs")
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
                                link: path_1.normalize("posts/" + foldername + "/" + filename + ".html")
                            });
                            console.log(chalk.cyan("[info]") + " " + chalk.magenta("\"" + file + "\"") + " " + chalk.blue('converted to') + " " + chalk.magenta("\"" + foldername + "/" + filename + ".html\"") + ".");
                        });
                    });
                }, 100 * index);
            });
        });
    });
}
catch (e) {
    console.error("" + chalk.red("[error] " + e.message));
}
finally {
    setTimeout(function () {
        posts.sort(function (a, b) {
            return b.created - a.created;
        });
        var totalPages = Math.ceil(posts.length / 12);
        deleteFolderRecursive(path_1.normalize(__dirname + "/../page"));
        fs_1.mkdir(path_1.normalize(__dirname + "/../page"), function (err) {
            if (err) {
                console.error(err);
                return;
            }
            for (var i = 0; i < totalPages; i++) {
                fs_1.mkdirSync(path_1.normalize(__dirname + "/../page/" + (i + 1)), "0777");
                fs_1.writeFile(path_1.normalize(__dirname + "/../page/" + (i + 1) + "/index.html"), ejs_1.render(fs_1.readFileSync(path_1.normalize(__dirname + "/../_template/index.ejs"), 'utf-8'), {
                    posts: posts.slice(i * 12, i + 1 * 12),
                    pages: pagination(posts.length, i + 1),
                    blog: blogInfo(),
                    pageNumber: i + 1
                }, {
                    filename: path_1.normalize(__dirname + "/../_template/index.ejs")
                }), function (err) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
                console.log(chalk.cyan("[info]") + " " + chalk.magenta("\"page-" + (i + 1) + ".html\"") + " " + chalk.blue('created') + ". ");
            }
        });
        fs_1.writeFile(path_1.normalize(__dirname + "/../index.html"), ejs_1.render(fs_1.readFileSync(path_1.normalize(__dirname + "/../_template/index.ejs"), 'utf-8'), {
            posts: posts.slice(0, 12),
            pages: pagination(posts.length, 1),
            blog: blogInfo(),
            pageNumber: 1
        }, {
            filename: path_1.normalize(__dirname + "/../_template/index.ejs")
        }), function (err) {
            if (err) {
                console.error(err);
                return;
            }
            console.log("" + chalk.cyan("[Done] " + chalk.magenta("\"index.ejs\"") + " " + chalk.blue('converted to') + " " + chalk.magenta("\"index.html\"") + "."));
        });
    }, 5000);
}
