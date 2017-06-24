# nsb ( مدونة ثابته لـ Github Pages )
[![Build Status](https://travis-ci.org/runbb/nsb.svg?branch=master)](https://travis-ci.org/runbb/nsb)
[![npm](https://img.shields.io/npm/v/npm.svg)]()
[![license](https://img.shields.io/badge/license-MIT-blue.svg)]()
## طريقة التركيب
تقوم بنسخ المستودع لجهازك
```sh
$ git clone https://github.com/runbb/nsb.git
$ cd nsb
$ [sudo] npm install
```
وتقوم بتعديل ملف `_config.json`
```json
{
    "title": "اسم المدونة",
    "url": "الرابط للصفحة الرائيسية من دون '/' في الاحير",
    "charset": "ترميز المدونة", 
    "description": "وصف المدونة",
    "pagination":{
        "previous": "زر الصفحة السابقة",
        "size": "عدد ازرار الارقام التي تظهر في شريط التقل بين الصفحات",
        "resultsPerPage": "عدد التدوينات في الصفحة", 
        "next": "زر الصفحة التالي"    
    }
}
```

## لإضافة تدوينة
تقوم بإضافة التدوينات لمجلد `mdposts`
تبداء بعنوان التدوينة وتنتهي بإمتداد التدوينة `.md`
وبلغة `markdown`

### من ثم تقوم بتنفيذ الامر
```sh
$ sudo npm start
```
لإنشاء القوالب والتدوينات
### من ثم قم برفعها لمستودعك في github
```sh
$ [sudo] git add .
$ [sudo] git commit -m "commit"
$ [sudo] git push
```