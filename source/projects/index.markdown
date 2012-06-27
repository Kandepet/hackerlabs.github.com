---
layout: page
title: "List of projects"
date: 2012-06-08 11:55
comments: false
sharing: true
footer: true
keywords: "Hacker Labs, hackerlabs, Deepak Kandepet, kandepet, svbtle for octopress"
description: "List of projects by Hacker Labs"

pictures:
  - url: http://placehold.it/260x180
    label: Label 1
    caption: Caption 1
  - url: http://placehold.it/260x180
    label: Label 2
    caption: Caption 2
  - url: http://placehold.it/260x180
    label: Label 3
    caption: Caption 3
---

{::options parse_block_html="true" /}

{% for pic in page.pictures %}
 <li class="span3">
  <div class="thumbnail">
   [![image]({{ pic.url }})](#)

   ##### {{ pic.label }}

   {{ pic.caption }}
  </div>
 </li>
{% endfor %}
