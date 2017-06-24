#! /usr/bin/env node
import * as marked from 'marked';
import { readFile, readdirSync, readFileSync, existsSync,
         lstatSync, unlinkSync, rmdirSync, mkdir, writeFile, mkdirSync,
         readdir,stat, Stats } from 'fs';
import * as chalk from 'chalk';
import { normalize } from 'path';
import { render } from 'ejs';

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

try{
    deleteFolderRecursive(normalize(`${__dirname}/../posts`));
    mkdir(normalize(`${__dirname}/../posts`),"0777",(err: NodeJS.ErrnoException)=>{
        if(err){
            console.error(err);
            return;
        }
        readdir(normalize(`${__dirname}/../mdposts`),(err: NodeJS.ErrnoException, files: string[])=>{
            if(err){
                console.error(err);
                return;
            }
            files.forEach((file:string,index: number)=>{
                setTimeout(()=>{
                    stat(normalize(`${__dirname}/../mdposts/${file}`),(err: NodeJS.ErrnoException,stat: Stats)=>{
                        if(err){
                            console.error(err);
                            return;
                        }

                        var created = stat.ctime;
                        var lastupdate = stat.mtime;
                        var foldername = created.toDateString().replace(/\s+/g,'-').toLowerCase();
                        var subject = file.substr(0,file.length-3);
                        var filename = subject.replace(/\s+/g,'-').toLowerCase();
                        var outFile = normalize(`${__dirname}/../posts/${foldername}/${filename}.html`);
                        var context = marked(readFileSync(normalize(`${__dirname}/../mdposts/${file}`),"utf-8"),{gfm:true});
                        if(!existsSync(normalize(`${__dirname}/../posts/${foldername}`))){
                            mkdirSync(normalize(`${__dirname}/../posts/${foldername}`),"0777");
                        }
                        
                        writeFile(outFile,render(readFileSync(normalize(`${__dirname}/../_template/post.ejs`),'utf-8'),{
                            post:{
                                subject: subject,
                                created: new Date(created),
                                lastupdate: new Date(lastupdate),
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
                                console.error(err);
                                return;
                            }
                            posts.push({ 
                                subject: subject,
                                created: created,
                                lastupdate: lastupdate,
                                link: normalize(`posts/${foldername}/${filename}.html`)
                            });

                            console.log(`${chalk.cyan(`[info]`)} ${chalk.magenta(`"${file}"`)} ${chalk.blue('converted to')} ${chalk.magenta(`"${foldername}/${filename}.html"`)}.`);
                        });
                    });
                },100*index);
            });
        });
    });
}catch(e){
    console.error(`${chalk.red(`[error] ${e.message}`)}`);
}finally{
    setTimeout(()=>{

        posts.sort(function(a:any,b:any){
            return a.created - b.created;
        });

        var totalPages = Math.ceil(posts.length / 12);

        deleteFolderRecursive(normalize(`${__dirname}/../page`));
        mkdir(normalize(`${__dirname}/../page`),(err: NodeJS.ErrnoException)=>{
            if(err){
                console.error(err);
                return;
            }

            for (var i = 0; i < totalPages; i++) {

                mkdirSync(normalize(`${__dirname}/../page/${i+1}`),"0777")
                writeFile(normalize(`${__dirname}/../page/${i+1}/index.html`),
                    render(readFileSync(normalize(`${__dirname}/../_template/index.ejs`),'utf-8'),{
                        posts: posts.reverse().slice(i*12, i+1*12),
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

        writeFile(normalize(`${__dirname}/../index.html`),
            render(readFileSync(normalize(`${__dirname}/../_template/index.ejs`),'utf-8'),{
                posts: posts,
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
    },5000);
}