# nsb ( مدونة ثابته لـ Github Pages )
[![Build Status](https://travis-ci.org/runbb/nsb.svg?branch=master)](https://travis-ci.org/runbb/nsb)

## طريقة التركيب
تقوم بنسخ المستودع لجهازك
```sh
$ git clone https://github.com/runbb/nsb.git
$ cd nsb
$ npm install
```
وتقوم بتعديل ملف `_config.json`
```json
{
    "title": "مدونة تجريبية", // اسم المدونة
    "url": "https://runbb.github.io/nsb", // الرابط للصفحة الرائيسية من دون "/" في الاحير
    "charset": "utf-8", // ترميز المدونة
    "description": "مدونة عملية جدًا", // وصف المدونة
    "pagination":{ // الصفحات
        "previous": "السابق", // زر الصفحة السابقة
        "size": 8, // عدد ازرار الارقام التي تظهر في شريط التقل بين الصفحات
        "resultsPerPage": 12, // عدد التدوينات في الصفحة
        "next": "التالي" // زر الصفحة التالي      
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
$ [sudo] commit -m "commit"
$ [sudo] git push
```