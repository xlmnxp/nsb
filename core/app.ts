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
var blog:Object = <Object>JSON.parse(readFileSync(normalize(`${__dirname}/../_config.json`),"utf-8"));
var blogInfo:any = ():Object => JSON.parse(JSON.stringify(blog));

function deleteFolderRecursive(path: string) {
  if( existsSync(path) ) {
    readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        unlinkSync(curPath);
      }
    });
    rmdirSync(path);
  }
};


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

function writePosts(): Promise<boolean>{
    return new Promise<boolean>((resolve,reject) => {
        var itemsProcessed = 0;        
        deleteFolderRecursive(normalize(`${__dirname}/../out`));
        mkdirSync(normalize(`${__dirname}/../out`),"0777");
        deleteFolderRecursive(normalize(`${__dirname}/../out/posts`));
        mkdir(normalize(`${__dirname}/../out/posts`),"0777",(err: NodeJS.ErrnoException)=>{
            if(err){
                reject(err);
                return;
            }
            readdir(normalize(`${__dirname}/../mdposts`),(err: NodeJS.ErrnoException, files: string[])=>{
                if(err){
                    reject(err);
                    return;
                }
                files.forEach((file:string,index: number)=>{
                        stat(normalize(`${__dirname}/../mdposts/${file}`),(err: NodeJS.ErrnoException,stat: Stats)=>{
                            if(err){
                                reject(err);
                                return;
                            }
    
                            var created = stat.ctime;
                            var lastupdate = stat.mtime;
                            var foldername = created.toDateString().replace(/\s+/g,'-').toLowerCase();
                            var subject = file.trim().substr(0,file.length-3);
                            var filename = subject.trim().replace(/\s+/g,'-').toLowerCase();
                            var outFile = normalize(`${__dirname}/../out/posts/${foldername}/${filename}.html`);
                            var context = marked(readFileSync(normalize(`${__dirname}/../mdposts/${file}`),"utf-8"));
                            if(!existsSync(normalize(`${__dirname}/../out/posts/${foldername}`))){
                                mkdirSync(normalize(`${__dirname}/../out/posts/${foldername}`),"0777");
                            }
    
                            posts.push({ 
                                subject: subject,
                                created: created,
                                lastupdate: lastupdate,
                                context: context,
                                link: normalize(`posts/${foldername}/${filename}.html`)
                            });
    
                            writeFile(outFile,render(readFileSync(normalize(`${__dirname}/../_template/post.ejs`),'utf-8'),{
                                post:{
                                    subject: subject,
                                    created: created,
                                    lastupdate: lastupdate,
                                    context: context,
                                    link: normalize(`posts/${foldername}/${filename}.html`)
                                },
                                blog: blogInfo()
                            },{
                                filename: normalize(`${__dirname}/../_template/post.ejs`)
                            }
                            ),{
                                encoding: "utf-8"
                            },(err: NodeJS.ErrnoException)=>{
                                if(err){
                                    reject(err);
                                    return;
                                }
                                itemsProcessed++;
                                if(itemsProcessed === files.length){
                                    resolve(true);
                                }
                                console.log(`${chalk.cyan(`[info]`)} ${chalk.magenta(`"${file}"`)} ${chalk.blue('converted to')} ${chalk.magenta(`"${foldername}/${filename}.html"`)}.`);
                            });
                        });
                });
            });
        });
        
    });
}

writePosts().then((status: boolean) => {
    posts.sort(function(a:any,b:any){
        return b.created - a.created;
    });

    var totalPages = Math.ceil(posts.length / 12);

    deleteFolderRecursive(normalize(`${__dirname}/../out/page`));
    mkdir(normalize(`${__dirname}/../out/page`),(err: NodeJS.ErrnoException)=>{
        if(err){
            console.error(err);
            return;
        }

        for (var i = 0; i < totalPages; i++) {

            mkdirSync(normalize(`${__dirname}/../out/page/${i+1}`),"0777")
            writeFile(normalize(`${__dirname}/../out/page/${i+1}/index.html`),
                render(readFileSync(normalize(`${__dirname}/../_template/index.ejs`),'utf-8'),{
                    posts: posts.slice(i*12, (i+1) *12),
                    pages: pagination(posts.length,i+1),
                    blog: blogInfo(),
                    pageNumber: i+1
                },{
                    filename: normalize(`${__dirname}/../_template/index.ejs`)
                }),(err: NodeJS.ErrnoException)=>{
                    if(err){
                        console.error(err);
                        return;
                    }
                });

                console.log(`${chalk.cyan(`[info]`)} ${chalk.magenta(`"page-${i+1}.html"`)} ${chalk.blue('created')}. `);            
        }
    });

    writeFile(normalize(`${__dirname}/../out/index.html`),
        render(readFileSync(normalize(`${__dirname}/../_template/index.ejs`),'utf-8'),{
            posts: posts.slice(0, 12),
            pages: pagination(posts.length,1),
            blog: blogInfo(),
            pageNumber: 1
        },{
            filename: normalize(`${__dirname}/../_template/index.ejs`)
        }),(err: NodeJS.ErrnoException)=>{
            if(err){
                console.error(err);
                return;
            }

            console.log(`${chalk.cyan(`[Done] ${chalk.magenta(`"index.ejs"`)} ${chalk.blue('converted to')} ${chalk.magenta(`"index.html"`)}.`)}`);    
    });
}).catch(Error => {
    console.log(`${chalk.red(`[Error] ${Error}`)}.`);    
});