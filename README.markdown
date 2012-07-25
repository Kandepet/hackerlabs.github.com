## Cloning hackerlabs & using the svbtle theme it uses
DISCLAIMER: The theme is heavily hacked to make it work for me. It might not work the way you expect it to. Clone only if you know what you are doing.


### Installing RVM

 - bash -s stable < <(curl -s https://raw.github.com/wayneeseguin/rvm/master/binscripts/rvm-installer)

 - echo '[[ -s "$HOME/.rvm/scripts/rvm" ]] && . "$HOME/.rvm/scripts/rvm" # Load RVM function' >> ~/.bash_profile
 - source ~/.bash_profile

### Install Ruby & rubygems
 - rvm install 1.9.2 && rvm use 1.9.2
 - rvm rubygems latest

### Clone hackerlabs & setup environment

 - git clone git@github.com:HackerLabs/hackerlabs.github.com.git
 - cd hackerlabs.github.com
 - git checkout source
 - mkdir _deploy
 - cd _deploy
 - git init
 - git remote add origin git@github.com:username/username.github.com.git
 - git pull origin master
 - cd ..

### Install bundles
 - gem install bundler
 - bundle install

### Install svbtle theme & deploy
 - rake isntall[svbtle]
 - rake generate
 - rake deploy





