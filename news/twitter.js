JQTWEET = {

	// Set twitter username, number of tweets & id/class to append tweets
	user: 'quenesstestacc',
	numTweets: 100,
	appendTo: '#jstwitter',
        currentPage: 1,
        nextPage: '',
        prevPage: '',

	// core function of jqtweet
	loadTweets: function(page) {
		$.ajax({
			//url: 'http://api.twitter.com/1/statuses/user_timeline.json/',
                        url: 'http://search.twitter.com/search.json',
			type: 'GET',
			dataType: 'jsonp',
			data: {
                                //q: 'facebook',
                                q: 'from:reconnect_Job #PHP',
				//screen_name: JQTWEET.user,
				include_rts: true,
				rpp: JQTWEET.numTweets,
				include_entities: true,
                                page: page,
			},
			success: function(data, textStatus, xhr) {
                                 $(JQTWEET.appendTo).html('');

                                 console.log("Loading page: " + page);
                                 //alert("Did get data" + data);
                                 console.log(data)

				 var html = '<div class="tweet">IMG_TAG TWEET_TEXT<div class="time">AGO</div>';
				 var img;
				 // append tweets into page
				 for (var i = 0; i < data.results.length; i++) {

					if ((data.results[i].entities != undefined) && (data.results[i].entities.media != undefined)) {
						img = '<a href="' + data.results[i].entities.media[0].media_url + ':large" class="fancy">';
						img += '<img src="' + data.results[i].entities.media[0].media_url + ':thumb" alt="" width="150" />';
						img += '</a>';
					} else {
						img = '';
					}


					$(JQTWEET.appendTo).append(
						html.replace('IMG_TAG', img)
							.replace('TWEET_TEXT', JQTWEET.ify.clean(data.results[i].text, img) )
							//.replace(/USER/g, data.results[i].user.screen_name)
							.replace('AGO', JQTWEET.timeAgo(data.results[i].created_at) )
							.replace(/ID/g, data.results[i].id_str)
					);


				 }

				//trigger jQuery Masonry once all data are loaded
				var $container = $('#jstwitter');
				$container.imagesLoaded(function(){
				  $container.masonry({
				    itemSelector : '.tweet',
				    columnWidth : 0,
				    isAnimated: true
				  });
				});

				//the last step, activate fancybox
				$("a.fancy").fancybox({
					'overlayShow'	: false,
					'transitionIn'	: 'elastic',
					'transitionOut'	: 'elastic',
					'overlayShow'	: true
				});

			}

		});

	},


	/**
      * relative time calculator FROM TWITTER
      * @param {string} twitter date string returned from Twitter API
      * @return {string} relative time like "2 minutes ago"
      */
    timeAgo: function(dateString) {
		var rightNow = new Date();
		var then = new Date(dateString);

		if ($.browser.msie) {
			// IE can't parse these crazy Ruby dates
			then = Date.parse(dateString.replace(/( \+)/, ' UTC$1'));
		}

		var diff = rightNow - then;

		var second = 1000,
		minute = second * 60,
		hour = minute * 60,
		day = hour * 24,
		week = day * 7;

		if (isNaN(diff) || diff < 0) {
			return ""; // return blank string if unknown
		}

		if (diff < second * 2) {
			// within 2 seconds
			return "right now";
		}

		if (diff < minute) {
			return Math.floor(diff / second) + " seconds ago";
		}

		if (diff < minute * 2) {
			return "about 1 minute ago";
		}

		if (diff < hour) {
			return Math.floor(diff / minute) + " minutes ago";
		}

		if (diff < hour * 2) {
			return "about 1 hour ago";
		}

		if (diff < day) {
			return  Math.floor(diff / hour) + " hours ago";
		}

		if (diff > day && diff < day * 2) {
			return "yesterday";
		}

		if (diff < day * 365) {
			return Math.floor(diff / day) + " days ago";
		}

		else {
			return "over a year ago";
		}
	}, // timeAgo()


    /**
      * The Twitalinkahashifyer!
      * http://www.dustindiaz.com/basement/ify.html
      * Eg:
      * ify.clean('your tweet text');
      */
    ify:  {
      link: function(tweet, hasIMG) {
        return tweet.replace(/\b(((https*\:\/\/)|www\.)[^\"\']+?)(([!?,.\)]+)?(\s|$))/g, function(link, m1, m2, m3, m4) {
          var http = m2.match(/w/) ? 'http://' : '';
          if (hasIMG) return '';
          else return '<a class="twtr-hyperlink" target="_blank" href="' + http + m1 + '">' + ((m1.length > 25) ? m1.substr(0, 24) + '...' : m1) + '</a>' + m4;
        });
      },

      at: function(tweet) {
        return tweet.replace(/\B[@＠]([a-zA-Z0-9_]{1,20})/g, function(m, username) {
          return '<a target="_blank" class="twtr-atreply" href="http://twitter.com/intent/user?screen_name=' + username + '">@' + username + '</a>';
        });
      },

      list: function(tweet) {
        return tweet.replace(/\B[@＠]([a-zA-Z0-9_]{1,20}\/\w+)/g, function(m, userlist) {
          return '<a target="_blank" class="twtr-atreply" href="http://twitter.com/' + userlist + '">@' + userlist + '</a>';
        });
      },

      hash: function(tweet) {
        return tweet.replace(/(^|\s+)#(\w+)/gi, function(m, before, hash) {
          return before + '<a target="_blank" class="twtr-hashtag" href="http://twitter.com/search?q=%23' + hash + '">#' + hash + '</a>';
        });
      },

      clean: function(tweet , hasIMG) {
	      return this.hash(this.at(this.list(this.link(tweet, hasIMG))));

      }
    } // ify


};

// start jqtweet!
JQTWEET.loadTweets(1);


var boxMaker = {};

boxMaker.lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eu interdum odio. Cras lobortis mauris vitae tellus consectetur sit amet cursus ipsum vestibulum. Duis facilisis sodales tristique. Vivamus aliquet, est a rhoncus dapibus, velit tortor tempor turpis, a pharetra diam lacus a metus. Donec gravida faucibus magna, nec laoreet nibh placerat et. Cras magna lorem, faucibus vitae rhoncus ac, tincidunt vel velit. Mauris aliquam, risus vel sodales laoreet, mi nulla faucibus nunc, eu tincidunt nisi leo sed orci. Curabitur sagittis libero eu augue luctus ullamcorper. Phasellus sed tortor sed nunc elementum rutrum. Maecenas eu enim a nulla faucibus commodo iaculis tempor orci. Integer at ligula id mauris semper bibendum at eu erat. Integer vestibulum sem nec risus iaculis eu rhoncus tellus tempor. Suspendisse potenti. Sed bibendum nibh non velit blandit eu adipiscing ligula consectetur. Vivamus turpis quam, fringilla a elementum a, condimentum non purus. Pellentesque sed bibendum ante. Fusce elit mauris, pulvinar sed rutrum eget, malesuada in nisi. Etiam sagittis pretium ligula. Aliquam a metus orci, a molestie lacus. Suspendisse potenti. Mauris vel volutpat nunc. In condimentum imperdiet scelerisque. Cras aliquam tristique velit non iaculis. Aliquam pulvinar sagittis sodales. Aenean risus orci, elementum quis accumsan eget, elementum cursus tellus. Nunc vel laoreet odio. Maecenas sollicitudin, tellus vel bibendum ornare, tellus nibh hendrerit lorem, quis volutpat turpis odio ac ligula. Etiam tempus neque id libero feugiat fringilla. Nullam posuere consequat vehicula. Mauris in lorem eget sem tempor condimentum. Integer rhoncus accumsan elit eu gravida. Donec dictum ante ac nisl adipiscing vel tempor libero luctus. Praesent bibendum augue at erat semper rutrum. Fusce vel orci nulla. Vivamus condimentum, odio vel condimentum tempus, mauris ipsum gravida odio, sed viverra dolor velit sit amet magna. Donec aliquam malesuada ipsum ut suscipit. Vivamus porttitor posuere iaculis. Vestibulum lectus lorem, tincidunt at sodales et, euismod vel quam. Sed eget urna nunc. In quis felis nunc. Aliquam erat volutpat. Cras ut dui ac leo aliquet placerat faucibus in nulla. Mauris pharetra ligula et tortor ultricies eget elementum libero blandit. Praesent tincidunt, mi quis aliquam faucibus, leo risus placerat odio, ac adipiscing ante urna at tortor.'.split(".");

boxMaker.loremLen = boxMaker.lorem.length;

boxMaker.randoLoremText = function() {
  var loremText = '',
      sentences = Math.random() * 5;
  for (var j=0; j < sentences; j++ ) {
    var whichSentence = Math.floor( Math.random() * boxMaker.loremLen );
    loremText += boxMaker.lorem[whichSentence] + '. ';
  }
  return loremText;
};

boxMaker.makeBoxes = function() {
  var boxes = [],
      count = Math.random()*4;

  for (var i=0; i < count; i++ ) {
    var box = document.createElement('div'),
        text = document.createTextNode( boxMaker.randoLoremText() );

    box.className = 'box col' +  Math.ceil( Math.random()*3 );
    box.appendChild( text );
    // add box DOM node to array of new elements
    boxes.push( box );
  }

  return boxes;
};

$(function(){
    var globalpage = 1;
    var $container = $('#jstwitter');
    $('#prepend').click(function(){
      var $boxes = $( boxMaker.makeBoxes() );
      $container.prepend( $boxes ).masonry( 'reload' );
    });

    $('#append').click(function(){
      $container.html('');
      JQTWEET.loadTweets(globalpage);
      globalpage = globalpage + 1;
      //var $boxes = $( boxMaker.makeBoxes() );
      //$container.append( $boxes ).masonry( 'appended', $boxes );
    });


});
