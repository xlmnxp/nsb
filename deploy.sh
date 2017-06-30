git config user.name "$USERNAME"
git config user.email "$EMAIL"
git init
git remote add up "https://$GITHUB_TOKEN@github.com/$USERNAME/$REPO.git"
git pull
git checkout -b gh-pages
git rm -rf .
rm -rf !\("out"|".git"|".gitignore"\)
cp -R ./out/. ./
git add .
rm -rf out node_modules nsb
git commit -am 'تدوينة جديدة'
git push -f up gh-pages