---
layout: page
title: "labs"
date: 2012-06-13 23:08
comments: true
sharing: true
footer: true
---

<div class="git-container" align="left">
<style>

.git-container {
   text-align: left;
   text-align: left;
}



.page-header {
   padding-bottom: 17px;
   margin: 18px 0;
   border-bottom: 1px solid #eeeeee;
}

.page-header h1 {
   line-height: 1;
}

.page-header .links {
   float: right;
}

.row {
   margin-left: -20px;
   *zoom: 1;
   width: 980px;
}
.row:before, .row:after {
   display: table;
}
.row:after {
   clear: both;
}

#container {
   width: 95%;
   margin: 0 auto 0 0;
}

.span4, .span8 {
   -webkit-border-radius: 5px;
   -moz-border-radius: 5px;
   -ms-border-radius: 5px;
   -o-border-radius: 5px;
   border-radius: 5px;
   -webkit-box-shadow: 1px 1px 7px gray;
   -moz-box-shadow: 1px 1px 7px gray;
   box-shadow: 1px 1px 7px gray;
  float: left;
  margin: 20px 0 0 20px;
}

.show-grid {
   margin-top: 10px;
   margin-bottom: 20px;
}

.repos .span4:hover {
cursor: pointer;
        background-color: #F9F9F9;
}

.sub {
   color: gray;
   font-size: smaller;
}

.sub a {
   color: inherit;
   float: right;
}

#updated .sub {
   display: inline;
}

.repo, .box {
margin: 0.5em 1em;
height: 120px;
position: relative;
}

.box h3, .repo h3 {
   font: 300 26px/28px Oswald;
   font-size: 26px;
   font-weight: normal;
   margin: 10px 0;
   padding: 0;
}

.box h3, .repo p {
   line-height: 1.5em;
}

.repo p {
   font-size: 12px;
}

.repo a, .box a{
   font-size: 12px;
   border-bottom: 0px!important;
}

.repo a:hover, .box a:hover{
   text-decoration: underline;
   color: #0184CA;
}
.span1 {
  width: 60px;
}

.span2 {
  width: 140px;
}

.span3 {
  width: 220px;
}

.span4 {
  width: 300px;
}

.span5 {
  width: 380px;
}

.span6 {
  width: 460px;
}

.span7 {
  width: 540px;
}

.span8 {
  width: 620px;
}

.span9 {
  width: 700px;
}

.span10 {
  width: 780px;
}

.span11 {
  width: 860px;
}

.span12 {
  width: 940px;
}

</style>


<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.0.2/bootstrap.min.js"></script>
<script src="/javascripts/jquery-jgfeed.js"></script>
<script type="text/javascript">
function byName(a, b) {
   var aName = a.name.toLowerCase();
   var bName = b.name.toLowerCase();
   return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

function byDate(a, b) {
   var aName = new Date(a.updated_at);
   var bName = new Date(b.updated_at);
   return ((aName < bName) ? 1 : ((aName > bName) ? -1 : 0));
}

function loadRepos(data, textStatus, jqXHR) {
   var container = $("#container");
   var row = null;
   var repositories = data.data;
   repositories.sort(byDate);
   cnt = 0;
   $.each(repositories, function(i, repo) {
         if (repo.name == 'arquillian_deprecated' || repo.name == 'seam-forge' || repo.name == 'arquillian-sandbox') {
         return;
         }
         if ((cnt++ % 3) == 0) {
         if (row != null) {
         row.appendTo(container);
         }
         row = $("<div class='repos row show-grid'/>");
         }
         addRepo(row, repo);
         });
   if (row != null) {
      row.appendTo(container);
   }
   $("#repositories").text(plural(repositories.length, " repository", " repositories"));
   repositories.sort(byDate);
   /*var updated = $("#updated");
   $.each(repositories.slice(0, 4), function(i, repo) {
         var div = $("<div style=\"line-height:1em;\" />");
         $("<a/>").attr({href: repo.html_url, title: "View project on GitHub"}).text(repo.name).appendTo(div);
         div.append(" ");
         repoInfo(repo).appendTo(div);
         div.appendTo(updated);
         });*/
}

function date(text) {
   var d = new Date(text);
   return d.getFullYear() + "/" + (d.getMonth() < 9 ? "0" : "") + (d.getMonth() + 1) + "/" + (d.getDate() < 10 ? "0" : "") + d.getDate();
}

function plural(count, text, pluralText) {
   if (count > 1 || count == 0) {
      return pluralText ? count + pluralText : count + text + "s";
   }
   return count + text;
}

function ellipsify(desc, max) {
   if (desc.length > max) {
      return desc.substring(0, max - 3) + '...'
   }
   return desc
}

function repoInfo(repo) {
   var sub = $("<div class='sub'/>");
   //$("<a class=\"mini-icon mini-icon-public-fork\"/>").attr({href: repo.html_url+"/network", title: "Fork list"}).text(plural(repo.forks, " fork")).appendTo(sub);
   $("<a class=\"mini-icon mini-icon-public-fork\"/>").attr({href: repo.html_url+"/network", title: "Fork list"}).text(repo.forks + " ").appendTo(sub);
   sub.append("  ");

   //$("<a class=\"mini-icon mini-icon-watchers\"/>").attr({href: repo.html_url+"/watchers", title: "View watchers"}).text(plural(repo.watchers, " watcher")).appendTo(sub);
   $("<a class=\"mini-icon mini-icon-watchers\"/>").attr({href: repo.html_url+"/watchers", title: "View watchers"}).text(repo.watchers + " ").appendTo(sub);
   sub.append("  ");

   //$("<a class=\"mini-icon mini-icon-issues-open\"/>").attr({href: repo.html_url+"/issues", title: "Issue tracker"}).text(plural(repo.open_issues," issue")).appendTo(sub);
   $("<a class=\"mini-icon mini-icon-issues-open\"/>").attr({href: repo.html_url+"/issues", title: "Issue tracker"}).text(repo.open_issues + " ").appendTo(sub);
   sub.append("  ");

   $("<a class=\"mini-icon mini-icon-language\"/>").attr({href: repo.html_url, title: "View repo"}).text(repo.language + " ").appendTo(sub);
   //sub.append("  ");
   //$("<a/>").attr({href: repo.html_url+"/commits", title: "Last commit"}).text(date(repo.updated_at)).appendTo(sub);
   //sub.append("<br\>");
   //$("<a class=\"mini-icon mini-icon-watchers\"/>").attr({href: repo.html_url, title: "View repo"}).text("Languages: " + repo.language).appendTo(sub);
   return sub;
}

function addRepo(container, repo) {
   var span = $("<div class='span4' title='Click to view project on GitHub''/>");
   var div = $("<div class='repo'/>").appendTo(span);

   $("<h3/>").text(repo.name).appendTo(div);
   $("<p/>").text(ellipsify(repo.description, 80)).appendTo(div);

   repoInfo(repo).appendTo(div);

   //var fork = $("<a/>").attr({href: repo.html_url+"/fork_select", title: "Fork on GitHub", style: 'line-height: 2em;'}).appendTo(div);
   //fork.append("Fork ");
   //$("<i class='icon-share-alt'></i>").appendTo(fork);

   //var build_status = $("<div/>").addClass('status').appendTo(div);
   //var build_status_img = $("<img/>").attr(buildStatusByName(repo.name)).appendTo(build_status);

   div.click(function() {
         document.location = repo.html_url;
         });

   container.append(span);
}

function loadMembers (result) {
   var members = result.data;
   $("#members").text(plural(members.length, " member"));
}

var iconSize = 32;
var build_results;

function buildStatusByName(repoName) {

   if (build_results == null) {
      return {src: "http://arquillian.org/images/arquillian_icon_" + iconSize + "px.png", title: "Unknown build status"};
   }

   for (i = 0; i < build_results.entries.length; i++) {
      var build_result = build_results.entries[i];

      var repo = build_result.title.replace(/(.*)#.*\(.*\).*/, '$1').toLowerCase().trim();
      if (repo == repoName) {
         var status = build_result.title.replace(/.*\((.*.*)\).*/, '$1');
         if (status.indexOf("broken") != -1) {
            return {src: "http://arquillian.org/images/arquillian_ui_error_" + iconSize + "px.png", title: "Broken build :("};
         }
         if (status.indexOf("stable") != -1 || status.indexOf("normal") != -1) {
            return {src: "http://arquillian.org/images/arquillian_ui_success_" + iconSize + "px.png", title: "Build stable! :)"};
         }
         if (status.indexOf("fail") != -1) {
            return {src: "http://arquillian.org/images/arquillian_ui_failure_" + iconSize + "px.png", title: "Test failures :/"};
         }
         // unknown, might be building, use normal logo
         return {src: "http://arquillian.org/images/arquillian_icon_" + iconSize + "px.png", title: "Build in progress..."};
      }
   }
   // not found ?
   return {src: "http://arquillian.org/images/arquillian_icon_" + iconSize + "px.png", title: "Unknown build status"};
}

$(function () {
      /*$.jGFeed('https://arquillian.ci.cloudbees.com/rssLatest',
         function(feeds) {
         if (!feeds) {
         return false;
         }
         build_results = feeds;
         }, 50);*/

      //$.getJSON("https://api.github.com/orgs/arquillian/repos?callback=?", loadRepos);
      //$.getJSON("https://api.github.com/orgs/arquillian/members?callback=?", loadMembers);
      $.getJSON("https://api.github.com/users/hackerlabs/repos?callback=?", loadRepos);
      //$.getJSON("https://api.github.com/orgs/arquillian/members?callback=?", loadMembers);
      });
</script>


<div class="container" id="container">
<div class='page-header'>
<h1><a href="http://github.com/hackerlabs">github.com/hackerlabs</a> repositories</h1>
<p class="lead">
A list of hacks and projects on emerging innovations, technologies, and products from around the web.
</p>
</div>

<div class="row show-grid">
<div class="span4">
<div class="box">
<h3>Statistics</h3>
<div><a href="https://github.com/hackerlabs" title="View all HackerLabs repositories on GitHub" id="repositories"></a></div>
</div>
</div>

<div class="span8">
<div class="box">
<h3>Recently updated <a href="https://github.com/hackerlabs" title="View all HackerLabs repositories on GitHub">View all</a></h3>
<div id="updated"></div>
</div>
</div>
</div>
</div>
 <div style="clear: both;">
</div>
