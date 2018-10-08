## انشاء مدونة ثابتة ( Static ) بإستخدام مكتبة NSB
ﻻنشاء المدونة يجب اولًا ان تقوم بنسخ مستودع المكتبة لجهازك
```sh
$ git clone https://github.com/xlmnxp/nsb.git
$ cd nsb
$ [sudo] npm install
```
وتقوم بتعديل ملف الاعدادات  `_config.json` بما يناسب مدونتك
```json
{
    "rtl": true,
    "locale": "ar",
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

## إضافة مقال
تقوم بإضافة المقالات لمجلد `mdposts`
تبداء بعنوان المقال وتنتهي بإمتداد `.md`
وبلغة `markdown`

### من ثم تقوم بتنفيذ الامر
```sh
$ sudo npm start
```
لإنشاء القوالب والمقالات
### من ثم تقوم برفعها لمستودعك في github
```sh
$ [sudo] git add .
$ [sudo] git commit -m "commit"
$ [sudo] git push
```
