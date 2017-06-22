#! /usr/bin/env node
import * as marked from 'marked';
import * as fs from 'fs';
import * as chalk from 'chalk';
import { render } from 'ejs';

var posts:Array<Object> = [];
var blog:Object = <Object>JSON.parse(fs.readFileSync(`${__dirname}/../_config.json`,"utf-8"));
var blogInfo:any = ():Object => JSON.parse(JSON.stringify(blog));

function deleteFolderRecursive(path: string) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};


function pagination(pages: number,results: number,total: number,page: number): Array<Object>{
        var result:Array<Object> = [];
        if (page < 1) page = 1;

        var numberOfPages = pages;
        var resultsPerPage = results;
        var numberOfRows = total;
        var totalPages = Math.ceil(numberOfRows / resultsPerPage);

        var halfPages = Math.floor( numberOfPages / 2);
        var range = {'start': 1, 'end': totalPages};
        var isEven = (numberOfPages % 2 == 0);
        var atRangeEnd = totalPages - halfPages;

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
            result.push({"page": (page - 1), "name": "<", "active": false });
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
            result.push({"page": (page + 1),"name": ">", "active": false });
        }

        return result;
}

try{
    deleteFolderRecursive(`${__dirname}/../posts`);
    fs.mkdir(`${__dirname}/../posts`,"0777",(err: NodeJS.ErrnoException)=>{
        if(err){
            console.error(err);
            return;
        }
        fs.readdir(`${__dirname}/../mdposts`,(err: NodeJS.ErrnoException, files: string[])=>{
            if(err){
                console.error(err);
                return;
            }
            files.forEach((file:string,index: number)=>{
                setTimeout(()=>{
                    fs.stat(`${__dirname}/../mdposts/${file}`,(err: NodeJS.ErrnoException,stat: fs.Stats)=>{
                        if(err){
                            console.error(err);
                            return;
                        }

                        var created = stat.ctime;
                        var lastupdate = stat.mtime;
                        var foldername = created.toDateString().replace(/\s+/g,'-').toLowerCase();
                        var subject = file.substr(0,file.length-3);
                        var filename = subject.replace(/\s+/g,'-').toLowerCase();
                        var outFile = `${__dirname}/../posts/${foldername}/${filename}.html`;
                        var context = marked(fs.readFileSync(`${__dirname}/../mdposts/${file}`,"utf-8"),{gfm:true});
                        if(!fs.existsSync(`${__dirname}/../posts/${foldername}`)){
                            fs.mkdirSync(`${__dirname}/../posts/${foldername}`,"0777");
                        }
                        
                        fs.writeFile(outFile,render(fs.readFileSync(`${__dirname}/../_template/post.ejs`,'utf-8'),{
                            post:{
                                subject: subject,
                                created: new Date(created),
                                lastupdate: new Date(lastupdate),
                                context: context,
                                link: `posts/${foldername}/${filename}.html`
                            },
                            blog: blogInfo()
                        },{
                            filename: `${__dirname}/../_template/post.ejs`
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
                                link: `posts/${foldername}/${filename}.html`
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

        for (var i = 0; i < totalPages; i++) {
            fs.writeFile(`${__dirname}/../pages/page-${i+1}.html`,
                render(fs.readFileSync(`${__dirname}/../_template/index.ejs`,'utf-8'),{
                    posts: posts.reverse().slice(i*12, i+1*12),
                    pages: pagination(8,12,posts.length,i+1),
                    blog: blogInfo(),
                    pageNumber: i+1
                },{
                    filename: `${__dirname}/../_template/index.ejs`
                }),(err: NodeJS.ErrnoException)=>{
                    if(err){
                        console.error(err);
                        return;
                    }
            });

            console.log(`${chalk.cyan(`[info]`)} ${chalk.magenta(`"page-${i+1}.html"`)} ${chalk.blue('created')}. `);            
        }

        fs.writeFile(`${__dirname}/../index.html`,
            render(fs.readFileSync(`${__dirname}/../_template/index.ejs`,'utf-8'),{
                posts: posts.reverse().slice(0, 12),
                pages: pagination(8,12,posts.length,1),
                blog: blogInfo(),
                pageNumber: 1
            },{
                filename: `${__dirname}/../_template/index.ejs`
            }),(err: NodeJS.ErrnoException)=>{
                if(err){
                    console.error(err);
                    return;
                }
                console.log(`${chalk.cyan(`[Done] ${chalk.magenta(`"index.ejs"`)} ${chalk.blue('converted to')} ${chalk.magenta(`"index.html"`)}.`)}`);    
        });
    },5000);
}