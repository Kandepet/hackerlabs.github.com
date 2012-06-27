---
layout: page
title: "news"
date: 2012-06-12 00:25
comments: true
sharing: true
footer: true
---

<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js" type="text/javascript"></script>
<script type="text/javascript" src="fancybox/jquery.mousewheel-3.0.4.pack.js"></script>
<script type="text/javascript" src="fancybox/jquery.fancybox-1.3.4.pack.js"></script>
<script src="twitter.js"></script>
<script src="jquery.masonry.min.js"></script>
<link rel="stylesheet" type="text/css" href="fancybox/jquery.fancybox-1.3.4.css" media="screen" />
<link rel="stylesheet" type="text/css" href="twitter.css" media="screen" />

<section id="intro">
<hgroup>
<h1>NEWS AND ARTICLES</h1>
<p>These are a collection of interesting links and articles that I come across, usually from hacker news. I tweet these <a href="http://twitter.com/hackerlabs">@hackerlabs</a> with either #article or #link. What you see below is a dynamic aggregation of the latest 100 of those tweets.</p>
</hgroup>

</section>

<br />
<br/>

<div id="paging">
<div id="jstwitter">Loading data, please wait ...</div>
      <div class="controls">
        {% comment %} <button class="prev" type="button" disabled="">&larr;</button>
        <span class="pagenum"></span>
        <button class="next" type="button" disabled="">&rarr;</button>{% endcomment %}
<div style="clear:both"></div>
      </div>
</div>
