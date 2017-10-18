#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var md = require("markdown-it");
var chalk = require("chalk");
var path_1 = require("path");
var ejs_1 = require("ejs");
var marked = function (markdownText) {
    return md().render(markdownText);
};
var posts = [];
var blogInfo = function () { return require(path_1.normalize(__dirname + "/../_config.json")); };
// حذف المجلد بما يحتويه
function deleteFolderRecursive(path) {
    // التحقق من هل المسار صحيح
    if (fs_1.existsSync(path)) {
        // قراءة المسار
        fs_1.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            // التحقق اذا كان الملف هو مجلد
            if (fs_1.lstatSync(curPath).isDirectory()) {
                // قم بفحصة ايضًا
                deleteFolderRecursive(curPath);
            }
            else {
                // حذف الملف
                fs_1.unlinkSync(curPath);
            }
        });
        // حذف المجلد
        fs_1.rmdirSync(path);
    }
}
;
// ازرار التنقل بين الصفحات [ السابق, 1, 2, 3 , التالي]ـ
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
// كتابة المقالات داخل مجلد "out/posts"
function writePosts() {
    return new Promise(function (resolve, reject) {
        var itemsProcessed = 0;
        // حذف المجلد "out" و المجلد "posts"
        deleteFolderRecursive(path_1.normalize(__dirname + "/../out"));
        deleteFolderRecursive(path_1.normalize(__dirname + "/../out/posts"));
        // إنشاء المجلد الرائيسية "out" بصلاحية 777
        fs_1.mkdirSync(path_1.normalize(__dirname + "/../out"), "0777");
        // انشاء المجلد "posts"
        fs_1.mkdir(path_1.normalize(__dirname + "/../out/posts"), "0777", function (err) {
            if (err) {
                reject(err);
                return;
            }
            // قراءة محتوى المجلد "mdposts"
            fs_1.readdir(path_1.normalize(__dirname + "/../mdposts"), function (err, files) {
                if (err) {
                    reject(err);
                    return;
                }
                files.forEach(function (file, index) {
                    // جلب حالة المجلد
                    fs_1.stat(path_1.normalize(__dirname + "/../mdposts/" + file), function (err, stat) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        // جلب تاريخ إنشاء المقال
                        var created = stat.ctime;
                        // جلب تاريخ اخر تعديل على المقال
                        var lastupdate = stat.mtime;
                        // تحويل تاريخ إنشاء المقال الى اسم المجلد مع تحويل كل مسافة الى شرطة "-"
                        var foldername = created.toDateString().replace(/\s+/g, '-').toLowerCase();
                        // جلب عنوان المقال
                        var subject = file.trim().substr(0, file.length - 3);
                        // تحويل عنوان المقال الى ملف
                        var filename = subject.trim().replace(/\s+/g, '-').toLowerCase();
                        // رسم مسار إستخراج الملف
                        var outFile = path_1.normalize(__dirname + "/../out/posts/" + foldername + "/" + filename + ".html");
                        // قراءة محتوى المقال وترجمته من md الى html
                        var context = marked(fs_1.readFileSync(path_1.normalize(__dirname + "/../mdposts/" + file), "utf-8"));
                        // التأكد اذا كان مجلد تاريخ المقال غير موجود
                        if (!fs_1.existsSync(path_1.normalize(__dirname + "/../out/posts/" + foldername))) {
                            // قم بإنشاء مجلد تاريخ المقال
                            fs_1.mkdirSync(path_1.normalize(__dirname + "/../out/posts/" + foldername), "0777");
                        }
                        // إضافة المقال الى المقالات
                        posts.push({
                            subject: subject,
                            created: created,
                            lastupdate: lastupdate,
                            context: context,
                            link: path_1.normalize("posts/" + foldername + "/" + filename + ".html")
                        });
                        // كتابة ملف المقال
                        fs_1.writeFile(outFile, ejs_1.render(fs_1.readFileSync(path_1.normalize(__dirname + "/../_template/post.ejs"), 'utf-8'), {
                            post: {
                                subject: subject,
                                created: created,
                                lastupdate: lastupdate,
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
                                reject(err);
                                return;
                            }
                            // اضافة عدد المقالات التي تم الإنتهاء من ترجمتها
                            itemsProcessed++;
                            // عند الإنتهاء من كافة المقالات
                            if (itemsProcessed === files.length) {
                                // إرجاع صحيح
                                resolve(true);
                            }
                            console.log(chalk.cyan("[info]") + " " + chalk.magenta("\"" + file + "\"") + " " + chalk.blue('converted to') + " " + chalk.magenta("\"" + foldername + "/" + filename + ".html\"") + ".");
                        });
                    });
                });
            });
        });
    });
}
// عند الانتهاء من كتابة جميع المقالات
writePosts().then(function (status) {
    // ترتيب المقالات
    posts.sort(function (a, b) {
        return b.created - a.created;
    });
    // جلب عدد الصفحات من عدد المقالات
    var totalPages = Math.ceil(posts.length / blogInfo().pagination.resultsPerPage);
    // حذف المجلد "out/page" بكامل محتواة
    deleteFolderRecursive(path_1.normalize(__dirname + "/../out/page"));
    // انشاء المجلد "out/page"
    fs_1.mkdir(path_1.normalize(__dirname + "/../out/page"), function (err) {
        if (err) {
            console.error(chalk.red("[Error] " + err) + ".");
            return;
        }
        for (var i = 0; i < totalPages; i++) {
            // إنشاء الصفحة
            fs_1.mkdirSync(path_1.normalize(__dirname + "/../out/page/" + (i + 1)), "0777");
            // انشاء الصفحة بمحتواها
            fs_1.writeFile(path_1.normalize(__dirname + "/../out/page/" + (i + 1) + "/index.html"), 
            // قراءة محتوى القالب index وترجمته الى html
            ejs_1.render(fs_1.readFileSync(path_1.normalize(__dirname + "/../_template/index.ejs"), 'utf-8'), {
                posts: posts.slice(i * blogInfo().pagination.resultsPerPage, (i + 1) * blogInfo().pagination.resultsPerPage),
                pages: pagination(posts.length, i + 1),
                blog: blogInfo(),
                pageNumber: i + 1
            }, {
                filename: path_1.normalize(__dirname + "/../_template/index.ejs")
            }), function (err) {
                if (err) {
                    console.error(chalk.red("[Error] " + err) + ".");
                    return;
                }
            });
            console.log(chalk.cyan("[info]") + " " + chalk.magenta("\"page-" + (i + 1) + ".html\"") + " " + chalk.blue('created') + ". ");
        }
    });
    // انشاء مجلد الصفحة الرائيسية
    fs_1.writeFile(path_1.normalize(__dirname + "/../out/index.html"), ejs_1.render(fs_1.readFileSync(path_1.normalize(__dirname + "/../_template/index.ejs"), 'utf-8'), {
        // اقتصاص عدد المقالات للصفحة الواحدة
        posts: posts.slice(0, blogInfo().pagination.resultsPerPage),
        pages: pagination(posts.length, 1),
        blog: blogInfo(),
        pageNumber: 1
    }, {
        filename: path_1.normalize(__dirname + "/../_template/index.ejs")
    }), function (err) {
        if (err) {
            console.error(chalk.red("[Error] " + err) + ".");
            return;
        }
        console.log("" + chalk.cyan("[Done] " + chalk.magenta("\"index.ejs\"") + " " + chalk.blue('converted to') + " " + chalk.magenta("\"index.html\"") + "."));
    });
}).catch(function (Error) {
    console.error(chalk.red("[Error] " + Error) + ".");
});
