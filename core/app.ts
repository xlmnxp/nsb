#! /usr/bin/env node
import { readFile, readdirSync, readFileSync, existsSync,
         lstatSync, unlinkSync, rmdirSync, mkdir, writeFile, mkdirSync,
         readdir,stat, Stats } from 'fs';

import * as md from 'markdown-it';
import * as chalk from 'chalk';
import { normalize } from 'path';
import { render } from "ejs";

const marked = (markdownText: string)=>{
    return md().render(markdownText);
};

var posts:Array<Object> = [];
var folder_path:() => String = () => __dirname;
const blogInfo:any = ():Object => require(normalize(`${folder_path()}/../_config.json`)) as Object;

if(!existsSync(`${folder_path()}/../_config.json`)){
    console.error(`${chalk.default.red(`[Error] '_config.json' cannot be found file in the folder`)}.`);
    process.exit(1);
}

// حذف المجلد بما يحتويه
function deleteFolderRecursive(path: string) {
    // التحقق من هل المسار صحيح
    if( existsSync(path) ) {
    // قراءة المسار
    readdirSync(path).forEach(function(file,index){
        var curPath = path + "/" + file;
        // التحقق اذا كان الملف هو مجلد
        if(lstatSync(curPath).isDirectory()) {
            // قم بفحصة ايضًا
            deleteFolderRecursive(curPath);
        } else {
            // حذف الملف
            unlinkSync(curPath);
        }
    });
    // حذف المجلد
    rmdirSync(path);
    }
};
// ازرار التنقل بين الصفحات [ السابق, 1, 2, 3 , التالي]ـ
function pagination(total: number,page: number): Array<Object>{
        var result:Array<Object> = [];
        if (page < 1) page = 1;
        var pagination = blogInfo().pagination;

        var pages: number = pagination.size;
        var results: number = pagination.resultsPerPage;

        var numberOfPages: number = pages;
        var resultsPerPage: number = results;
        var numberOfRows: number = total;
        var totalPages: number = Math.ceil(numberOfRows / resultsPerPage);

        var halfPages: number = Math.floor( numberOfPages / 2);
        var range = {'start': 1, 'end': totalPages};
        var isEven: boolean = (numberOfPages % 2 == 0);
        var atRangeEnd: number = totalPages - halfPages;

        if(isEven)
        {
            atRangeEnd++;
        }

        if(totalPages > numberOfPages)
        {
            if(page <= halfPages){
                range['end'] = numberOfPages;
            }
            else if (page >= atRangeEnd){
                range['start'] = totalPages - numberOfPages + 1;
            }
            else
            {
                range['start'] = page - halfPages;
                range['end'] = page + halfPages;
                if(isEven) range['end']--;
            }
        }

        if(page > 1){
            result.push({"page": (page - 1), "name": pagination.previous, "active": false });
        }

        for (let i = range['start']; i <= range['end']; i++)
        {
            if(i == page){
                result.push({"page": i, "name": i, "active": true });
            }else{
                result.push({"page": (i),"name": i,"active": false });
            }
        }

        if (page < totalPages){
            result.push({"page": (page + 1),"name": pagination.next, "active": false });
        }

        return result;
}

// كتابة المقالات داخل مجلد "out/posts"
function writePosts(): Promise<boolean>{
    return new Promise<boolean>((resolve,reject) => {
        var itemsProcessed = 0;
        // حذف المجلد "out" و المجلد "posts"
        deleteFolderRecursive(normalize(`${folder_path()}/../out`));
        deleteFolderRecursive(normalize(`${folder_path()}/../out/posts`));
        
        // إنشاء المجلد الرائيسية "out" بصلاحية 777
        mkdirSync(normalize(`${folder_path()}/../out`),"0777");
        
        // انشاء المجلد "posts"
        mkdir(normalize(`${folder_path()}/../out/posts`),"0777",(err: NodeJS.ErrnoException)=>{
            if(err){
                reject(err);
                return;
            }
            // قراءة محتوى المجلد "mdposts"
            readdir(normalize(`${folder_path()}/../mdposts`),(err: NodeJS.ErrnoException, files: string[])=>{
                if(err){
                    reject(err);
                    return;
                }
                files.forEach((file:string,index: number)=>{
                        // جلب حالة المجلد
                        stat(normalize(`${folder_path()}/../mdposts/${file}`),(err: NodeJS.ErrnoException,stat: Stats)=>{
                            if(err){
                                reject(err);
                                return;
                            }

                            // جلب تاريخ إنشاء المقال
                            var created = stat.ctime;
                            // جلب تاريخ اخر تعديل على المقال
                            var lastupdate = stat.mtime;
                            // تحويل تاريخ إنشاء المقال الى اسم المجلد مع تحويل كل مسافة الى شرطة "-"
                            var foldername = created.toDateString().replace(/\s+/g,'-').toLowerCase();
                            // جلب عنوان المقال
                            var subject = file.trim().substr(0,file.length-3);
                            // تحويل عنوان المقال الى ملف
                            var filename = subject.trim().replace(/\s+/g,'-').toLowerCase();
                            // رسم مسار إستخراج الملف
                            var outFile = normalize(`${folder_path()}/../out/posts/${foldername}/${filename}.html`);
                            // قراءة محتوى المقال وترجمته من md الى html
                            var context = marked(readFileSync(normalize(`${folder_path()}/../mdposts/${file}`),"utf-8"));
                            // التأكد اذا كان مجلد تاريخ المقال غير موجود
                            if(!existsSync(normalize(`${folder_path()}/../out/posts/${foldername}`))){
                                // قم بإنشاء مجلد تاريخ المقال
                                mkdirSync(normalize(`${folder_path()}/../out/posts/${foldername}`),"0777");
                            }
                            
                            // إضافة المقال الى المقالات
                            posts.push({ 
                                subject: subject,
                                created: created,
                                lastupdate: lastupdate,
                                context: context,
                                link: normalize(`posts/${foldername}/${filename}.html`)
                            });
    
                            // كتابة ملف المقال
                            writeFile(outFile,render(readFileSync(normalize(`${folder_path()}/../_template/post.ejs`),'utf-8'),{
                                post:{
                                    subject: subject,
                                    created: created,
                                    lastupdate: lastupdate,
                                    context: context,
                                    link: normalize(`posts/${foldername}/${filename}.html`)
                                },
                                blog: blogInfo()
                            },{
                                filename: normalize(`${folder_path()}/../_template/post.ejs`)
                            }
                            ),{
                                encoding: "utf-8"
                            },(err: NodeJS.ErrnoException)=>{
                                if(err){
                                    reject(err);
                                    return;
                                }
                                // اضافة عدد المقالات التي تم الإنتهاء من ترجمتها
                                itemsProcessed++;
                                // عند الإنتهاء من كافة المقالات
                                if(itemsProcessed === files.length){
                                    // إرجاع صحيح
                                    resolve(true);
                                }
                                console.log(`${chalk.default.cyan(`[info]`)} ${chalk.default.magenta(`"${file}"`)} ${chalk.default.blue('converted to')} ${chalk.default.magenta(`"${foldername}/${filename}.html"`)}.`);
                            });
                        });
                });
            });
        });
        
    });
}

(async ()=>{
    try{
        // عند الانتهاء من كتابة جميع المقالات
        let status:boolean = await writePosts();
        
        // ترتيب المقالات
        posts.sort(function(a:any,b:any){
            return b.created - a.created;
        });
        
        // جلب عدد الصفحات من عدد المقالات
        var totalPages = Math.ceil(posts.length / blogInfo().pagination.resultsPerPage);
    
        // حذف المجلد "out/page" بكامل محتواة
        deleteFolderRecursive(normalize(`${folder_path()}/../out/page`));
        
        // انشاء المجلد "out/page"
        mkdir(normalize(`${folder_path()}/../out/page`),(err: NodeJS.ErrnoException)=>{
            if(err){
                console.error(`${chalk.default.red(`[Error] ${err}`)}.`);
                return;
            }
    
            for (var i = 0; i < totalPages; i++) {
                // إنشاء الصفحة
                mkdirSync(normalize(`${folder_path()}/../out/page/${i+1}`),"0777");
    
                // انشاء الصفحة بمحتواها
                writeFile(normalize(`${folder_path()}/../out/page/${i+1}/index.html`),
                    // قراءة محتوى القالب index وترجمته الى html
                    render(readFileSync(normalize(`${folder_path()}/../_template/index.ejs`),'utf-8'),{
                        posts: posts.slice(i* blogInfo().pagination.resultsPerPage, (i+1) * blogInfo().pagination.resultsPerPage),
                        pages: pagination(posts.length, i+1),
                        blog: blogInfo(),
                        pageNumber: i+1
                    },{
                        filename: normalize(`${folder_path()}/../_template/index.ejs`)
                    }),(err: NodeJS.ErrnoException)=>{
                        if(err){
                            console.error(`${chalk.default.red(`[Error] ${err}`)}.`);
                            return;
                        }
                    });
    
                    console.log(`${chalk.default.cyan(`[info]`)} ${chalk.default.magenta(`"page-${i+1}.html"`)} ${chalk.default.blue('created')}. `);            
            }
        });
    
        // انشاء مجلد الصفحة الرائيسية
        writeFile(normalize(`${folder_path()}/../out/index.html`),
            render(readFileSync(normalize(`${folder_path()}/../_template/index.ejs`),'utf-8'),{
                // اقتصاص عدد المقالات للصفحة الواحدة
                posts: posts.slice(0, blogInfo().pagination.resultsPerPage),
                pages: pagination(posts.length,1),
                blog: blogInfo(),
                pageNumber: 1
            },{
                filename: normalize(`${folder_path()}/../_template/index.ejs`)
            }),(err: NodeJS.ErrnoException)=>{
                if(err){
                    console.error(`${chalk.default.red(`[Error] ${err}`)}.`);
                    return;
                }
    
                console.log(`${chalk.default.cyan(`[Done] ${chalk.default.magenta(`"index.ejs"`)} ${chalk.default.blue('converted to')} ${chalk.default.magenta(`"index.html"`)}.`)}`);    
        });
    }catch(error){
        console.error(`${chalk.default.red(`[Error] ${error}`)}.`);
        process.exit(1);   
    }
})();