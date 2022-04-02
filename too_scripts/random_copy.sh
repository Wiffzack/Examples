echo "First paramter file type"
echo "Second Parameter File Destination"
echo "Exampe : random_copy.sh png ~/test"
shuf -zn8 -e *.$1 | xargs -0 cp -vt $2
