#! /usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var md = require("markdown-it");
var chalk_1 = require("chalk");
var path_1 = require("path");
var ejs_1 = require("ejs");
var marked = function (markdownText) {
    return md().render(markdownText);
};
var posts = [];
var folder_path = function () { return __dirname; };
var blogInfo = function () { return require(path_1.normalize(folder_path() + "/../_config.json")); };
if (!fs_1.existsSync(folder_path() + "/../_config.json")) {
    console.error(chalk_1.default.red("[Error] '_config.json' cannot be found file in the folder") + ".");
    process.exit(1);
}
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
// كتابة المقالات داخل مجلد "{ مجلد المستخراجات }/posts"
function writePosts() {
    return new Promise(function (resolve, reject) {
        var itemsProcessed = 0;
        // حذف المجلد "out" و المجلد "posts"
        deleteFolderRecursive(path_1.normalize(folder_path() + "/../" + blogInfo().output_folder));
        deleteFolderRecursive(path_1.normalize(folder_path() + "/../" + blogInfo().output_folder + "/posts"));
        // إنشاء المجلد الرائيسية "out" بصلاحية 777
        fs_1.mkdirSync(path_1.normalize(folder_path() + "/../" + blogInfo().output_folder), "0777");
        // انشاء المجلد "posts"
        fs_1.mkdir(path_1.normalize(folder_path() + "/../" + blogInfo().output_folder + "/posts"), "0777", function (err) {
            if (err) {
                reject(err);
                return;
            }
            // قراءة محتوى المجلد "mdposts"
            fs_1.readdir(path_1.normalize(folder_path() + "/../mdposts"), function (err, files) {
                if (err) {
                    reject(err);
                    return;
                }
                files.forEach(function (file, index) {
                    // جلب حالة المجلد
                    fs_1.stat(path_1.normalize(folder_path() + "/../mdposts/" + file), function (err, stat) {
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
                        var outFile = path_1.normalize(folder_path() + "/../" + blogInfo().output_folder + "/posts/" + foldername + "/" + filename + ".html");
                        // قراءة محتوى المقال وترجمته من md الى html
                        var context = marked(fs_1.readFileSync(path_1.normalize(folder_path() + "/../mdposts/" + file), "utf-8"));
                        // التأكد اذا كان مجلد تاريخ المقال غير موجود
                        if (!fs_1.existsSync(path_1.normalize(folder_path() + "/../" + blogInfo().output_folder + "/posts/" + foldername))) {
                            // قم بإنشاء مجلد تاريخ المقال
                            fs_1.mkdirSync(path_1.normalize(folder_path() + "/../" + blogInfo().output_folder + "/posts/" + foldername), "0777");
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
                        fs_1.writeFile(outFile, ejs_1.render(fs_1.readFileSync(path_1.normalize(folder_path() + "/../_template/post.ejs"), 'utf-8'), {
                            post: {
                                subject: subject,
                                created: created,
                                lastupdate: lastupdate,
                                context: context,
                                link: path_1.normalize("posts/" + foldername + "/" + filename + ".html")
                            },
                            blog: blogInfo()
                        }, {
                            filename: path_1.normalize(folder_path() + "/../_template/post.ejs")
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
                            console.log(chalk_1.default.cyan("[info]") + " " + chalk_1.default.magenta("\"" + file + "\"") + " " + chalk_1.default.blue('converted to') + " " + chalk_1.default.magenta("\"" + foldername + "/" + filename + ".html\"") + ".");
                        });
                    });
                });
            });
        });
    });
}
(function () { return __awaiter(_this, void 0, void 0, function () {
    var status, totalPages, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, writePosts()];
            case 1:
                status = _a.sent();
                // ترتيب المقالات
                posts.sort(function (a, b) {
                    return b.created - a.created;
                });
                totalPages = Math.ceil(posts.length / blogInfo().pagination.resultsPerPage);
                // حذف المجلد "out/page" بكامل محتواة
                deleteFolderRecursive(path_1.normalize(folder_path() + "/../" + blogInfo().output_folder + "/page"));
                // انشاء المجلد "out/page"
                fs_1.mkdir(path_1.normalize(folder_path() + "/../" + blogInfo().output_folder + "/page"), function (err) {
                    if (err) {
                        console.error(chalk_1.default.red("[Error] " + err) + ".");
                        return;
                    }
                    for (var i = 0; i < totalPages; i++) {
                        // إنشاء الصفحة
                        fs_1.mkdirSync(path_1.normalize(folder_path() + "/../" + blogInfo().output_folder + "/page/" + (i + 1)), "0777");
                        // انشاء الصفحة بمحتواها
                        fs_1.writeFile(path_1.normalize(folder_path() + "/../" + blogInfo().output_folder + "/page/" + (i + 1) + "/index.html"), 
                        // قراءة محتوى القالب index وترجمته الى html
                        ejs_1.render(fs_1.readFileSync(path_1.normalize(folder_path() + "/../_template/index.ejs"), 'utf-8'), {
                            posts: posts.slice(i * blogInfo().pagination.resultsPerPage, (i + 1) * blogInfo().pagination.resultsPerPage),
                            pages: pagination(posts.length, i + 1),
                            blog: blogInfo(),
                            pageNumber: i + 1
                        }, {
                            filename: path_1.normalize(folder_path() + "/../_template/index.ejs")
                        }), function (err) {
                            if (err) {
                                console.error(chalk_1.default.red("[Error] " + err) + ".");
                                return;
                            }
                        });
                        console.log(chalk_1.default.cyan("[info]") + " " + chalk_1.default.magenta("\"page-" + (i + 1) + ".html\"") + " " + chalk_1.default.blue('created') + ". ");
                    }
                });
                // انشاء مجلد الصفحة الرائيسية
                fs_1.writeFile(path_1.normalize(folder_path() + "/../" + blogInfo().output_folder + "/index.html"), ejs_1.render(fs_1.readFileSync(path_1.normalize(folder_path() + "/../_template/index.ejs"), 'utf-8'), {
                    // اقتصاص عدد المقالات للصفحة الواحدة
                    posts: posts.slice(0, blogInfo().pagination.resultsPerPage),
                    pages: pagination(posts.length, 1),
                    blog: blogInfo(),
                    pageNumber: 1
                }, {
                    filename: path_1.normalize(folder_path() + "/../_template/index.ejs")
                }), function (err) {
                    if (err) {
                        console.error(chalk_1.default.red("[Error] " + err) + ".");
                        return;
                    }
                    console.log("" + chalk_1.default.cyan("[Done] " + chalk_1.default.magenta("\"index.ejs\"") + " " + chalk_1.default.blue('converted to') + " " + chalk_1.default.magenta("\"index.html\"") + "."));
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error(chalk_1.default.red("[Error] " + error_1) + ".");
                process.exit(1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); })();
